/**
 * mem.ts — CLI wrapper over `@enpd/devflow-core/mem`.
 *
 * The reusable retrieval / context-extraction logic lives in core; this file
 * owns only CLI concerns: argument parsing, terminal rendering, the OpenCode
 * "reader unavailable" notice, and process exit behavior.
 *
 * Commands:
 *   list                          list sessions (default if no command)
 *   search <keyword>              find sessions whose contents match keyword
 *   context <session-id>          drill-down: top-N hit turns + surrounding context
 *   extract <session-id>          dump cleaned dialogue (use --grep KW to filter turns)
 *   projects                      list active project cwds (AI-routing entry point)
 *
 * Run `devflow mem help` for the full flag reference.
 */

import * as os from "node:os";
import * as path from "node:path";

import {
  claudeExtractDialogue,
  claudeListSessions,
  claudeSearch as coreClaudeSearch,
  codexExtractDialogue,
  codexListSessions,
  codexSearch as coreCodexSearch,
  collectClaudeTurnsAndEvents,
  collectCodexTurnsAndEvents,
  commandFromCodexArguments,
  extractMemDialogue,
  inRange,
  inRangeOverlap,
  listMemProjects,
  listMemSessions,
  MemSessionNotFoundError,
  opencodeExtractDialogue as coreOpencodeExtractDialogue,
  opencodeListSessions as coreOpencodeListSessions,
  opencodeSearch,
  parseTaskPyCommand,
  parseTaskPyCommandsAll,
  readMemContext,
  searchMemSessions,
  slugFromTaskDir,
  splitShellArgs,
  buildBrainstormWindows,
} from "@enpd/devflow-core/mem";
import { localized } from "../utils/language-config.js";
import type {
  DialogueTurn,
  MemFilter,
  MemPhase,
  MemSessionInfo,
  MemSourceFilter,
  MemSourceKind,
  ParsedTaskPyCommand,
  SearchHit,
  TaskPyEvent,
} from "@enpd/devflow-core/mem";

export {
  claudeExtractDialogue,
  claudeListSessions,
  codexExtractDialogue,
  codexListSessions,
  collectClaudeTurnsAndEvents,
  collectCodexTurnsAndEvents,
  commandFromCodexArguments,
  inRange,
  inRangeOverlap,
  opencodeSearch,
  parseTaskPyCommand,
  parseTaskPyCommandsAll,
  slugFromTaskDir,
  splitShellArgs,
  buildBrainstormWindows,
};

export type { ParsedTaskPyCommand, TaskPyEvent };

type LegacySearchHit = SearchHit & {
  user_count: number;
  asst_count: number;
  total_turns: number;
};

function withLegacySearchFields(hit: SearchHit): LegacySearchHit {
  return {
    ...hit,
    user_count: hit.userCount,
    asst_count: hit.asstCount,
    total_turns: hit.totalTurns,
  };
}

export function claudeSearch(
  session: MemSessionInfo,
  keyword: string,
): LegacySearchHit {
  return withLegacySearchFields(coreClaudeSearch(session, keyword));
}

export function codexSearch(
  session: MemSessionInfo,
  keyword: string,
): LegacySearchHit {
  return withLegacySearchFields(coreCodexSearch(session, keyword));
}

// ---------- argv ----------

export interface Argv {
  cmd: string;
  positional: string[];
  flags: Record<string, string | boolean>;
}

export function parseArgv(argv: readonly string[]): Argv {
  const cmd = argv[0] ?? "list";
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === undefined) continue;
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(a);
    }
  }
  return { cmd, positional, flags };
}

const VALID_PLATFORMS: readonly string[] = [
  "claude",
  "codex",
  "opencode",
  "all",
];

/** Translate parsed CLI flags into a core `MemFilter`. Validation failures
 * exit the process — core never sees raw CLI flags. */
export function buildFilter(flags: Argv["flags"]): MemFilter {
  const platformRaw =
    typeof flags.platform === "string" ? flags.platform : "all";
  if (!VALID_PLATFORMS.includes(platformRaw))
    die(localized(`unknown platform: ${platformRaw}`, `未知平台：${platformRaw}`));
  const platform = platformRaw as MemSourceFilter;

  const sinceRaw = flags.since;
  const since = typeof sinceRaw === "string" ? new Date(sinceRaw) : undefined;
  if (since && Number.isNaN(+since)) {
    die(localized(`bad --since: ${String(sinceRaw)}`, `无效 --since：${String(sinceRaw)}`));
  }

  const untilRaw = flags.until;
  const until =
    typeof untilRaw === "string"
      ? new Date(`${untilRaw}T23:59:59.999Z`)
      : undefined;
  if (until && Number.isNaN(+until)) {
    die(localized(`bad --until: ${String(untilRaw)}`, `无效 --until：${String(untilRaw)}`));
  }

  const cwd = flags.global
    ? undefined
    : normalizeProjectCwd(
        typeof flags.cwd === "string" ? flags.cwd : process.cwd(),
      );

  const limit = parseOptionalNumberFlag(flags.limit, "--limit", 50);

  return { platform, since, until, cwd, limit };
}

