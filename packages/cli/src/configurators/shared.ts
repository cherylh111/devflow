/**
 * Shared utilities for platform configurators.
 *
 * Extracted here to avoid circular dependencies (index.ts imports configurators,
 * configurators cannot import from index.ts).
 */

import type { TemplateContext } from "../types/ai-tools.js";
import {
  getTemplateLanguage,
  type TemplateLanguage,
} from "../templates/language.js";

/**
 * Module-level resolved Python command, set by the init flow after probing.
 *
 * Windows commonly has Python under one of: `python`, `python3`, `py -3` —
 * which one works varies by installer (python.org / Microsoft Store / py
 * launcher). `init.ts` detects which is available, then calls
 * `setResolvedPythonCommand` so all subsequent template / configurator writes
 * use the resolved value instead of the platform default.
 *
 * If unset (e.g. unit tests bypass init), `getPythonCommandForPlatform` falls
 * back to the static platform default (`python` on Windows, `python3`
 * elsewhere) — preserving legacy behavior.
 */
let resolvedPythonCommand: string | null = null;

export function setResolvedPythonCommand(cmd: string): void {
  const trimmed = cmd.trim();
  resolvedPythonCommand = trimmed || null;
}

/** Test helper — clear the resolved cache between unit tests. */
export function resetResolvedPythonCommand(): void {
  resolvedPythonCommand = null;
}

/**
 * Get the Python command for the host platform.
 *
 * Returns the resolved command if `setResolvedPythonCommand` has been called;
 * otherwise the static platform default — Windows: `python`, others:
 * `python3`. Pass an explicit `platform` arg only for unit tests (it bypasses
 * the resolved cache).
 */
export function getPythonCommandForPlatform(
  platform?: NodeJS.Platform,
): string {
  if (platform === undefined && resolvedPythonCommand) {
    return resolvedPythonCommand;
  }
  const target = platform ?? process.platform;
  return target === "win32" ? "python" : "python3";
}

/**
 * Replace literal `python3` with the resolved Python command, excluding
 * shebang lines.
 *
 * Applied at init/update write time so that all file types (including .py,
 * .md, .toml, .json) get the correct command for the host platform without
 * template-level changes.
 *
 * No-op when the resolved command is `python3` (the template default).
 * Idempotent: running it twice produces the same result.
 */
export function replacePythonCommandLiterals(content: string): string {
  const target = getPythonCommandForPlatform();
  if (target === "python3") return content;
  return content
    .split("\n")
    .map((line) =>
      line.startsWith("#!") ? line : line.replaceAll("python3", target),
    )
    .join("\n");
}

/**
 * Resolve platform-specific placeholders in template content.
 *
 * When called without a context, only resolves {{PYTHON_CMD}} (legacy behavior
 * for settings.json, hooks.json, etc.).
 *
 * When called with a TemplateContext, additionally resolves:
 * - {{CMD_REF:name}}         → platform-specific command reference
 * - {{EXECUTOR_AI}}          → AI executor description
 * - {{USER_ACTION_LABEL}}    → user action label
 * - {{CLI_FLAG}}             → platform cli flag (e.g. "claude", "codex")
 * - {{#FLAG}}...{{/FLAG}}    → conditional include (when FLAG is true)
 * - {{^FLAG}}...{{/FLAG}}    → negated conditional (when FLAG is false)
 *
 * Supported conditional flags: AGENT_CAPABLE, HAS_HOOKS
 */
// Pre-compiled regexes for placeholder resolution
const RE_PYTHON_CMD = /\{\{PYTHON_CMD\}\}/g;
const RE_CMD_REF = /\{\{CMD_REF:([\w][\w-]*)\}\}/g;
const RE_EXECUTOR_AI = /\{\{EXECUTOR_AI\}\}/g;
const RE_USER_ACTION_LABEL = /\{\{USER_ACTION_LABEL\}\}/g;
const RE_CLI_FLAG = /\{\{CLI_FLAG\}\}/g;
const RE_BLANK_LINES = /\n{3,}/g;

