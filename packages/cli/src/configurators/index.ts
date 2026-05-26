/**
 * Platform Registry — Single source of truth for platform functions and derived helpers
 */

import fs from "node:fs";
import path from "node:path";
import {
  AI_TOOLS,
  getManagedPaths,
  type AITool,
  type CliFlag,
} from "../types/ai-tools.js";

import { configureClaude } from "./claude.js";
import { configureQoder } from "./qoder.js";
import { configureCodebuddy } from "./codebuddy.js";

import {
  replacePythonCommandLiterals,
  resolvePlaceholders,
  resolveBundledSkills,
  resolveCommands,
  resolveSkills,
  wrapWithCommandFrontmatter,
  collectSkillTemplates,
  applyPullBasedPreludeMarkdown,
} from "./shared.js";

import {
  getAllAgents as getClaudeAgents,
  getSettingsTemplate as getClaudeSettings,
} from "../templates/claude/index.js";
import {
  getAllAgents as getQoderAgents,
  getSettingsTemplate as getQoderSettings,
} from "../templates/qoder/index.js";
import {
  getAllAgents as getCodebuddyAgents,
  getSettingsTemplate as getCodebuddySettings,
} from "../templates/codebuddy/index.js";
import {
  getSharedHookScriptsForPlatform,
  type SharedHookPlatform,
} from "../templates/shared-hooks/index.js";

// =============================================================================
// Platform Functions Registry
// =============================================================================

interface PlatformFunctions {
  configure: (cwd: string) => Promise<void>;
  collectTemplates?: () => Map<string, string>;
}

function collectSharedHooks(
  hooksPath: string,
  platform: SharedHookPlatform,
): Map<string, string> {
  const files = new Map<string, string>();
  for (const hook of getSharedHookScriptsForPlatform(platform)) {
    files.set(`${hooksPath}/${hook.name}`, hook.content);
  }
  return files;
}

function replaceInMap(map: Map<string, string>): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, content] of map) {
    result.set(key, replacePythonCommandLiterals(content));
  }
  return result;
}

function collectBothTemplates(
  ctx: import("../types/ai-tools.js").TemplateContext,
  cmdPath: (name: string) => string,
  skillRoot: string,
  wrapCmd?: (filePath: string, content: string) => string,
): Map<string, string> {
  const files = new Map<string, string>();
  for (const cmd of resolveCommands(ctx)) {
    const filePath = cmdPath(cmd.name);
    files.set(filePath, wrapCmd ? wrapCmd(filePath, cmd.content) : cmd.content);
  }
  for (const [filePath, content] of collectSkillTemplates(
    skillRoot,
    resolveSkills(ctx),
    resolveBundledSkills(ctx),
  )) {
    files.set(filePath, content);
  }
  return files;
}

const PLATFORM_FUNCTIONS: Record<AITool, PlatformFunctions> = {
  "claude-code": {
    configure: configureClaude,
    collectTemplates: () => {
      const ctx = AI_TOOLS["claude-code"].templateContext;
      const files = collectBothTemplates(
        ctx,
        (n) => `.claude/commands/devflow/${n}.md`,
        ".claude/skills",
      );
      for (const agent of getClaudeAgents()) {
        files.set(`.claude/agents/${agent.name}.md`, agent.content);
      }
      for (const [k, v] of collectSharedHooks(".claude/hooks", "claude")) {
        files.set(k, v);
      }
      const settings = getClaudeSettings();
      files.set(
        `.claude/${settings.targetPath}`,
        resolvePlaceholders(settings.content),
      );
      return files;
    },
  },
  qoder: {
    configure: configureQoder,
    collectTemplates: () => {
      const files = collectBothTemplates(
        AI_TOOLS.qoder.templateContext,
        (n) => `.qoder/commands/devflow-${n}.md`,
        ".qoder/skills",
        (filePath, content) => {
          const name = path.basename(filePath, ".md");
          return wrapWithCommandFrontmatter(name, content);
        },
      );
      for (const agent of applyPullBasedPreludeMarkdown(getQoderAgents())) {
        files.set(`.qoder/agents/${agent.name}.md`, agent.content);
      }
      for (const [k, v] of collectSharedHooks(".qoder/hooks", "qoder")) {
        files.set(k, v);
      }
      const settings = getQoderSettings();
      files.set(
        `.qoder/${settings.targetPath}`,
        resolvePlaceholders(settings.content),
      );
      return files;
    },
  },
  codebuddy: {
    configure: configureCodebuddy,
    collectTemplates: () => {
      const files = collectBothTemplates(
        AI_TOOLS.codebuddy.templateContext,
        (n) => `.codebuddy/commands/devflow/${n}.md`,
        ".codebuddy/skills",
      );
      for (const agent of getCodebuddyAgents()) {
        files.set(`.codebuddy/agents/${agent.name}.md`, agent.content);
      }
      for (const [k, v] of collectSharedHooks(
        ".codebuddy/hooks",
        "codebuddy",
      )) {
        files.set(k, v);
      }
      const settings = getCodebuddySettings();
      files.set(
        `.codebuddy/${settings.targetPath}`,
        resolvePlaceholders(settings.content),
      );
      return files;
    },
  },
};

// =============================================================================
// Derived Helpers
// =============================================================================

export const PLATFORM_IDS = Object.keys(AI_TOOLS) as AITool[];

export const CONFIG_DIRS = PLATFORM_IDS.map((id) => AI_TOOLS[id].configDir);

export const PLATFORM_MANAGED_DIRS = PLATFORM_IDS.flatMap((id) =>
  getManagedPaths(id),
);

export const ALL_MANAGED_DIRS = [".devflow", ...new Set(PLATFORM_MANAGED_DIRS)];

export function getConfiguredPlatforms(cwd: string): Set<AITool> {
  const platforms = new Set<AITool>();
  for (const id of PLATFORM_IDS) {
    if (fs.existsSync(path.join(cwd, AI_TOOLS[id].configDir))) {
      platforms.add(id);
    }
  }
  return platforms;
}

export function getPlatformsWithPythonHooks(): AITool[] {
  return PLATFORM_IDS.filter((id) => AI_TOOLS[id].hasPythonHooks);
}

export function isManagedPath(dirPath: string): boolean {
  const normalized = dirPath.replace(/\\/g, "/");
  return ALL_MANAGED_DIRS.some(
    (d) => normalized.startsWith(d + "/") || normalized === d,
  );
}

export function isManagedRootDir(dirName: string): boolean {
  return ALL_MANAGED_DIRS.includes(dirName);
}

export function getPlatformManagedPaths(platformId: AITool): string[] {
  return getManagedPaths(platformId);
}

export function configurePlatform(
  platformId: AITool,
  cwd: string,
): Promise<void> {
  return PLATFORM_FUNCTIONS[platformId].configure(cwd);
}

export function collectPlatformTemplates(
  platformId: AITool,
): Map<string, string> | undefined {
  const map = PLATFORM_FUNCTIONS[platformId].collectTemplates?.();
  return map ? replaceInMap(map) : map;
}

export function getInitToolChoices(): {
  key: CliFlag;
  name: string;
  defaultChecked: boolean;
  platformId: AITool;
}[] {
  return PLATFORM_IDS.map((id) => ({
    key: AI_TOOLS[id].cliFlag,
    name: AI_TOOLS[id].name,
    defaultChecked: AI_TOOLS[id].defaultChecked,
    platformId: id,
  }));
}

export function resolveCliFlag(flag: string): AITool | undefined {
  return PLATFORM_IDS.find((id) => AI_TOOLS[id].cliFlag === flag);
}