function normalizeProjectCwd(value: string): string {
  if (process.platform === "win32" && value.startsWith("/")) {
    return path.posix.normalize(value);
  }
  return path.resolve(value);
}

function parseOptionalNumberFlag(
  raw: string | boolean | undefined,
  name: string,
  fallback: number,
): number {
  if (raw === undefined || raw === false) return fallback;
  if (typeof raw !== "string") {
    die(localized(`${name} requires a number`, `${name} 需要数字`));
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) die(localized(`bad ${name}: ${raw}`, `无效 ${name}：${raw}`));
  return value;
}

function die(msg: string): never {
  console.error(localized(`error: ${msg}`, `错误：${msg}`));
  process.exit(2);
}

// ---------- OpenCode reader notice ----------
//
// OpenCode 1.2+ moved to a SQLite store; the native dependency was reverted in
// 0.6.0-beta.4 due to install failures. Core's OpenCode adapter is a silent
// no-op — surfacing the degraded state is a CLI presentation concern, emitted
// once per process whenever the OpenCode source is in scope.

let opencodeWarned = false;
function warnOpencodeUnavailable(): void {
  if (opencodeWarned) return;
  opencodeWarned = true;
  process.stderr.write(
    "⚠️  devflow mem: OpenCode platform reader is temporarily unavailable in this build.\n" +
      "    OpenCode 1.2+ moved to SQLite; the native dependency was reverted in\n" +
      "    0.6.0-beta.4 due to install failures. Re-enabled in a future release.\n",
  );
}

function maybeWarnOpencode(f: MemFilter): void {
  if (f.platform === "all" || f.platform === "opencode")
    warnOpencodeUnavailable();
}

export function opencodeListSessions(f: MemFilter): MemSessionInfo[] {
  warnOpencodeUnavailable();
  return coreOpencodeListSessions(f);
}

export function opencodeExtractDialogue(
  s: MemSessionInfo,
): DialogueTurn[] {
  warnOpencodeUnavailable();
  return coreOpencodeExtractDialogue(s);
}

// ---------- formatting ----------

const HOME = os.homedir();

export function shortDate(iso?: string): string {
  if (!iso) return "         ";
  return iso.slice(0, 16).replace("T", " ");
}

export function shortPath(p?: string): string {
  if (!p) return localized("(no cwd)", "（无 cwd）");
  return p.replace(HOME, "~");
}

function printSessions(rows: readonly MemSessionInfo[]): void {
  if (rows.length === 0) {
    console.log(localized("(no sessions)", "（无会话）"));
    return;
  }
  for (const s of rows) {
    const id = s.id.length > 12 ? s.id.slice(0, 12) : s.id.padEnd(12);
    const parentTag = s.parent_id
      ? `  ↳ child of ${s.parent_id.slice(0, 12)}`
      : "";
    console.log(
      `[${s.platform.padEnd(8)}] ${shortDate(s.updated ?? s.created)}  ${id}  ${shortPath(s.cwd)}` +
        (s.title ? `  — ${s.title}` : "") +
        parentTag,
    );
  }
}

// ---------- commands ----------

function cmdList(argv: Argv): void {
  const f = buildFilter(argv.flags);
  maybeWarnOpencode(f);
  const rows = listMemSessions({ filter: f });
  if (argv.flags.json) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }
  console.log(
    `${localized("scope", "范围")}: ${f.cwd ? `project=${shortPath(f.cwd)}` : localized("global", "全局")}  platform=${f.platform}` +
      (f.since ? `  since=${f.since.toISOString().slice(0, 10)}` : "") +
      (f.until ? `  until=${f.until.toISOString().slice(0, 10)}` : ""),
  );
  printSessions(rows);
  console.log(localized(`\n${rows.length} session(s)`, `\n${rows.length} 个会话`));
}

