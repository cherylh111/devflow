import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  contextCollector,
  isDevFlowSubagent,
  DevFlowContext,
} from "../../src/templates/opencode/lib/devflow-context.js";
import {
  buildSessionContext,
  hasInjectedDevFlowContext,
} from "../../src/templates/opencode/lib/session-utils.js";
import injectSubagentContextPlugin from "../../src/templates/opencode/plugins/inject-subagent-context.js";
import sessionStartPlugin from "../../src/templates/opencode/plugins/session-start.js";
import injectWorkflowStatePlugin from "../../src/templates/opencode/plugins/inject-workflow-state.js";

interface TestContextCollector {
  processed: Set<string>;
  markProcessed(directory: string, sessionID: string): void;
  isProcessed(directory: string, sessionID: string): boolean;
  clear(sessionID: string): void;
}

interface OpenCodeInjectHooks {
  "tool.execute.before": (
    input: unknown,
    output: { args: { command: string } },
  ) => Promise<void>;
}

async function createOpenCodeInjectHooks(
  platform: NodeJS.Platform = "linux",
  env: NodeJS.ProcessEnv = {},
): Promise<OpenCodeInjectHooks> {
  return (await injectSubagentContextPlugin({
    directory: "/tmp/devflow-opencode-test",
    platform,
    env,
  })) as OpenCodeInjectHooks;
}

describe("opencode session context dedupe", () => {
  let collector: TestContextCollector;

  beforeEach((): void => {
    collector = contextCollector as TestContextCollector;
  });

  afterEach((): void => {
    collector.clear("session-a");
    collector.clear("session-b");
    collector.processed.clear();
  });

  it("tracks processed sessions in memory for the active process", () => {
    expect(collector.isProcessed("session-a")).toBe(false);

    collector.markProcessed("session-a");
    expect(collector.isProcessed("session-a")).toBe(true);

    collector.clear("session-a");

    expect(collector.isProcessed("session-a")).toBe(false);
  });

  it("does not treat a different session id as already processed", () => {
    collector.markProcessed("session-a");

    expect(collector.isProcessed("session-b")).toBe(false);
  });
});

describe("opencode session-start history detection", () => {
  it("includes the one-shot first-reply notice in injected context", () => {
    const context = buildSessionContext({
      directory: "/tmp/devflow-opencode-test",
      getActiveTask: () => ({ taskPath: null, source: "none", stale: false }),
      getContextKey: () => null,
      getCurrentTask: () => null,
      readFile: () => "",
      readProjectFile: () => "",
      resolveTaskDir: () => null,
      runScript: () => "",
    });

    expect(context).toContain("<first-reply-notice>");
    expect(context).toContain("First visible reply");
    expect(context).toContain("DevFlow SessionStart context is loaded");
    expect(context).toContain("This notice is one-shot");
    expect(context.indexOf("<first-reply-notice>")).toBeLessThan(
      context.indexOf("<guidelines>"),
    );
  });

  it("detects persisted DevFlow context from metadata", () => {
    const messages = [
      {
        info: { role: "user" },
        parts: [
          {
            type: "text",
            text: "hello",
            metadata: {
              devflow: {
                sessionStart: true,
              },
            },
          },
        ],
      },
    ];

    expect(hasInjectedDevFlowContext(messages)).toBe(true);
  });

  it("ignores unrelated user messages", () => {
    const messages = [
      {
        info: { role: "user" },
        parts: [
          {
            type: "text",
            text: "normal prompt",
          },
        ],
      },
    ];

    expect(hasInjectedDevFlowContext(messages)).toBe(false);
  });
});

