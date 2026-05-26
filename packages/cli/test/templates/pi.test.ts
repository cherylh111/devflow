import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import vm from "node:vm";
import ts from "typescript";
import {
  getAllAgents,
  getExtensionTemplate,
  getSettingsTemplate,
} from "../../src/templates/pi/index.js";

interface AgentConfig {
  model?: string;
  thinking?: string;
  fallbackModels: string[];
}

interface PiRunConfig {
  model?: string;
  thinking?: string;
}

interface PiExtensionInternals {
  normalizeAgent: (agent: string | undefined) => string;
  isDevFlowAgent: (root: string, agent: string) => boolean;
  parseAgentFM: (content: string) => AgentConfig;
  buildPiArgs: (config: PiRunConfig) => string[];
  resolveRunCfg: (
    input: { model?: string; thinking?: string },
    agentCfg: AgentConfig,
    inheritedThinking?: string,
  ) => PiRunConfig;
  cmdHasDevFlowCtx: (cmd: string) => boolean;
  shellQuote: (v: string) => string;
}

function loadExtensionInternals(): PiExtensionInternals {
  const source = `${getExtensionTemplate()}

export {
  normalizeAgent,
  isDevFlowAgent,
  parseAgentFM,
  buildPiArgs,
  resolveRunCfg,
  cmdHasDevFlowCtx,
  shellQuote,
};
`;
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const require = createRequire(import.meta.url);
  const moduleObject: { exports: Record<string, unknown> } = { exports: {} };
  const sandbox = vm.createContext({
    Buffer,
    console,
    exports: moduleObject.exports,
    module: moduleObject,
    process,
    require,
  });
  vm.runInContext(compiled, sandbox);
  return moduleObject.exports as unknown as PiExtensionInternals;
}