function cmdSearch(argv: Argv): void {
  const kw = argv.positional[0];
  if (!kw) die(localized("usage: search <keyword>", "用法：search <keyword>"));
  const f = buildFilter(argv.flags);
  maybeWarnOpencode(f);
  const includeChildren = argv.flags["include-children"] === true;
  const result = searchMemSessions({
    keyword: kw,
    filter: f,
    includeChildren,
  });
  const top = result.matches;

  if (argv.flags.json) {
    console.log(
      JSON.stringify(
        top.map((m) => ({
          session: m.session,
          score: Number(m.score.toFixed(4)),
          hit_count: m.hit.count,
          user_count: m.hit.userCount,
          asst_count: m.hit.asstCount,
          total_turns: m.hit.totalTurns,
          descendants_merged: includeChildren ? m.descendantsMerged : 0,
          excerpts: m.hit.excerpts,
        })),
        null,
        2,
      ),
    );
    return;
  }
  console.log(
    `${localized("scope", "范围")}: ${f.cwd ? `project=${shortPath(f.cwd)}` : localized("global", "全局")}  ${localized("keyword", "关键词")}="${kw}"  platform=${f.platform}` +
      (includeChildren ? `  include-children=on` : ""),
  );
  if (top.length === 0) {
    console.log(localized("(no matches)", "（无匹配）"));
    return;
  }
  for (const m of top) {
    const s = m.session;
    const idShort = s.id.slice(0, 12);
    const score = m.score.toFixed(3);
    const childTag =
      includeChildren && m.descendantsMerged > 0
        ? `  +${m.descendantsMerged} child`
        : "";
    console.log(
      `\n[${s.platform.padEnd(8)}] ${shortDate(s.updated ?? s.created)}  ${idShort}  ${shortPath(s.cwd)}` +
        `  score=${score}  hits=${m.hit.count} (u=${m.hit.userCount},a=${m.hit.asstCount})  turns=${m.hit.totalTurns}${childTag}` +
        (s.title ? `  — ${s.title}` : ""),
    );
    for (const ex of m.hit.excerpts) {
      console.log(`    [${ex.role}] ${ex.snippet}`);
    }
  }
  console.log(
    localized(
      `\n${top.length} session(s)${result.totalMatches > top.length ? ` (of ${result.totalMatches})` : ""}`,
      `\n${top.length} 个会话${result.totalMatches > top.length ? `（共 ${result.totalMatches} 个）` : ""}`,
    ),
  );
}

function cmdProjects(argv: Argv): void {
  // Distinct cwds across all platforms with last-active timestamp + per-platform
  // session counts. AI calls this first to learn which project paths have
  // recent activity, then picks one for `--cwd` in a follow-up `search`.
  const f = buildFilter({ ...argv.flags, global: true });
  maybeWarnOpencode(f);
  const rows = listMemProjects({ filter: f });
  const limit = parseOptionalNumberFlag(argv.flags.limit, "--limit", 30);
  const top = rows.slice(0, limit);

  if (argv.flags.json) {
    console.log(JSON.stringify(top, null, 2));
    return;
  }
  console.log(
    localized("active projects", "活跃项目") +
      (f.since ? `  since=${f.since.toISOString().slice(0, 10)}` : "") +
      (f.until ? `  until=${f.until.toISOString().slice(0, 10)}` : ""),
  );
  if (top.length === 0) {
    console.log(localized("(none)", "（无）"));
    return;
  }
  for (const r of top) {
    const parts = (Object.entries(r.by_platform) as [MemSourceKind, number][])
      .filter(([, n]) => n > 0)
      .map(([p, n]) => `${p}:${n}`)
      .join(" ");
    console.log(
      `${shortDate(r.last_active)}  sessions=${r.sessions.toString().padStart(3)} (${parts})  ${shortPath(r.cwd)}`,
    );
  }
  console.log(
    localized(
      `\n${top.length} project(s)${rows.length > top.length ? ` (of ${rows.length})` : ""}`,
      `\n${top.length} 个项目${rows.length > top.length ? `（共 ${rows.length} 个）` : ""}`,
    ),
  );
}