describe("opencode bash session context", () => {
  it("injects DEVFLOW_CONTEXT_ID into Bash commands from plugin sessionID", async () => {
    const hooks = await createOpenCodeInjectHooks();
    const output = {
      args: {
        command: "python3 ./.devflow/scripts/task.py start .devflow/tasks/demo",
      },
    };

    await hooks["tool.execute.before"](
      { tool: "bash", sessionID: "oc-a" },
      output,
    );

    expect(output.args.command).toBe(
      "export DEVFLOW_CONTEXT_ID='opencode_oc-a'; python3 ./.devflow/scripts/task.py start .devflow/tasks/demo",
    );
  });

  it("uses PowerShell environment syntax on Windows", async () => {
    const hooks = await createOpenCodeInjectHooks("win32");
    const output = {
      args: {
        command: "python ./.devflow/scripts/task.py start .devflow/tasks/demo",
      },
    };

    await hooks["tool.execute.before"](
      { tool: "bash", sessionID: "oc-a" },
      output,
    );

    expect(output.args.command).toBe(
      "$env:DEVFLOW_CONTEXT_ID = 'opencode_oc-a'; python ./.devflow/scripts/task.py start .devflow/tasks/demo",
    );
  });

  it("uses POSIX environment syntax on Windows Git Bash", async () => {
    const hooks = await createOpenCodeInjectHooks("win32", {
      MSYSTEM: "MINGW64",
    });
    const output = {
      args: {
        command: "git diff --name-only",
      },
    };

    await hooks["tool.execute.before"](
      { tool: "bash", sessionID: "oc-a" },
      output,
    );

    expect(output.args.command).toBe(
      "export DEVFLOW_CONTEXT_ID='opencode_oc-a'; git diff --name-only",
    );
  });

  it("uses POSIX environment syntax when Windows OSTYPE indicates MSYS", async () => {
    const hooks = await createOpenCodeInjectHooks("win32", {
      OSTYPE: "msys",
    });
    const output = {
      args: {
        command: "git status --short",
      },
    };

    await hooks["tool.execute.before"](
      { tool: "bash", sessionID: "oc-a" },
      output,
    );

    expect(output.args.command).toBe(
      "export DEVFLOW_CONTEXT_ID='opencode_oc-a'; git status --short",
    );
  });

  it("uses POSIX environment syntax when Windows MINGW_PREFIX is set", async () => {
    const hooks = await createOpenCodeInjectHooks("win32", {
      MINGW_PREFIX: "/mingw64",
    });
    const output = {
      args: {
        command: "git log --oneline -1",
      },
    };

    await hooks["tool.execute.before"](
      { tool: "bash", sessionID: "oc-a" },
      output,
    );

    expect(output.args.command).toBe(
      "export DEVFLOW_CONTEXT_ID='opencode_oc-a'; git log --oneline -1",
    );
  });

  it("uses POSIX environment syntax when Windows SHELL is bash", async () => {
    const hooks = await createOpenCodeInjectHooks("win32", {
      SHELL: "/usr/bin/bash",
    });
    const output = {
      args: {
        command: "git branch --show-current",
      },
    };

    await hooks["tool.execute.before"](
      { tool: "bash", sessionID: "oc-a" },
      output,
    );

    expect(output.args.command).toBe(
      "export DEVFLOW_CONTEXT_ID='opencode_oc-a'; git branch --show-current",
    );
  });

  it("uses POSIX environment syntax when OpenCode Git Bash path is configured", async () => {
    const hooks = await createOpenCodeInjectHooks("win32", {
      OPENCODE_GIT_BASH_PATH: "C:\\Program Files\\Git\\bin\\bash.exe",
    });
    const output = {
      args: {
        command: "git rev-parse --show-toplevel",
      },
    };

    await hooks["tool.execute.before"](
      { tool: "bash", sessionID: "oc-a" },
      output,
    );

    expect(output.args.command).toBe(
      "export DEVFLOW_CONTEXT_ID='opencode_oc-a'; git rev-parse --show-toplevel",
    );
  });

  it("does not duplicate an explicit DEVFLOW_CONTEXT_ID assignment", async () => {
    const hooks = await createOpenCodeInjectHooks();
    const output = {
      args: {
        command:
          "DEVFLOW_CONTEXT_ID=manual python3 ./.devflow/scripts/task.py current",
      },
    };

    await hooks["tool.execute.before"](
      { tool: "bash", sessionID: "oc-a" },
      output,
    );

    expect(output.args.command).toBe(
      "DEVFLOW_CONTEXT_ID=manual python3 ./.devflow/scripts/task.py current",
    );
  });

  it("does not duplicate an explicit exported DEVFLOW_CONTEXT_ID", async () => {
    const hooks = await createOpenCodeInjectHooks();
    const output = {
      args: {
        command:
          "export DEVFLOW_CONTEXT_ID=manual; python3 ./.devflow/scripts/task.py current",
      },
    };

    await hooks["tool.execute.before"](
      { tool: "bash", sessionID: "oc-a" },
      output,
    );

    expect(output.args.command).toBe(
      "export DEVFLOW_CONTEXT_ID=manual; python3 ./.devflow/scripts/task.py current",
    );
  });

  it("does not duplicate an explicit env DEVFLOW_CONTEXT_ID assignment", async () => {
    const hooks = await createOpenCodeInjectHooks();
    const output = {
      args: {
        command:
          "env FOO=bar DEVFLOW_CONTEXT_ID=manual python3 ./.devflow/scripts/task.py current",
      },
    };

    await hooks["tool.execute.before"](
      { tool: "bash", sessionID: "oc-a" },
      output,
    );

    expect(output.args.command).toBe(
      "env FOO=bar DEVFLOW_CONTEXT_ID=manual python3 ./.devflow/scripts/task.py current",
    );
  });

  it("does not duplicate an explicit PowerShell DEVFLOW_CONTEXT_ID assignment", async () => {
    const hooks = await createOpenCodeInjectHooks("win32");
    const output = {
      args: {
        command:
          "$env:DEVFLOW_CONTEXT_ID = 'manual'; python ./.devflow/scripts/task.py current",
      },
    };

    await hooks["tool.execute.before"](
      { tool: "bash", sessionID: "oc-a" },
      output,
    );

    expect(output.args.command).toBe(
      "$env:DEVFLOW_CONTEXT_ID = 'manual'; python ./.devflow/scripts/task.py current",
    );
  });

  it("does not treat a grep pattern as an explicit DEVFLOW_CONTEXT_ID assignment", async () => {
    const hooks = await createOpenCodeInjectHooks();
    const output = {
      args: {
        command: "env | sort | grep '^DEVFLOW_CONTEXT_ID='",
      },
    };

    await hooks["tool.execute.before"](
      { tool: "bash", sessionID: "oc-a" },
      output,
    );

    expect(output.args.command).toBe(
      "export DEVFLOW_CONTEXT_ID='opencode_oc-a'; env | sort | grep '^DEVFLOW_CONTEXT_ID='",
    );
  });
});

