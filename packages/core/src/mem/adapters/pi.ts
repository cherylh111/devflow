/**
 * Persisted Pi Agent session reader.
 *
 * Layout: `~/.pi/agent/sessions/--<encoded-cwd>--/<timestamp>_<id>.jsonl`
 * for the default store, or direct `.jsonl` files under an env/settings
 * configured custom session directory. Entries form a tree via `id` / `parentId`;
 * extraction follows only the active branch (last entry leaf) and mirrors Pi's
 * compaction context rules.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { stripInjectionTags, isBootstrapTurn } from "../dialogue.js";
import { inRangeOverlap, sameProject } from "../filter.js";
import { readJsonl, readJsonlFirst } from "../internal/jsonl.js";
import { piSessionRoots, walkDir } from "../internal/paths.js";
import { parseTaskPyCommandsAll } from "../phase.js";
import { searchInDialogue } from "../search.js";
import type {
  DialogueRole,
  DialogueTurn,
  MemFilter,
  MemSessionInfo,
  SearchHit,
  TaskPyEvent,
} from "../types.js";

// ---------- loose external shapes ----------

interface PiContentBlock {
  type?: string;
  text?: string;
  thinking?: string;
  name?: unknown;
  arguments?: unknown;
  data?: unknown;
}

interface PiMessage {
  role?: string;
  content?: string | PiContentBlock[];
  command?: string;
  output?: string;
}

interface PiEntry {
  type?: string;
  id?: string;
  parentId?: string | null;
  timestamp?: string;
  cwd?: string;
  message?: PiMessage;
  name?: string;
  summary?: string;
  firstKeptEntryId?: string;
  fromId?: string;
  version?: number;
  tokensBefore?: number;
}

// ---------- tree traversal ----------

function buildActiveBranch(entries: PiEntry[]): PiEntry[] {
  if (entries.length === 0) return [];
  const byId = new Map<string, PiEntry>();
  const children = new Map<string | null, PiEntry[]>();
  for (const e of entries) {
    if (e.id) byId.set(e.id, e);
    const pid = e.parentId ?? null;
    const list = children.get(pid) ?? [];
    list.push(e);
    children.set(pid, list);
  }
  // Find leaf — last entry with no children
  let leaf: PiEntry | undefined;
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (!e) continue;
    if (e.id && !(children.get(e.id)?.length)) {
      leaf = e;
      break;
    }
  }
  leaf ??= entries[entries.length - 1];

  // Walk back to root
  const branch: PiEntry[] = [];
  let cur: PiEntry | undefined = leaf;
  while (cur) {
    branch.push(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  branch.reverse();
  return branch;
}

// ---------- dialogue extraction ----------

function textFromContent(content: string | PiContentBlock[] | undefined): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  const parts: string[] = [];
  for (const block of content) {
    if (block.type === "text" && block.text) parts.push(block.text);
  }
  return parts.join("\n");
}

function roleFromEntry(e: PiEntry): DialogueRole | null {
  const r = e.message?.role;
  if (r === "user") return "user";
  if (r === "assistant") return "assistant";
  return null;
}

function extractBranchDialogue(branch: PiEntry[]): DialogueTurn[] {
  const turns: DialogueTurn[] = [];
  let compactionId: string | undefined;
  let firstKeptId: string | undefined;

  // Find compaction entry
  for (const e of branch) {
    if (e.type === "compaction") {
      compactionId = e.id;
      firstKeptId = e.firstKeptEntryId;
      break;
    }
  }

  let started = !compactionId;
  let compactionSummaryEmitted = false;

  for (const e of branch) {
    if (!started) {
      if (e.type === "compaction") {
        // Emit the compaction summary as a synthetic assistant turn
        if (e.summary && !compactionSummaryEmitted) {
          turns.push({
            role: "assistant",
            text: `[compact summary]\n${e.summary}`,
          });
          compactionSummaryEmitted = true;
        }
        started = true;
        continue;
      }
      if (firstKeptId && e.id === firstKeptId) {
        // Emit compaction summary before the kept entry
        if (!compactionSummaryEmitted) {
          const compEntry = branch.find((x) => x.type === "compaction");
          if (compEntry?.summary) {
            turns.push({
              role: "assistant",
              text: `[compact summary]\n${compEntry.summary}`,
            });
            compactionSummaryEmitted = true;
          }
        }
        started = true;
        // fall through to process this entry
      } else {
        continue;
      }
    }

    if (e.type === "compaction") continue;

    if (e.type === "branch_summary") {
      turns.push({
        role: "assistant",
        text: `[branch summary]\n${e.summary ?? ""}`,
      });
      continue;
    }

    if (e.type === "session_info" || e.type === "session") continue;

    const role = roleFromEntry(e);
    if (!role) continue;

    const raw = textFromContent(e.message?.content);
    if (!raw) continue;

    const cleaned = stripInjectionTags(raw);
    if (!cleaned || isBootstrapTurn(cleaned, raw.length)) continue;
    turns.push({ role, text: cleaned });
  }

  return turns;
}

// ---------- shell command extraction for phase detection ----------

function extractShellCommands(
  branch: PiEntry[],
): { command: string; turnIndex: number }[] {
  const cmds: { command: string; turnIndex: number }[] = [];
  let turnIdx = -1;

  let compactionId: string | undefined;
  let firstKeptId: string | undefined;
  for (const e of branch) {
    if (e.type === "compaction") {
      compactionId = e.id;
      firstKeptId = e.firstKeptEntryId;
      break;
    }
  }

  let started = !compactionId;

  for (const e of branch) {
    if (!started) {
      if (e.type === "compaction") {
        started = true;
        turnIdx++; // compaction summary is a turn
        continue;
      }
      if (firstKeptId && e.id === firstKeptId) {
        started = true;
        turnIdx++; // compaction summary turn
        // fall through
      } else {
        continue;
      }
    }

    if (e.type === "compaction" || e.type === "session_info" || e.type === "session") continue;

    if (e.type === "branch_summary") {
      turnIdx++;
      continue;
    }

    const role = roleFromEntry(e);
    if (role) {
      const raw = textFromContent(e.message?.content);
      if (raw) {
        const cleaned = stripInjectionTags(raw);
        if (cleaned && !isBootstrapTurn(cleaned, raw.length)) {
          turnIdx++;
        }
      }
    }

    // Extract commands from assistant toolCall blocks
    if (e.message?.role === "assistant" && Array.isArray(e.message.content)) {
      for (const block of e.message.content as PiContentBlock[]) {
        if (
          block.type === "toolCall" &&
          (block.name === "bash" || block.name === "shell" || block.name === "Bash") &&
          block.arguments &&
          typeof block.arguments === "object"
        ) {
          const cmd = (block.arguments as { command?: string }).command;
          if (cmd) cmds.push({ command: cmd, turnIndex: turnIdx });
        }
      }
    }

    // Extract from bashExecution messages
    if (e.message?.role === "bashExecution" && e.message.command) {
      cmds.push({ command: e.message.command, turnIndex: turnIdx + 1 });
    }
  }

  return cmds;
}

// ---------- public adapter API ----------

export function piListSessions(f: MemFilter): MemSessionInfo[] {
  const out: MemSessionInfo[] = [];
  const roots = piSessionRoots();

  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const filePath of walkDir(root)) {
      if (!filePath.endsWith(".jsonl")) continue;
      const first = readJsonlFirst(filePath) as PiEntry | undefined;
      if (first?.type !== "session") continue;

      const cwd = first.cwd;
      if (f.cwd && cwd && !sameProject(cwd, f.cwd)) continue;
      if (f.since || f.until) {
        const ts = first.timestamp;
        if (ts && !inRangeOverlap(ts, ts, f)) continue;
      }

      // Find title from last session_info entry
      let title: string | undefined;
      const entries: PiEntry[] = [];
      readJsonl<PiEntry>(filePath, (e) => { entries.push(e); });
      for (const e of entries) {
        if (e.type === "session_info" && e.name) title = e.name;
      }

      out.push({
        platform: "pi",
        id: first.id ?? path.basename(filePath, ".jsonl"),
        title,
        cwd,
        created: first.timestamp,
        updated: entries[entries.length - 1]?.timestamp ?? first.timestamp,
        filePath,
      });
    }
  }

  return out;
}

export function piExtractDialogue(s: MemSessionInfo): DialogueTurn[] {
  const entries: PiEntry[] = [];
  readJsonl<PiEntry>(s.filePath, (e) => { entries.push(e); });
  const branch = buildActiveBranch(entries);
  return extractBranchDialogue(branch);
}

export function piSearch(s: MemSessionInfo, kw: string): SearchHit {
  return searchInDialogue(piExtractDialogue(s), kw);
}

export function collectPiTurnsAndEvents(s: MemSessionInfo): {
  turns: DialogueTurn[];
  events: TaskPyEvent[];
} {
  const entries: PiEntry[] = [];
  readJsonl<PiEntry>(s.filePath, (e) => { entries.push(e); });
  const branch = buildActiveBranch(entries);
  const turns = extractBranchDialogue(branch);
  const shellCmds = extractShellCommands(branch);

  const events: TaskPyEvent[] = [];
  for (const { command, turnIndex } of shellCmds) {
    const parsed = parseTaskPyCommandsAll(command);
    for (const p of parsed) {
      events.push({
        ...p,
        timestamp: "",
        turnIndex,
      });
    }
  }

  return { turns, events };
}