const CONDITIONAL_FLAGS = ["AGENT_CAPABLE", "HAS_HOOKS"] as const;
const CONDITIONAL_REGEXES = Object.fromEntries(
  CONDITIONAL_FLAGS.map((flag) => [
    flag,
    {
      pos: new RegExp(
        `\\{\\{#${flag}\\}\\}([\\s\\S]*?)\\{\\{/${flag}\\}\\}`,
        "g",
      ),
      neg: new RegExp(
        `\\{\\{\\^${flag}\\}\\}([\\s\\S]*?)\\{\\{/${flag}\\}\\}`,
        "g",
      ),
    },
  ]),
) as Record<(typeof CONDITIONAL_FLAGS)[number], { pos: RegExp; neg: RegExp }>;

export function resolvePlaceholders(
  content: string,
  context?: TemplateContext,
): string {
  let result = replacePythonCommandLiterals(
    content.replace(RE_PYTHON_CMD, getPythonCommandForPlatform()),
  );

  if (!context) return result;

  // Simple substitutions
  result = result.replace(
    RE_CMD_REF,
    (_match, name: string) => `${context.cmdRefPrefix}${name}`,
  );
  result = result.replace(RE_EXECUTOR_AI, context.executorAI);
  result = result.replace(RE_USER_ACTION_LABEL, context.userActionLabel);
  result = result.replace(RE_CLI_FLAG, context.cliFlag);

  // Conditional blocks
  const flagValues: Record<(typeof CONDITIONAL_FLAGS)[number], boolean> = {
    AGENT_CAPABLE: context.agentCapable,
    HAS_HOOKS: context.hasHooks,
  };

  for (const flag of CONDITIONAL_FLAGS) {
    const value = flagValues[flag];
    const { pos, neg } = CONDITIONAL_REGEXES[flag];
    // Reset lastIndex for global regexes reused across calls
    pos.lastIndex = 0;
    neg.lastIndex = 0;
    result = result.replace(pos, value ? "$1" : "");
    result = result.replace(neg, value ? "" : "$1");
  }

  // Clean up blank lines left by removed conditional blocks
  result = result.replace(RE_BLANK_LINES, "\n\n");

  return result;
}

/**
 * Resolve placeholders for files written under `.agents/skills/` (the shared
 * Agent Skills directory consumed by multiple platforms via the upstream
 * `.agents/skills/` workspace alias — Codex, Gemini CLI 0.40+, etc.).
 *
 * Identical to {@link resolvePlaceholders} except that {@link CMD_REF} is
 * rendered in a platform-neutral form (`` `name` (DevFlow command) ``)
 * instead of substituting a platform-specific prefix. This is the only
 * placeholder that varies between platforms in the 5 shared workflow skills
 * (`brainstorm`, `before-dev`, `check`, `break-loop`, `update-spec`), so
 * neutralizing it makes the rendered SKILL.md files byte-identical regardless
 * of which DevFlow configurator wrote them — eliminating the
 * "last-writer-wins" collision when both Codex and Gemini target
 * `.agents/skills/`.
 *
 * `{{CLI_FLAG}}`, `{{EXECUTOR_AI}}`, `{{USER_ACTION_LABEL}}`, conditionals,
 * and `{{PYTHON_CMD}}` are still resolved from the platform context. The 5
 * shared skills do not use those placeholders, so they remain platform-
 * neutral. Codex-only skill files (e.g. `devflow-continue/SKILL.md`,
 * `devflow-finish-work/SKILL.md` written via `resolveAllAsSkillsNeutral`) DO
 * use `{{CLI_FLAG}}` / `{{PYTHON_CMD}}` and resolve to Codex-correct values
 * — no other platform writes those files, so byte-identity is not required.
 */
export function resolvePlaceholdersNeutral(
  content: string,
  context?: TemplateContext,
): string {
  let result = replacePythonCommandLiterals(
    content.replace(RE_PYTHON_CMD, getPythonCommandForPlatform()),
  );

  if (!context) return result;

  // Neutral form for the only collision-causing placeholder
  result = result.replace(
    RE_CMD_REF,
    (_match, name: string) => `\`${name}\` (DevFlow command)`,
  );
  result = result.replace(RE_EXECUTOR_AI, context.executorAI);
  result = result.replace(RE_USER_ACTION_LABEL, context.userActionLabel);
  result = result.replace(RE_CLI_FLAG, context.cliFlag);

  // Conditional blocks (resolved per platform — none of the 5 shared skills
  // use conditionals, but Codex-only command-as-skill files might in future).
  const flagValues: Record<(typeof CONDITIONAL_FLAGS)[number], boolean> = {
    AGENT_CAPABLE: context.agentCapable,
    HAS_HOOKS: context.hasHooks,
  };

  for (const flag of CONDITIONAL_FLAGS) {
    const value = flagValues[flag];
    const { pos, neg } = CONDITIONAL_REGEXES[flag];
    pos.lastIndex = 0;
    neg.lastIndex = 0;
    result = result.replace(pos, value ? "$1" : "");
    result = result.replace(neg, value ? "" : "$1");
  }

  result = result.replace(RE_BLANK_LINES, "\n\n");

  return result;
}