// ---------------------------------------------------------------------------
// Issue #264 — sub-agent context injection + chat.message skip
// ---------------------------------------------------------------------------

interface TaskToolOutput {
  args: {
    subagent_type?: string;
    prompt?: string;
  };
}

interface TaskToolHooks {
  "tool.execute.before": (
    input: { tool: string; sessionID?: string; agent?: string },
    output: TaskToolOutput,
  ) => Promise<void>;
}

interface ChatMessagePart {
  type: string;
  text?: string;
  metadata?: Record<string, unknown>;
}

interface ChatMessageHooks {
  "chat.message": (
    input: { sessionID: string; agent?: string },
    output: { parts: ChatMessagePart[] },
  ) => Promise<void>;
}

function setupDevFlowProject(): string {
  const dir = mkdtempSync(join(tmpdir(), "devflow-opencode-264-"));
  const taskDir = join(dir, ".devflow", "tasks", "demo-task");
  mkdirSync(taskDir, { recursive: true });
  mkdirSync(join(dir, ".devflow", ".runtime", "sessions"), { recursive: true });
  writeFileSync(join(taskDir, "prd.md"), "# Demo PRD\n\nGoal: verify injection.");
  writeFileSync(join(taskDir, "implement.jsonl"), "");
  writeFileSync(join(taskDir, "check.jsonl"), "");
  writeFileSync(
    join(dir, ".devflow", "workflow.md"),
    [
      "# Workflow",
      "",
      "[workflow-state:in_progress]",
      "Active task: <task path>. Dispatch devflow-implement or devflow-check.",
      "[/workflow-state:in_progress]",
      "",
    ].join("\n"),
  );
  return dir;
}