describe("pi templates", () => {
  it("provides the three DevFlow sub-agent definitions", () => {
    const agents = getAllAgents();
    expect(agents.map((agent) => agent.name).sort()).toEqual([
      "devflow-check",
      "devflow-implement",
      "devflow-research",
    ]);

    for (const agent of agents) {
      expect(agent.content).toContain(`name: ${agent.name}`);
      expect(agent.content).not.toContain("inject-subagent-context.py");
    }
  });

  it("settings keep Pi-owned skills until shared Agent Skills are platform-neutral", () => {
    const settings = JSON.parse(getSettingsTemplate().content) as {
      enableSkillCommands?: boolean;
      extensions?: string[];
      skills?: string[];
      prompts?: string[];
      packages?: unknown[];
    };

    expect(settings.enableSkillCommands).toBe(true);
    expect(settings.extensions).toEqual(["./extensions/devflow/index.ts"]);
    expect(settings.skills).toEqual(["./skills"]);
    expect(settings.prompts).toEqual(["./prompts"]);
    expect(settings.packages).toBeUndefined();
  });

  it("extension registers the devflow_subagent tool with mode+thinking schema", () => {
    const extension = getExtensionTemplate();

    // Tool name + label avoid collision with community subagent packages.
    expect(extension).toContain('name: "devflow_subagent"');
    expect(extension).toContain('label: "DevFlow Subagent"');

    // Schema must declare the three dispatch modes and the thinking enum so the LLM
    // can pick a valid mode and override thinking per call.
    expect(extension).toContain(
      'enum: ["single", "parallel", "chain"]',
    );
    expect(extension).toContain(
      'enum: ["off", "minimal", "low", "medium", "high", "xhigh"]',
    );

    // Dispatch protocol carries the "Active task: <path>" prefix rule.
    expect(extension).toContain("Active task:");
  });

  it("extension wires the four Pi events DevFlow needs for context flow", () => {
    const extension = getExtensionTemplate();

    // session_start: notify-only welcome
    expect(extension).toContain('pi.on?.("session_start"');
    // before_agent_start: inject DevFlow task context + per-turn breadcrumb
    expect(extension).toContain('pi.on?.("before_agent_start"');
    // tool_call: inject DEVFLOW_CONTEXT_ID into bash commands
    expect(extension).toContain('pi.on?.("tool_call"');
    // tool_result: mark failed/cancelled subagent runs as errors
    expect(extension).toContain('pi.on?.("tool_result"');
  });

  it("extension bash tool_call handler prefixes DEVFLOW_CONTEXT_ID", () => {
    const extension = getExtensionTemplate();

    // Bash tool calls get DEVFLOW_CONTEXT_ID exported in front so spawned
    // python scripts (e.g. task.py current) inherit session identity.
    expect(extension).toContain('ev.toolName === "bash"');
    expect(extension).toContain("export DEVFLOW_CONTEXT_ID=");
    expect(extension).toContain("cmdHasDevFlowCtx");
  });

  it("extension tool_result handler marks failed/cancelled subagent runs as errors", () => {
    const extension = getExtensionTemplate();

    expect(extension).toContain('ev.toolName === "devflow_subagent"');
    expect(extension).toContain('r.status === "failed"');
    expect(extension).toContain('r.status === "cancelled"');
    expect(extension).toContain("isError: true");
  });

  it("normalizeAgent prefixes bare names with devflow- and leaves prefixed names alone", () => {
    const { normalizeAgent } = loadExtensionInternals();

    expect(normalizeAgent("implement")).toBe("devflow-implement");
    expect(normalizeAgent("check")).toBe("devflow-check");
    expect(normalizeAgent("devflow-research")).toBe("devflow-research");
    expect(normalizeAgent(undefined)).toBe("devflow-implement");
    expect(normalizeAgent("devflow-custom")).toBe("devflow-custom");
  });

  it("isDevFlowAgent gates on a real .pi/agents/*.md definition file", () => {
    const { isDevFlowAgent } = loadExtensionInternals();

    const root = mkdtempSync(join(tmpdir(), "devflow-pi-test-"));
    mkdirSync(join(root, ".pi", "agents"), { recursive: true });
    writeFileSync(
      join(root, ".pi", "agents", "devflow-implement.md"),
      "---\nname: devflow-implement\n---\n",
    );

    expect(isDevFlowAgent(root, "devflow-implement")).toBe(true);
    expect(isDevFlowAgent(root, "devflow-foo")).toBe(false);
    expect(existsSync(root)).toBe(true);
  });

  it("parseAgentFM reads model/thinking/fallbackModels from agent frontmatter", () => {
    const { parseAgentFM } = loadExtensionInternals();

    const cfg = parseAgentFM(`---
name: reviewer
model: anthropic/claude-sonnet-4
thinking: high
fallbackModels:
  - openai/gpt-5-mini
  - "google/gemini-2.5-pro"
---
# Reviewer
`);

    expect(cfg).toEqual({
      model: "anthropic/claude-sonnet-4",
      thinking: "high",
      fallbackModels: ["openai/gpt-5-mini", "google/gemini-2.5-pro"],
    });
  });

  it("buildPiArgs maps PiRunConfig onto Pi CLI args", () => {
    const { buildPiArgs } = loadExtensionInternals();

    // model + thinking → composes "model:thinking" suffix when not already present
    expect(buildPiArgs({ model: "anthropic/claude-sonnet-4", thinking: "high" })).toEqual([
      "--mode",
      "json",
      "-p",
      "--no-session",
      "--model",
      "anthropic/claude-sonnet-4:high",
    ]);

    // model already has thinking suffix → passed through unchanged
    expect(
      buildPiArgs({ model: "anthropic/claude-sonnet-4:low", thinking: "high" }),
    ).toEqual([
      "--mode",
      "json",
      "-p",
      "--no-session",
      "--model",
      "anthropic/claude-sonnet-4:low",
    ]);

    // thinking-only (no model) → standalone --thinking flag
    expect(buildPiArgs({ thinking: "minimal" })).toEqual([
      "--mode",
      "json",
      "-p",
      "--no-session",
      "--thinking",
      "minimal",
    ]);

    // thinking=off is suppressed
    expect(buildPiArgs({ model: "gpt-5", thinking: "off" })).toEqual([
      "--mode",
      "json",
      "-p",
      "--no-session",
      "--model",
      "gpt-5",
    ]);
  });

  it("resolveRunCfg lets per-call input override agent frontmatter defaults", () => {
    const { resolveRunCfg } = loadExtensionInternals();

    const agentCfg: AgentConfig = {
      model: "anthropic/claude-sonnet-4",
      thinking: "high",
      fallbackModels: [],
    };

    // Per-call model + thinking win over agent config
    expect(
      resolveRunCfg(
        { model: "openai/gpt-5", thinking: "xhigh" },
        agentCfg,
      ),
    ).toEqual({ model: "openai/gpt-5:xhigh", thinking: "xhigh" });

    // No overrides → fall back to agent config
    expect(resolveRunCfg({}, agentCfg)).toEqual({
      model: "anthropic/claude-sonnet-4:high",
      thinking: "high",
    });

    // Inherited thinking is the last fallback
    expect(
      resolveRunCfg(
        {},
        { model: "gpt-5", fallbackModels: [] },
        "medium",
      ),
    ).toEqual({ model: "gpt-5:medium", thinking: "medium" });
  });

  it("cmdHasDevFlowCtx detects already-prefixed bash commands", () => {
    const { cmdHasDevFlowCtx } = loadExtensionInternals();

    expect(cmdHasDevFlowCtx("export DEVFLOW_CONTEXT_ID=foo; ls")).toBe(true);
    expect(cmdHasDevFlowCtx("DEVFLOW_CONTEXT_ID=foo ls")).toBe(true);
    expect(cmdHasDevFlowCtx("env DEVFLOW_CONTEXT_ID=foo ls")).toBe(true);
    expect(cmdHasDevFlowCtx("ls -la")).toBe(false);
    expect(cmdHasDevFlowCtx("")).toBe(false);
  });

  it("shellQuote single-quotes values and escapes embedded single quotes", () => {
    const { shellQuote } = loadExtensionInternals();

    expect(shellQuote("simple")).toBe("'simple'");
    expect(shellQuote("with space")).toBe("'with space'");
    expect(shellQuote("with 'quote'")).toBe("'with '\\''quote'\\'''");
  });

  it("extension forwards DEVFLOW_CONTEXT_ID into spawned Pi child env", () => {
    const extension = getExtensionTemplate();

    // The child pi process must inherit DEVFLOW_CONTEXT_ID so sub-agent
    // task.py current resolves to the same task.
    expect(extension).toContain("DEVFLOW_CONTEXT_ID:");
    expect(extension).toContain("...process.env");
  });

  it("extension validates agent definition before spawning a child pi process", () => {
    const extension = getExtensionTemplate();

    // Non-DevFlow agent calls must short-circuit and point users to community
    // subagent packages instead of silently spawning a child pi process with
    // a missing agent definition.
    expect(extension).toContain("isDevFlowAgent(root, agentName)");
    expect(extension).toContain("npm:@tintinweb/pi-subagents");
    expect(extension).toContain("npm:pi-subagents");
  });
});
