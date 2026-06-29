/**
 * ZCode configurator.
 *
 * ZCode is a pull-based class-2 platform (agentCapable, no hooks).
 * Three output paths:
 * - `.agents/skills/` — shared skills, byte-identical with Codex/Gemini writes
 * - `.zcode/commands/devflow/` — slash commands (invoked as /devflow:<name>)
 * - `.zcode/cli/agents/` — sub-agent definitions with pull-based prelude
 */

import path from "node:path";
import { AI_TOOLS } from "../types/ai-tools.js";
import { ensureDir, writeFile } from "../utils/file-writer.js";
import { getAllAgents } from "../templates/zcode/index.js";
import {
  collectSkillTemplates,
  resolveSkillsNeutral,
  resolveBundledSkills,
  resolveCommands,
  writeSkills,
  writeAgents,
  applyPullBasedPreludeMarkdown,
} from "./shared.js";

/**
 * Collect all ZCode template files for `devflow update` diff tracking.
 * Must stay in sync with `configureZcode`.
 */
export function collectZcodeTemplates(): Map<string, string> {
  const config = AI_TOOLS.zcode;
  const ctx = config.templateContext;
  const files = new Map<string, string>();

  for (const [filePath, content] of collectSkillTemplates(
    ".agents/skills",
    resolveSkillsNeutral(ctx),
    resolveBundledSkills(ctx),
  )) {
    files.set(filePath, content);
  }

  for (const cmd of resolveCommands(ctx)) {
    files.set(`.zcode/commands/devflow/${cmd.name}.md`, cmd.content);
  }

  for (const agent of applyPullBasedPreludeMarkdown(getAllAgents())) {
    files.set(`.zcode/cli/agents/${agent.name}.md`, agent.content);
  }

  return files;
}

/**
 * Configure ZCode at init time: write shared skills, commands, and sub-agents.
 */
export async function configureZcode(cwd: string): Promise<void> {
  const config = AI_TOOLS.zcode;
  const ctx = config.templateContext;

  await writeSkills(
    path.join(cwd, ".agents", "skills"),
    resolveSkillsNeutral(ctx),
    resolveBundledSkills(ctx),
  );

  const commandsDir = path.join(cwd, ".zcode", "commands", "devflow");
  ensureDir(commandsDir);
  for (const cmd of resolveCommands(ctx)) {
    await writeFile(path.join(commandsDir, `${cmd.name}.md`), cmd.content);
  }

  await writeAgents(
    path.join(cwd, ".zcode", "cli", "agents"),
    applyPullBasedPreludeMarkdown(getAllAgents()),
  );
}