// ---------------------------------------------------------------------------
// Template wrapping utilities
// ---------------------------------------------------------------------------

/** Skill description registry — maps template name to auto-trigger description. */
type LocalizedText = Record<TemplateLanguage, string>;

function localizedTemplateText(text: LocalizedText): string {
  return text[getTemplateLanguage()];
}

const SKILL_DESCRIPTIONS: Record<string, LocalizedText> = {
  start: {
    en: "Initializes an AI development session by reading workflow guides, developer identity, git status, active tasks, and project guidelines from .devflow/. Classifies incoming tasks and routes to brainstorm, direct edit, or task workflow. Use when beginning a new coding session, resuming work, starting a new task, or re-establishing project context.",
    zh: "初始化 AI 开发会话：读取工作流指南、开发者身份、git 状态、活跃任务和 .devflow/ 项目规范。用于开始新开发会话、恢复工作、启动任务或重新建立项目上下文。",
  },
  continue: {
    en: "Resume work on the current task. Loads the workflow Phase Index, figures out which phase/step to pick up at, then pulls the step-level detail via get_context.py --mode phase. Use when coming back to an in-progress task and you need to know what to do next.",
    zh: "恢复当前任务。加载工作流 Phase Index，判断应从哪个阶段/步骤继续，并通过 get_context.py --mode phase 获取步骤细节。用于回到进行中的任务并确定下一步。",
  },
  "finish-work": {
    en: "Wrap up the current session: verify quality gate passed, remind user to commit, archive completed tasks, and record session progress to the developer journal. Use when done coding and ready to end the session.",
    zh: "收尾当前会话：确认质量门已通过，提醒提交，归档已完成任务，并把会话进展记录到开发者日志。用于编码完成并准备结束会话时。",
  },
  "before-dev": {
    en: "Discovers and injects project-specific coding guidelines from .devflow/spec/ before implementation begins. Reads spec indexes, pre-development checklists, and shared thinking guides for the target package. Use when starting a new coding task, before writing any code, switching to a different package, or needing to refresh project conventions and standards.",
    zh: "在实现前发现并注入 .devflow/spec/ 中的项目编码规范。读取目标包的 spec 索引、开发前检查清单和共享思考指南。用于开始新编码任务、写代码前、切换包或刷新项目约定时。",
  },
  brainstorm: {
    en: "Guides collaborative requirements discovery before implementation. Creates task directory, seeds PRD, asks high-value questions one at a time, researches technical choices, and converges on MVP scope. Use when requirements are unclear, there are multiple valid approaches, or the user describes a new feature or complex task.",
    zh: "在实现前引导协作式需求澄清。创建任务目录，初始化 PRD，逐个提出高价值问题，研究技术选择，并收敛 MVP 范围。用于需求不清、存在多种方案，或用户描述新功能/复杂任务时。",
  },
  learn: {
    en: "Capture reusable project knowledge discovered during a task. Use when an implementation, debug session, review, or discussion produces a lesson, caveat, recipe, decision, or searchable reference that should survive context compaction.",
    zh: "捕获任务中发现的可复用项目知识。用于实现、调试、评审或讨论产生应在上下文压缩后保留的经验、注意事项、步骤、决策或可搜索参考时。",
  },
  check: {
    en: "Comprehensive quality verification: spec compliance, lint, type-check, tests, cross-layer data flow, code reuse, and consistency checks. Use when code is written and needs quality verification, before committing changes, or to catch context drift during long sessions.",
    zh: "综合质量验证：检查 spec 合规、lint、类型检查、测试、跨层数据流、代码复用和一致性。用于代码写完需要验证、提交前，或长会话中防止上下文漂移时。",
  },
  "break-loop": {
    en: "Deep bug analysis to break the fix-forget-repeat cycle. Analyzes root cause category, why fixes failed, prevention mechanisms, and captures knowledge into specs. Use after fixing a bug to prevent the same class of bugs.",
    zh: "深入分析 bug，打破修了又忘、反复出现的循环。分析根因类型、修复为何失败、防复发机制，并把知识沉淀到 spec。用于修复 bug 后防止同类问题再次发生。",
  },
  "update-spec": {
    en: "Captures executable contracts and coding conventions into .devflow/spec/ documents. Use when learning something valuable from debugging, implementing, or discussion that should be preserved for future sessions.",
    zh: "把可执行契约和编码约定沉淀到 .devflow/spec/ 文档。用于从调试、实现或讨论中学到需要保留给后续会话的重要内容时。",
  },
};