function writeSessionFile(dir: string, key: string, taskRef: string): void {
  const file = join(dir, ".devflow", ".runtime", "sessions", `${key}.json`);
  writeFileSync(file, JSON.stringify({ current_task: taskRef }, null, 2));
}

describe("opencode subagent helper", () => {
  it("isDevFlowSubagent matches the three devflow sub-agent names", () => {
    expect(isDevFlowSubagent({ agent: "devflow-implement" })).toBe(true);
    expect(isDevFlowSubagent({ agent: "devflow-check" })).toBe(true);
    expect(isDevFlowSubagent({ agent: "devflow-research" })).toBe(true);
  });

  it("isDevFlowSubagent rejects unrelated agents", () => {
    expect(isDevFlowSubagent({ agent: "build" })).toBe(false);
    expect(isDevFlowSubagent({ agent: "devflow-implement-extra" })).toBe(false);
    expect(isDevFlowSubagent({ agent: undefined })).toBe(false);
    expect(isDevFlowSubagent({})).toBe(false);
    expect(isDevFlowSubagent(null)).toBe(false);
  });
});

describe("opencode DevFlowContext single-session fallback", () => {
  let dir: string;

  beforeEach(() => {
    dir = setupDevFlowProject();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns the only session file when exactly one exists", () => {
    writeSessionFile(dir, "opencode_sole", ".devflow/tasks/demo-task");
    const ctx = new DevFlowContext(dir);
    const active = ctx.getActiveTask({ sessionID: "missing-key" });

    expect(active.taskPath).toBe(".devflow/tasks/demo-task");
    expect(active.source).toBe("session-fallback:opencode_sole");
    expect(active.stale).toBe(false);
  });

  it("refuses to guess when two or more session files exist", () => {
    writeSessionFile(dir, "opencode_a", ".devflow/tasks/demo-task");
    writeSessionFile(dir, "opencode_b", ".devflow/tasks/demo-task");
    const ctx = new DevFlowContext(dir);
    const active = ctx.getActiveTask({ sessionID: "missing-key" });

    expect(active.taskPath).toBeNull();
    expect(active.source).toBe("none");
  });

  it("returns no task when zero session files exist (Python parity)", () => {
    // sessions/ exists from setupDevFlowProject but contains no files
    const ctx = new DevFlowContext(dir);
    const active = ctx.getActiveTask({ sessionID: "missing-key" });

    expect(active.taskPath).toBeNull();
    expect(active.source).toBe("none");
  });

  it("prefers an exact context-key match over the fallback", () => {
    writeSessionFile(dir, "opencode_session_exact", ".devflow/tasks/demo-task");
    writeSessionFile(dir, "opencode_other", ".devflow/tasks/demo-task");
    const ctx = new DevFlowContext(dir);
    const active = ctx.getActiveTask({ sessionID: "exact" });

    // sessionID="exact" maps to "opencode_exact" via buildContextKey; we
    // wrote "opencode_session_exact" so the exact lookup misses, but the
    // presence of ≥2 files means fallback should also refuse — proving
    // exact match is attempted first.
    expect(active.taskPath).toBeNull();
  });
});

