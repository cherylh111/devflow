import path from "node:path";
import { AI_TOOLS } from "../types/ai-tools.js";
import { ensureDir, writeFile } from "../utils/file-writer.js";
import {
  resolvePlaceholders,
  resolveCommands,
  resolveSkills,
  resolveBundledSkills,
  wrapWithCommandFrontmatter,
  writeSkills,
  writeAgents,
  writeSharedHooks,
  applyPullBasedPreludeMarkdown,
} from "./shared.js";
import { getAllAgents, getSettingsTemplate } from "../templates/trae/index.js";

/**
 * Configure Trae IDE (pull-based class-2 platform).
 *
 * Directory structure created:
 *   .trae/
 *   ├── commands/      # Slash commands (devflow-*.md with frontmatter)
 *   ├── skills/        # Skill definitions
 *   ├── agents/        # Sub-agent definitions with pull-based prelude
 *   ├── hooks/         # Shared Python hook scripts
 *   └── hooks.json     # Hook event registration
 */
export async function configureTrae(cwd: string): Promise<void> {
  const config = AI_TOOLS.trae;
  const ctx = config.templateContext;
  const configRoot = path.join(cwd, config.configDir);

  const commandsDir = path.join(configRoot, "commands");
  ensureDir(commandsDir);
  for (const cmd of resolveCommands(ctx)) {
    const name = `devflow-${cmd.name}`;
    await writeFile(
      path.join(commandsDir, `${name}.md`),
      wrapWithCommandFrontmatter(name, cmd.content),
    );
  }

  await writeSkills(
    path.join(configRoot, "skills"),
    resolveSkills(ctx),
    resolveBundledSkills(ctx),
  );

  await writeAgents(
    path.join(configRoot, "agents"),
    applyPullBasedPreludeMarkdown(getAllAgents()),
  );

  await writeSharedHooks(path.join(configRoot, "hooks"), "trae");

  const settings = getSettingsTemplate();
  await writeFile(
    path.join(configRoot, settings.targetPath),
    resolvePlaceholders(settings.content),
  );
}