/**
 * Wrap resolved template content with YAML frontmatter for skill format.
 * Used by platforms that use SKILL.md (Codex, Kiro, Qoder, etc.).
 */
export function wrapWithSkillFrontmatter(
  name: string,
  content: string,
): string {
  // Look up description by base name (without devflow- prefix)
  const baseName = name.replace(/^devflow-/, "");
  const localizedDescription = SKILL_DESCRIPTIONS[baseName];
  const description = localizedDescription
    ? localizedTemplateText(localizedDescription)
    : undefined;
  if (!description) {
    throw new Error(
      `Missing skill description for "${baseName}". Add it to SKILL_DESCRIPTIONS in shared.ts.`,
    );
  }
  return `---\nname: ${name}\ndescription: "${description}"\n---\n\n${content}`;
}

/**
 * One-line blurbs shown in a `/` command palette — kept separate from
 * SKILL_DESCRIPTIONS, which is long prose aimed at the skill matcher.
 */
const COMMAND_DESCRIPTIONS: Record<string, LocalizedText> = {
  start: {
    en: "Initialize a DevFlow development session.",
    zh: "初始化 DevFlow 开发会话。",
  },
  continue: {
    en: "Resume work on the current task at the correct phase.",
    zh: "在正确阶段恢复当前任务。",
  },
  "finish-work": {
    en: "Wrap up the current session: quality gate, commit reminder, archive, journal.",
    zh: "收尾当前会话：质量门、提交提醒、归档和日志。",
  },
};

/** Wrap resolved command content with YAML frontmatter (name + description). */
export function wrapWithCommandFrontmatter(
  name: string,
  content: string,
): string {
  const baseName = name.replace(/^devflow-/, "");
  const localizedDescription = COMMAND_DESCRIPTIONS[baseName];
  const description = localizedDescription
    ? localizedTemplateText(localizedDescription)
    : undefined;
  if (!description) {
    throw new Error(
      `Missing command description for "${baseName}". Add it to COMMAND_DESCRIPTIONS in shared.ts.`,
    );
  }
  return `---\nname: ${name}\ndescription: ${description}\n---\n\n${content}`;
}

// ---------------------------------------------------------------------------
// Shared configurator helpers
// ---------------------------------------------------------------------------

import path from "node:path";
import { ensureDir, writeFile } from "../utils/file-writer.js";
import {
  type CommonTemplate,
  getBundledSkillTemplates,
  getCommandTemplates,
  getSkillTemplates,
} from "../templates/common/index.js";

/** A resolved template ready to be written to disk. */
export interface ResolvedTemplate {
  name: string;
  content: string;
}

/** A resolved file inside a multi-file skill directory. */
export interface ResolvedSkillFile {
  /** POSIX path relative to the skills root, e.g. "devflow-meta/SKILL.md" */
  relativePath: string;
  content: string;
}

/**
 * Filter command templates based on platform capabilities.
 *
 * `start.md` is only emitted for agent-less platforms (kilo, antigravity,
 * windsurf). On agent-capable platforms, the session-start hook / plugin
 * already injects the workflow overview, so a user-facing `start` command
 * would be redundant.
 */
function filterCommands(
  templates: CommonTemplate[],
  ctx: TemplateContext,
): CommonTemplate[] {
  if (ctx.agentCapable) {
    return templates.filter((t) => t.name !== "start");
  }
  return templates;
}

/**
 * Resolve ALL templates as skills with devflow- prefix.
 * Used by skill-only platforms (Kiro, Qoder, Codex) where everything is a skill.
 *
 * `start` is filtered out on agent-capable platforms — the session-start hook
 * injects the workflow overview instead.
 */