function cmdContext(argv: Argv): void {
  // Drill-down step 2 in the search workflow: `search <kw>` picks a session,
  // then `context <id> --grep <kw>` returns top-N hit turns with surrounding
  // context, token-budgeted for AI consumption. Without --grep: first N turns.
  const id = argv.positional[0];
  if (!id)
    die(
      localized(
        "usage: context <session-id> [--grep KW] [--turns N] [--around M]",
        "用法：context <session-id> [--grep KW] [--turns N] [--around M]",
      ),
    );
  const f = buildFilter(argv.flags);
  maybeWarnOpencode(f);

  const grepRaw = argv.flags.grep;
  const grep = typeof grepRaw === "string" ? grepRaw : undefined;
  if (grep?.split(/\s+/).filter(Boolean).length === 0)
    die(localized("--grep requires non-empty value", "--grep 需要非空值"));
  const nTurns = parseOptionalNumberFlag(argv.flags.turns, "--turns", 3);
  const around = parseOptionalNumberFlag(argv.flags.around, "--around", 1);
  const maxChars = parseOptionalNumberFlag(
    argv.flags["max-chars"],
    "--max-chars",
    6000,
  );
  const includeChildren = argv.flags["include-children"] === true;

  let result;
  try {
    result = readMemContext({
      sessionId: id,
      filter: f,
      grep,
      turns: nTurns,
      around,
      maxChars,
      includeChildren,
    });
  } catch (error) {
    if (error instanceof MemSessionNotFoundError)
      die(localized(`session not found: ${id}`, `未找到会话：${id}`));
    throw error;
  }
  const s = result.session;

  if (argv.flags.json) {
    console.log(
      JSON.stringify(
        {
          session: s,
          query: result.query,
          total_turns: result.totalTurns,
          total_hit_turns: result.totalHitTurns,
          merged_children: result.mergedChildren,
          turns: result.turns.map((t) => ({
            idx: t.idx,
            role: t.role,
            text: t.text,
            is_hit: t.isHit,
          })),
        },
        null,
        2,
      ),
    );
    return;
  }

  // `hitIndices.length` from the legacy implementation — recomputed here for
  // the human-readable header only.
  const shown = grep
    ? Math.min(result.totalHitTurns, nTurns)
    : Math.min(nTurns, result.totalTurns);

  console.log(`# context: [${s.platform}] ${s.id}`);
  if (s.title) console.log(`# title: ${s.title}`);
  if (s.cwd) console.log(`# cwd:   ${shortPath(s.cwd)}`);
  if (grep)
    console.log(
      `# query: "${grep}"  hit_turns=${result.totalHitTurns}  showing top ${shown}`,
    );
  else
    console.log(
      `# no grep — showing first ${shown} turns of ${result.totalTurns}`,
    );
  if (result.mergedChildren > 0)
    console.log(`# merged_children: ${result.mergedChildren}`);
  console.log(
    `# turns shown: ${result.turns.length}  budget_used: ${result.budgetUsed}/${result.maxChars} chars`,
  );
  console.log("");

  for (const t of result.turns) {
    const marker = t.isHit ? "  ← hit" : "";
    console.log(`## turn ${t.idx} (${t.role})${marker}\n`);
    console.log(t.text);
    console.log("\n---\n");
  }
}

function parsePhaseFlag(raw: unknown): MemPhase {
  if (raw === undefined || raw === false) return "all";
  if (raw === "brainstorm" || raw === "implement" || raw === "all") return raw;
  die(
    localized(
      `unknown --phase: ${String(raw)} (expected brainstorm|implement|all)`,
      `未知 --phase：${String(raw)}（应为 brainstorm|implement|all）`,
    ),
  );
}