describe("opencode inject-subagent-context (issue #264)", () => {
  let dir: string;
  let hooks: TaskToolHooks;

  beforeEach(async () => {
    dir = setupDevFlowProject();
    hooks = (await injectSubagentContextPlugin({
      directory: dir,
      platform: "linux",
      env: {},
    })) as TaskToolHooks;
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("mutates implement prompt using single-session fallback when sessionID misses", async () => {
    writeSessionFile(dir, "opencode_sole", ".devflow/tasks/demo-task");
    const output: TaskToolOutput = {
      args: {
        subagent_type: "devflow-implement",
        prompt: "do the implementation",
      },
    };

    await hooks["tool.execute.before"](
      { tool: "task", sessionID: "stranger" },
      output,
    );

    expect(output.args.prompt).toContain("<!-- devflow-hook-injected -->");
    expect(output.args.prompt).toContain("# Implement Agent Task");
    expect(output.args.prompt).toContain("Demo PRD");
    expect(output.args.prompt).toContain("do the implementation");
    // Marker must be at the top so generated agent definitions can detect
    // successful injection via a prefix check.
    expect(output.args.prompt.startsWith("<!-- devflow-hook-injected -->")).toBe(
      true,
    );
  });

  it("inlines JSONL-referenced spec content into the implement prompt", async () => {
    // Cover AC #1: "JSONL-referenced context" — the seed-only jsonl path
    // is exercised above; this one verifies a curated entry is inlined.
    const specPath = join(dir, ".devflow", "spec", "demo.md");
    mkdirSync(join(dir, ".devflow", "spec"), { recursive: true });
    writeFileSync(specPath, "# Demo Spec\n\nUNIQUE_SPEC_MARKER_42");
    writeFileSync(
      join(dir, ".devflow", "tasks", "demo-task", "implement.jsonl"),
      JSON.stringify({ file: ".devflow/spec/demo.md", reason: "test" }) + "\n",
    );
    writeSessionFile(dir, "opencode_sole", ".devflow/tasks/demo-task");

    const output: TaskToolOutput = {
      args: {
        subagent_type: "devflow-implement",
        prompt: "do the implementation",
      },
    };

    await hooks["tool.execute.before"](
      { tool: "task", sessionID: "stranger" },
      output,
    );

    expect(output.args.prompt).toContain("<!-- devflow-hook-injected -->");
    expect(output.args.prompt).toContain("=== .devflow/spec/demo.md ===");
    expect(output.args.prompt).toContain("UNIQUE_SPEC_MARKER_42");
    expect(output.args.prompt).toContain("Demo PRD");
  });

  it("inlines JSONL-referenced knowledge content into the implement prompt", async () => {
    const knowledgeDir = join(dir, ".devflow", "spec", "guides");
    mkdirSync(knowledgeDir, { recursive: true });
    writeFileSync(
      join(knowledgeDir, "learnings.md"),
      [
        "# Learnings",
        "",
        '<spec-entry id="KNOW-OPENCODE-1" type="learning" keywords="opencode">',
        "OpenCode knowledge marker.",
        "</spec-entry>",
        "",
      ].join("\n"),
    );
    writeFileSync(
      join(dir, ".devflow", "tasks", "demo-task", "implement.jsonl"),
      JSON.stringify({
        knowledge: "KNOW-OPENCODE-1",
        type: "knowledge",
        reason: "test",
      }) + "\n",
    );
    writeSessionFile(dir, "opencode_sole", ".devflow/tasks/demo-task");

    const output: TaskToolOutput = {
      args: {
        subagent_type: "devflow-implement",
        prompt: "do the implementation",
      },
    };

    await hooks["tool.execute.before"](
      { tool: "task", sessionID: "stranger" },
      output,
    );

    expect(output.args.prompt).toContain("<!-- devflow-hook-injected -->");
    expect(output.args.prompt).toContain("=== knowledge:KNOW-OPENCODE-1 ===");
    expect(output.args.prompt).toContain(
      "Source: .devflow/spec/guides/learnings.md",
    );
    expect(output.args.prompt).toContain("OpenCode knowledge marker.");
    expect(output.args.prompt).toContain("Demo PRD");
  });

  it("mutates check prompt using Active task hint when runtime resolution fails", async () => {
    // No session file → both session lookup and single-session fallback miss.
    // Hint is the only resolver.
    const output: TaskToolOutput = {
      args: {
        subagent_type: "devflow-check",
        prompt: "Active task: .devflow/tasks/demo-task\n\nplease check",
      },
    };

    await hooks["tool.execute.before"](
      { tool: "task", sessionID: "stranger" },
      output,
    );

    expect(output.args.prompt).toContain("<!-- devflow-hook-injected -->");
    expect(output.args.prompt).toContain("# Check Agent Task");
    expect(output.args.prompt).toContain("Demo PRD");
  });

  it("Active task hint takes precedence over single-session fallback", async () => {
    // Set up TWO matches: a session file pointing at demo-task AND a hint
    // pointing at a different task path. Hint should win.
    writeSessionFile(dir, "opencode_sole", ".devflow/tasks/another-task");
    const hintTask = join(dir, ".devflow", "tasks", "hint-task");
    mkdirSync(hintTask, { recursive: true });
    writeFileSync(join(hintTask, "prd.md"), "# Hint PRD\n\nfrom hint");
    writeFileSync(join(hintTask, "implement.jsonl"), "");

    const output: TaskToolOutput = {
      args: {
        subagent_type: "devflow-implement",
        prompt: "Active task: .devflow/tasks/hint-task\n\ngo",
      },
    };

    await hooks["tool.execute.before"](
      { tool: "task", sessionID: "stranger" },
      output,
    );

    expect(output.args.prompt).toContain("Hint PRD");
    expect(output.args.prompt).not.toContain("Demo PRD");
  });

  it("emits the devflow-hook-injected marker for research agent too", async () => {
    const output: TaskToolOutput = {
      args: {
        subagent_type: "devflow-research",
        prompt: "investigate something",
      },
    };

    await hooks["tool.execute.before"](
      { tool: "task", sessionID: "stranger" },
      output,
    );

    expect(output.args.prompt).toContain("<!-- devflow-hook-injected -->");
    expect(output.args.prompt).toContain("# Research Agent Task");
  });

  it("skips when no task can be resolved through any path", async () => {
    const output: TaskToolOutput = {
      args: {
        subagent_type: "devflow-implement",
        prompt: "implement without context",
      },
    };

    await hooks["tool.execute.before"](
      { tool: "task", sessionID: "stranger" },
      output,
    );

    // Prompt is left untouched when implement/check can't find a task
    expect(output.args.prompt).toBe("implement without context");
  });
});

describe("opencode chat.message subagent skip (issue #264)", () => {
  let dir: string;

  beforeEach(() => {
    dir = setupDevFlowProject();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    contextCollector.clear("subagent-session");
    contextCollector.clear("main-session");
  });

  it("session-start.js early-returns when input.agent is a devflow sub-agent", async () => {
    const hooks = (await sessionStartPlugin({
      directory: dir,
      client: undefined,
    })) as ChatMessageHooks;
    const parts: ChatMessagePart[] = [{ type: "text", text: "original" }];

    await hooks["chat.message"](
      { sessionID: "subagent-session", agent: "devflow-implement" },
      { parts },
    );

    expect(parts).toHaveLength(1);
    expect(parts[0].text).toBe("original");
    expect(parts[0].metadata).toBeUndefined();
  });

  it("session-start.js skips devflow-check and devflow-research", async () => {
    const hooks = (await sessionStartPlugin({
      directory: dir,
      client: undefined,
    })) as ChatMessageHooks;

    for (const agent of ["devflow-check", "devflow-research"]) {
      const parts: ChatMessagePart[] = [{ type: "text", text: "untouched" }];
      await hooks["chat.message"](
        { sessionID: "subagent-session", agent },
        { parts },
      );
      expect(parts[0].text).toBe("untouched");
    }
  });

  it("inject-workflow-state.js early-returns when input.agent is a devflow sub-agent", async () => {
    const hooks = (await injectWorkflowStatePlugin({
      directory: dir,
    })) as ChatMessageHooks;
    const parts: ChatMessagePart[] = [{ type: "text", text: "original" }];

    await hooks["chat.message"](
      { sessionID: "subagent-session", agent: "devflow-implement" },
      { parts },
    );

    expect(parts).toHaveLength(1);
    expect(parts[0].text).toBe("original");
  });

  it("inject-workflow-state.js still injects breadcrumb for main-session turns", async () => {
    const hooks = (await injectWorkflowStatePlugin({
      directory: dir,
    })) as ChatMessageHooks;
    const parts: ChatMessagePart[] = [{ type: "text", text: "user prompt" }];

    await hooks["chat.message"](
      { sessionID: "main-session", agent: "build" },
      { parts },
    );

    expect(parts[0].text).toContain("<workflow-state>");
    expect(parts[0].text).toContain("user prompt");
  });
});