export function resolveAllAsSkills(ctx: TemplateContext): ResolvedTemplate[] {
  const templates = [
    ...filterCommands(getCommandTemplates(), ctx),
    ...getSkillTemplates(),
  ];
  return templates.map((tmpl) => ({
    name: `devflow-${tmpl.name}`,
    content: wrapWithSkillFrontmatter(
      `devflow-${tmpl.name}`,
      resolvePlaceholders(tmpl.content, ctx),
    ),
  }));
}

/**
 * Resolve command templates as plain commands (no wrapping).
 * Used by "both" platforms for the user-ritual commands.
 *
 * `start` is filtered out on agent-capable platforms.
 */
export function resolveCommands(ctx: TemplateContext): ResolvedTemplate[] {
  return filterCommands(getCommandTemplates(), ctx).map((tmpl) => ({
    name: tmpl.name,
    content: resolvePlaceholders(tmpl.content, ctx),
  }));
}

/**
 * Resolve only the 5 skill templates with devflow- prefix + SKILL.md frontmatter.
 * Used by "both" platforms for the auto-triggered skills.
 */
export function resolveSkills(ctx: TemplateContext): ResolvedTemplate[] {
  return getSkillTemplates().map((tmpl) => ({
    name: `devflow-${tmpl.name}`,
    content: wrapWithSkillFrontmatter(
      `devflow-${tmpl.name}`,
      resolvePlaceholders(tmpl.content, ctx),
    ),
  }));
}

/**
 * Same as {@link resolveSkills} but uses {@link resolvePlaceholdersNeutral}
 * so the rendered SKILL.md files are byte-identical across any two platforms
 * that target `.agents/skills/`. Use this for shared `.agents/skills/`
 * writes (Gemini); platform-private skill roots should keep
 * {@link resolveSkills}.
 */
export function resolveSkillsNeutral(ctx: TemplateContext): ResolvedTemplate[] {
  return getSkillTemplates().map((tmpl) => ({
    name: `devflow-${tmpl.name}`,
    content: wrapWithSkillFrontmatter(
      `devflow-${tmpl.name}`,
      resolvePlaceholdersNeutral(tmpl.content, ctx),
    ),
  }));
}

/**
 * Same as {@link resolveAllAsSkills} but uses
 * {@link resolvePlaceholdersNeutral} for the 5 shared skills. The 2 command
 * templates (continue, finish-work) folded into the skill set still resolve
 * `{{CLI_FLAG}}` / `{{PYTHON_CMD}}` per platform — only Codex writes those
 * files into `.agents/skills/`, so byte-identity isn't required there.
 */
export function resolveAllAsSkillsNeutral(
  ctx: TemplateContext,
): ResolvedTemplate[] {
  const templates = [
    ...filterCommands(getCommandTemplates(), ctx),
    ...getSkillTemplates(),
  ];
  return templates.map((tmpl) => ({
    name: `devflow-${tmpl.name}`,
    content: wrapWithSkillFrontmatter(
      `devflow-${tmpl.name}`,
      resolvePlaceholdersNeutral(tmpl.content, ctx),
    ),
  }));
}

/**
 * Codex needs a `devflow-start` skill in `.agents/skills/` so the
 * `<devflow-bootstrap>` notice from `inject-workflow-state.py` resolves
 * to an actual skill file (the bootstrap notice tells the AI to invoke
 * `$devflow-start` once on the first `no_task` turn — added in 0.5.5
 * after the Codex SessionStart hook was removed for de-recursion).
 *
 * Built from `common/commands/start.md` + skill frontmatter; renders
 * neutrally so init and update produce byte-identical output. Returns
 * `null` if the template is missing (defensive — should never happen).
 *
 * Used by both `configureCodex()` (init path, file write) and
 * `collectPlatformTemplates.codex` (update path, manifest map). Both
 * paths must agree, otherwise upgraded users miss the file (which broke
 * 0.4.x → 0.5.5/0.5.6 upgrades — see #247-style symptom: AI reports
 * "no .agents/skills/devflow-start/SKILL.md" because update only ran
 * `collectTemplates` and never wrote the file).
 */
export function resolveCodexDevFlowStartSkill(
  ctx: TemplateContext,
): ResolvedTemplate | null {
  const startTemplate = getCommandTemplates().find((t) => t.name === "start");
  if (!startTemplate) return null;
  return {
    name: "devflow-start",
    content: wrapWithSkillFrontmatter(
      "devflow-start",
      resolvePlaceholdersNeutral(startTemplate.content, ctx),
    ),
  };
}

