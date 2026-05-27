/**
 * Common templates - single source of truth for all platforms.
 *
 * These templates contain {{placeholders}} that are resolved per-platform
 * by resolvePlaceholders() in configurators/shared.ts.
 */

import { readdirSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { getTemplateLanguage, readLocalizedTemplate } from "../language.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readTemplate(relativePath: string): string {
  return readLocalizedTemplate(import.meta.url, relativePath);
}

function listMarkdownFiles(dir: string): string[] {
  try {
    return readdirSync(join(__dirname, dir))
      .filter((f) => f.endsWith(".md"))
      .sort();
  } catch {
    return [];
  }
}

export interface CommonTemplate {
  /** Template name without extension (e.g., "start", "before-dev") */
  name: string;
  /** Raw content with {{placeholders}} - must be resolved before writing */
  content: string;
}

export interface CommonBundledSkillFile {
  /** POSIX path relative to the skill directory, e.g. "references/core.md" */
  relativePath: string;
  /** Raw content with {{placeholders}} - must be resolved before writing */
  content: string;
}

export interface CommonBundledSkill {
  /** Skill directory name, e.g. "devflow-meta" */
  name: string;
  /** Files that must be written under the skill directory */
  files: CommonBundledSkillFile[];
}

const cachedCommands = new Map<string, CommonTemplate[]>();
const cachedSkills = new Map<string, CommonTemplate[]>();
const cachedBundledSkills = new Map<string, CommonBundledSkill[]>();

export function getCommandTemplates(): CommonTemplate[] {
  const language = getTemplateLanguage();
  const cached = cachedCommands.get(language);
  if (cached) return cached;
  const templates = listMarkdownFiles("commands").map((file) => ({
    name: file.replace(/\.md$/, ""),
    content: readTemplate(`commands/${file}`),
  }));
  cachedCommands.set(language, templates);
  return templates;
}

export function getSkillTemplates(): CommonTemplate[] {
  const language = getTemplateLanguage();
  const cached = cachedSkills.get(language);
  if (cached) return cached;
  const templates = listMarkdownFiles("skills").map((file) => ({
    name: file.replace(/\.md$/, ""),
    content: readTemplate(`skills/${file}`),
  }));
  cachedSkills.set(language, templates);
  return templates;
}

function listDirectories(dir: string): string[] {
  try {
    return readdirSync(join(__dirname, dir))
      .filter((entry) => statSync(join(__dirname, dir, entry)).isDirectory())
      .sort();
  } catch {
    return [];
  }
}

function toPosixRelativePath(root: string, filePath: string): string {
  return relative(root, filePath).split(sep).join("/");
}

function listBundledSkillFiles(skillDir: string): CommonBundledSkillFile[] {
  const root = join(__dirname, "bundled-skills", skillDir);
  const files: CommonBundledSkillFile[] = [];

  function walk(dir: string): void {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else {
        const relativePath = toPosixRelativePath(root, fullPath);
        files.push({
          relativePath,
          content: readTemplate(`bundled-skills/${skillDir}/${relativePath}`),
        });
      }
    }
  }

  walk(root);
  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export function getBundledSkillTemplates(): CommonBundledSkill[] {
  const language = getTemplateLanguage();
  const cached = cachedBundledSkills.get(language);
  if (cached) return cached;
  const templates = listDirectories("bundled-skills").map((name) => ({
    name,
    files: listBundledSkillFiles(name),
  }));
  cachedBundledSkills.set(language, templates);
  return templates;
}