function cmdExtract(argv: Argv): void {
  const id = argv.positional[0];
  if (!id) die(localized("usage: extract <session-id>", "用法：extract <session-id>"));
  const f = buildFilter(argv.flags);
  maybeWarnOpencode(f);

  const phase = parsePhaseFlag(argv.flags.phase);
  const grepRaw = argv.flags.grep;
  const grep = typeof grepRaw === "string" ? grepRaw.toLowerCase() : undefined;

  let result;
  try {
    result = extractMemDialogue({ sessionId: id, filter: f, phase, grep });
  } catch (error) {
    if (error instanceof MemSessionNotFoundError)
      die(localized(`session not found: ${id}`, `未找到会话：${id}`));
    throw error;
  }

  for (const w of result.warnings) {
    console.error(localized(`warning: ${w.message}`, `警告：${w.message}`));
  }

  const s = result.session;
  if (argv.flags.json) {
    console.log(
      JSON.stringify(
        {
          session: s,
          phase: result.phase,
          windows: result.windows,
          total_turns: result.totalTurns,
          groups: result.groups,
          turns: result.turns,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(`# session: [${s.platform}] ${s.id}`);
  if (s.title) console.log(`# title: ${s.title}`);
  if (s.cwd) console.log(`# cwd:   ${shortPath(s.cwd)}`);
  if (s.created) console.log(`# date:  ${shortDate(s.created)}`);
  console.log(
    `# phase: ${result.phase}  turns: ${result.turns.length}/${result.totalTurns}` +
      (grep ? ` (filtered by /${grep}/)` : "") +
      (result.windows.length > 0 ? `  windows: ${result.windows.length}` : ""),
  );
  console.log("");
  for (const g of result.groups) {
    if (g.label !== null) console.log(`--- task: ${g.label} ---\n`);
    for (const t of g.turns) {
      console.log(`## ${t.role === "user" ? "Human" : "Assistant"}\n`);
      console.log(t.text);
      console.log("\n---\n");
    }
  }
}

function cmdHelp(): void {
  if (localized("en", "zh") === "zh") {
    console.log(`devflow mem - 列出/搜索 Claude/Codex/OpenCode 会话

命令：
  list                          列出会话（未指定命令时的默认命令）
  search <keyword>              查找内容匹配关键词的会话
  context <session-id>          深入查看：返回命中回合及其上下文
                                （通常配合 search 使用；用 --grep KW 锚定关键词）
  extract <session-id>          导出清理后的对话（用 --grep KW 过滤回合）
  projects                      列出活跃项目 cwd 和会话数量，用于发现 search 的 --cwd

参数：
  --platform claude|codex|opencode|all   默认 all
  --since YYYY-MM-DD                     起始日期（包含）
  --until YYYY-MM-DD                     截止日期（包含）
  --global                               包含所有项目（默认限制在当前 cwd）
  --cwd <path>                           覆盖项目 cwd
  --limit N                              输出上限（默认 50）
  --grep KW                              extract/context：按关键词过滤回合（多词为 AND）
  --phase brainstorm|implement|all       extract：按 DevFlow brainstorm 窗口切片
                                         （默认 all；brainstorm = [task.py create, task.py start)；
                                         支持 Claude/Codex；OpenCode 会警告并返回全部）
  --turns N                              context：返回命中回合数（默认 3）
  --around N                             context：每个命中周围的上下文回合数（默认 1）
  --max-chars N                          context：总字符预算（默认 6000，约 1500 token）
  --include-children                     search/context：将 OpenCode 子 agent 会话合并到父会话
  --json                                 输出 JSON
  --help, -h                             显示此帮助

示例：
  devflow mem list
  devflow mem list --global --platform claude --since 2026-04-01
  devflow mem search "session insight" --global
  devflow mem extract 5842592d --grep memory
  devflow mem extract 5842592d --phase brainstorm
`);
    return;
  }
  console.log(`devflow mem — list/search Claude/Codex/OpenCode sessions

commands:
  list                          list sessions (default if no command)
  search <keyword>              find sessions whose contents match keyword
  context <session-id>          drill-down: top-N hit turns + surrounding context
                                (paired with search; use --grep KW to anchor)
  extract <session-id>          dump cleaned dialogue (use --grep KW to filter turns)
  projects                      list active projects (cwds) with session counts —
                                use this to discover which --cwd to pass to search

flags:
  --platform claude|codex|opencode|all   default all
  --since YYYY-MM-DD                     inclusive lower bound
  --until YYYY-MM-DD                     inclusive upper bound
  --global                               include all projects (default: cwd-scoped)
  --cwd <path>                           override the project cwd
  --limit N                              cap output (default 50)
  --grep KW                              extract / context: filter turns by keyword (multi-token AND)
  --phase brainstorm|implement|all       extract: slice by DevFlow brainstorm windows
                                         (default all; brainstorm = [task.py create, task.py start);
                                         Claude/Codex supported; OpenCode warns + returns all)
  --turns N                              context: number of hit turns to return (default 3)
  --around N                             context: turns of surrounding context per hit (default 1)
  --max-chars N                          context: total char budget (default 6000, ~1500 tokens)
  --include-children                     search / context: merge OpenCode sub-agent sessions into parent
  --json                                 emit JSON
  --help, -h                             show this help

examples:
  devflow mem list
  devflow mem list --global --platform claude --since 2026-04-01
  devflow mem search "session insight" --global
  devflow mem extract 5842592d --grep memory
  devflow mem extract 5842592d --phase brainstorm
`);
}

// ---------- entry ----------

export function runMem(args: readonly string[]): void {
  const argv = parseArgv(args);
  if (
    argv.flags.help ||
    argv.flags.h ||
    argv.cmd === "help" ||
    argv.cmd === "--help"
  ) {
    return cmdHelp();
  }
  switch (argv.cmd) {
    case "list":
      return cmdList(argv);
    case "search":
      return cmdSearch(argv);
    case "extract":
      return cmdExtract(argv);
    case "context":
      return cmdContext(argv);
    case "projects":
      return cmdProjects(argv);
    default:
      die(`unknown command: ${argv.cmd} (try 'help')`);
  }
}