/**
 * Resolve multi-file built-in skills.
 *
 * Unlike workflow skills, bundled skills already contain their own SKILL.md
 * frontmatter and may include references/assets. They are still rendered
 * through placeholder resolution so init and update get byte-identical output.
 */
export function resolveBundledSkills(
  ctx: TemplateContext,
): ResolvedSkillFile[] {
  return getBundledSkillTemplates().flatMap((skill) =>
    skill.files.map((file) => ({
      relativePath: `${skill.name}/${file.relativePath}`,
      content: resolvePlaceholders(file.content, ctx),
    })),
  );
}

// ---------------------------------------------------------------------------
// Shared configurator write helpers
// ---------------------------------------------------------------------------

/** Collect skill files under a target root for update hash tracking. */
export function collectSkillTemplates(
  skillsRoot: string,
  skills: readonly { name: string; content: string }[],
  bundledSkills: readonly ResolvedSkillFile[] = [],
): Map<string, string> {
  const files = new Map<string, string>();
  for (const skill of skills) {
    files.set(`${skillsRoot}/${skill.name}/SKILL.md`, skill.content);
  }
  for (const skillFile of bundledSkills) {
    files.set(`${skillsRoot}/${skillFile.relativePath}`, skillFile.content);
  }
  return files;
}

/** Write skill directories from resolved templates and bundled skill files. */
export async function writeSkills(
  skillsRoot: string,
  skills: { name: string; content: string }[],
  bundledSkills: readonly ResolvedSkillFile[] = [],
): Promise<void> {
  ensureDir(skillsRoot);
  for (const skill of skills) {
    const skillDir = path.join(skillsRoot, skill.name);
    ensureDir(skillDir);
    await writeFile(
      path.join(skillDir, "SKILL.md"),
      replacePythonCommandLiterals(skill.content),
    );
  }
  for (const skillFile of bundledSkills) {
    const targetPath = path.join(skillsRoot, skillFile.relativePath);
    ensureDir(path.dirname(targetPath));
    await writeFile(
      targetPath,
      replacePythonCommandLiterals(skillFile.content),
    );
  }
}

/** Write agent/droid definition files */
export async function writeAgents(
  agentsDir: string,
  agents: { name: string; content: string }[],
  ext = ".md",
): Promise<void> {
  ensureDir(agentsDir);
  for (const agent of agents) {
    await writeFile(
      path.join(agentsDir, `${agent.name}${ext}`),
      replacePythonCommandLiterals(agent.content),
    );
  }
}

/** Write the shared hook scripts that `platform` actually registers. */
export async function writeSharedHooks(
  hooksDir: string,
  platform: import("../templates/shared-hooks/index.js").SharedHookPlatform,
): Promise<void> {
  const { getSharedHookScriptsForPlatform } =
    await import("../templates/shared-hooks/index.js");
  ensureDir(hooksDir);
  for (const hook of getSharedHookScriptsForPlatform(platform)) {
    await writeFile(
      path.join(hooksDir, hook.name),
      replacePythonCommandLiterals(hook.content),
    );
  }
}

// ---------------------------------------------------------------------------
// Pull-based sub-agent prelude (for class-2 platforms whose hook can't
// inject sub-agent prompts: gemini, qoder, codex, copilot)
//
// Only implement & check need task-level context (task artifacts + jsonl specs).
// research is orthogonal: it searches the spec tree and doesn't depend on an
// active task. Hook-based platforms mirror this (their `get_research_context`
// injects a spec-tree overview, not prd/jsonl). We leave research untouched.
// ---------------------------------------------------------------------------

export type SubAgentType = "implement" | "check";

/** Build the standard "load DevFlow context first" prelude block. */
export function buildPullBasedPrelude(agentType: SubAgentType): string {
  // JSONL filenames stay as implement.jsonl / check.jsonl — they are internal
  // context buckets keyed by role (not by platform-visible agent name).
  const jsonl = agentType === "check" ? "check.jsonl" : "implement.jsonl";

  if (getTemplateLanguage() === "zh") {
    return replacePythonCommandLiterals(`## 必须先加载 DevFlow 上下文

此平台不会通过 hook 自动注入任务上下文。开始任何工作前，你必须自行加载上下文。

### 步骤 1：找到当前任务路径

按下面顺序尝试，拿到任务路径后立即停止：

1. **查看主 agent 发给你的分发提示**。如果第一行是 \`Active task: <path>\`（例如 \`Active task: .devflow/tasks/04-17-foo\`），就使用该路径。class-2 平台要求主 agent 必须包含这一行。
2. **运行** \`python3 ./.devflow/scripts/task.py current --source\`，并读取 \`Current task:\` 行。
3. **如果两者都失败**（提示里没有 \`Active task:\` 行，且 \`task.py current\` 没有返回任务），询问用户要处理哪个任务；不要猜测。

### 步骤 2：从解析出的路径加载任务上下文

1. 读取 \`<task-path>/${jsonl}\`，这是与当前 agent 相关的 spec / research / knowledge 条目 JSONL 列表。
2. 对 JSONL 中每一条记录：
   - 如果包含 \`"file"\`，读取该文件路径或 markdown 目录。这些是你必须遵循的 spec 和 research notes。
   - 如果包含 \`"knowledge"\`、\`"wiki"\` 或 \`{"type":"knowledge","id":"..."}\`，运行 \`python3 ./.devflow/scripts/knowledge.py load <id>\`，并把加载出的条目视为必需上下文。
   - **跳过没有上下文字段的行**（例如 \`task.py create\` 后 curator 尚未运行时留下的 \`{"_example": "..."}\` seed 行）。
3. 读取任务的 \`prd.md\`（需求），然后读取存在时的 \`design.md\`（技术设计），再读取存在时的 \`implement.md\`（执行计划）。

如果 \`${jsonl}\` 没有 curated 条目（只有 seed 行或文件缺失），退回到：读取任务 artifacts，使用 \`python3 ./.devflow/scripts/get_context.py --mode packages\` 列出可用 specs，并自行选择匹配任务领域的 specs。不要因为缺少 jsonl 阻塞，轻量任务可以只有 PRD，复杂任务也可能包含 \`design.md\` 和 \`implement.md\`。

如果解析出的任务路径没有 \`prd.md\`，询问用户要做什么；不要在缺少上下文的情况下继续。

---

`);
  }

  return replacePythonCommandLiterals(`## Required: Load DevFlow Context First

This platform does NOT auto-inject task context via hook. Before doing anything else, you MUST load context yourself.

### Step 1: Find the active task path

Try in order — stop at the first one that yields a task path:

1. **Look at the dispatch prompt** you received from the main agent. If its first line is \`Active task: <path>\` (e.g. \`Active task: .devflow/tasks/04-17-foo\`), use that path. The main agent is required to include this line on class-2 platforms.
2. **Run** \`python3 ./.devflow/scripts/task.py current --source\` and read the \`Current task:\` line.
3. **If both fail** (no \`Active task:\` line in the prompt and \`task.py current\` returns no task), ask the user which task to work on; do NOT guess.

### Step 2: Load task context from the resolved path

1. Read \`<task-path>/${jsonl}\` — JSONL list of spec/research/knowledge entries relevant to this agent.
2. For each entry in the JSONL:
   - If it has \`"file"\`, Read that file path or markdown directory. These are the specs and research notes you must follow.
   - If it has \`"knowledge"\`, \`"wiki"\`, or \`{"type":"knowledge","id":"..."}\`, run \`python3 ./.devflow/scripts/knowledge.py load <id>\` and treat the loaded entry as required context.
   - **Skip rows without a context field** (e.g. \`{"_example": "..."}\` seed rows left over from \`task.py create\` before the curator ran).
3. Read the task's \`prd.md\` (requirements), then \`design.md\` if present (technical design), then \`implement.md\` if present (execution plan).

If \`${jsonl}\` has no curated entries (only a seed row, or the file is missing), fall back to: read the task artifacts, list available specs with \`python3 ./.devflow/scripts/get_context.py --mode packages\`, and pick the specs that match the task domain yourself. Do NOT block on the missing jsonl — lightweight tasks may be PRD-only, while complex tasks may also include \`design.md\` and \`implement.md\`.

If the resolved task path has no \`prd.md\`, ask the user what to work on; do NOT proceed without context.

---

`);
}

/** Insert prelude into a markdown agent definition (after YAML frontmatter). */
export function injectPullBasedPreludeMarkdown(
  content: string,
  agentType: SubAgentType,
): string {
  if (
    content.includes("## Required: Load DevFlow Context First") ||
    content.includes("## 必须先加载 DevFlow 上下文")
  ) {
    return content;
  }
  const prelude = buildPullBasedPrelude(agentType);
  const sections = splitMarkdownFrontmatter(content);

  if (!sections) {
    return prelude + content;
  }

  const head = `---\n${sections.frontmatter}\n---`;
  const tailTrimmed = sections.body.replace(/^(\r?\n)+/, "");
  return `${head}\n\n${prelude}${tailTrimmed}`;
}

/** Insert prelude into a TOML agent (codex `developer_instructions`). */
export function injectPullBasedPreludeToml(
  content: string,
  agentType: SubAgentType,
): string {
  if (
    content.includes("## Required: Load DevFlow Context First") ||
    content.includes("## 必须先加载 DevFlow 上下文")
  ) {
    return content;
  }
  const prelude = buildPullBasedPrelude(agentType);
  // Match: developer_instructions = """  followed by newline
  const re = /(developer_instructions\s*=\s*""")(\r?\n)/;
  if (!re.test(content)) {
    return content;
  }
  return content.replace(re, `$1$2${prelude}`);
}

/** Best-effort detect agent type from filename ("devflow-implement.md" → "implement").
 *  Returns null for research and unknown names — they skip the prelude.
 */
export function detectSubAgentType(name: string): SubAgentType | null {
  const base = name.replace(/\.(md|toml|prompt\.md)$/, "");
  if (base === "devflow-implement" || base === "devflow-check") {
    return base === "devflow-implement" ? "implement" : "check";
  }
  return null;
}

/** Shared transform: given a list of agents, prepend pull-based prelude to
 *  implement/check definitions. Used by both configurator (init-time write)
 *  and collectPlatformTemplates (update-time hash comparison) so the two
 *  code paths always agree on what's on disk.
 */
export interface AgentContent {
  name: string;
  content: string;
}

interface MarkdownFrontmatterSections {
  body: string;
  frontmatter: string;
}

function splitMarkdownFrontmatter(
  content: string,
): MarkdownFrontmatterSections | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return null;
  }

  return {
    frontmatter: match[1],
    body: content.slice(match[0].length),
  };
}

export function applyPullBasedPreludeMarkdown(
  agents: readonly AgentContent[],
): AgentContent[] {
  return agents.map((a) => {
    const t = detectSubAgentType(a.name);
    if (!t) return { ...a };
    return {
      ...a,
      content: injectPullBasedPreludeMarkdown(a.content, t),
    };
  });
}

function mapLegacyToolToCopilot(tool: string): string[] {
  switch (tool) {
    case "Read":
      return ["read"];
    case "Write":
    case "Edit":
      return ["edit"];
    case "Glob":
    case "Grep":
      return ["search"];
    case "Bash":
      return ["execute"];
    case "mcp__exa__web_search_exa":
    case "mcp__exa__get_code_context_exa":
      return ["web", "exa/*"];
    case "mcp__chrome-devtools__*":
      return ["chrome-devtools/*"];
    case "Skill":
      return [];
    default:
      return [];
  }
}

function normalizeCopilotMarkdownAgentFrontmatter(content: string): string {
  const sections = splitMarkdownFrontmatter(content);
  if (!sections) {
    return content;
  }

  const frontmatter = sections.frontmatter.split(/\r?\n/);
  const body = sections.body;
  const normalized: string[] = [];

  for (const line of frontmatter) {
    if (!line.startsWith("tools:")) {
      normalized.push(line);
      continue;
    }

    const legacyTools = line
      .slice("tools:".length)
      .split(",")
      .map((token) => token.trim())
      .filter((token) => token.length > 0);
    const tools = [...new Set(legacyTools.flatMap(mapLegacyToolToCopilot))];

    normalized.push("tools:");
    for (const tool of tools) {
      normalized.push(`  - ${tool}`);
    }
  }

  return `---\n${normalized.join("\n")}\n---\n${body}`;
}

export function normalizeCopilotMarkdownAgents(
  agents: readonly AgentContent[],
): AgentContent[] {
  return agents.map((agent) => ({
    ...agent,
    content: normalizeCopilotMarkdownAgentFrontmatter(agent.content),
  }));
}

export function applyPullBasedPreludeToml(
  agents: readonly AgentContent[],
): AgentContent[] {
  return agents.map((a) => {
    const t = detectSubAgentType(a.name);
    if (!t) return { ...a };
    return {
      ...a,
      content: injectPullBasedPreludeToml(a.content, t),
    };
  });
}
