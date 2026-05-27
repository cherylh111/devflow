import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureDir, writeFile } from "../utils/file-writer.js";
import { replacePythonCommandLiterals } from "../configurators/shared.js";
import { readLocalizedTemplate } from "./language.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type TemplateCategory = "scripts" | "markdown" | "commands";

/**
 * Get the path to the devflow templates directory (.devflow/ scaffolding).
 */
export function getDevFlowTemplatePath(): string {
  const templatePath = path.join(__dirname, "devflow");
  if (fs.existsSync(templatePath)) {
    return templatePath;
  }
  throw new Error(
    "Could not find devflow templates directory. Expected at templates/devflow/",
  );
}

/** @deprecated Use getDevFlowTemplatePath() instead. */
export function getDevFlowSourcePath(): string {
  return getDevFlowTemplatePath();
}

/**
 * Get the path to the claude templates directory (hooks, agents, settings).
 */
export function getClaudeTemplatePath(): string {
  const templatePath = path.join(__dirname, "claude");
  if (fs.existsSync(templatePath)) {
    return templatePath;
  }
  throw new Error(
    "Could not find claude templates directory. Expected at templates/claude/",
  );
}

/**
 * Get the path to the opencode templates directory (agents, plugins, lib).
 */
export function getOpenCodeTemplatePath(): string {
  const templatePath = path.join(__dirname, "opencode");
  if (fs.existsSync(templatePath)) {
    return templatePath;
  }
  throw new Error(
    "Could not find opencode templates directory. Expected at templates/opencode/",
  );
}

/**
 * Get the path to the Pi Agent templates directory (agents, extension, settings).
 */
export function getPiTemplatePath(): string {
  const templatePath = path.join(__dirname, "pi");
  if (fs.existsSync(templatePath)) {
    return templatePath;
  }
  throw new Error(
    "Could not find pi templates directory. Expected at templates/pi/",
  );
}

/** @deprecated Use getPiTemplatePath() instead. */
export function getPiSourcePath(): string {
  return getPiTemplatePath();
}

/**
 * Read a file from the devflow template directory.
 */
export function readDevFlowFile(relativePath: string): string {
  return readLocalizedTemplate(import.meta.url, `devflow/${relativePath}`);
}

/**
 * Read template content from a category directory.
 */
export function readTemplate(
  category: TemplateCategory,
  filename: string,
): string {
  const templatePath = path.join(__dirname, category, filename);
  return fs.readFileSync(templatePath, "utf-8");
}

export function readScript(relativePath: string): string {
  return readDevFlowFile(`scripts/${relativePath}`);
}

export function readMarkdown(relativePath: string): string {
  return readDevFlowFile(relativePath);
}

export function readCommand(filename: string): string {
  return readTemplate("commands", filename);
}

/**
 * Copy a directory from devflow templates to target, making scripts executable.
 */
export async function copyDevFlowDir(
  srcRelativePath: string,
  destPath: string,
  options?: { executable?: boolean },
): Promise<void> {
  const devflowPath = getDevFlowSourcePath();
  const srcPath = path.join(devflowPath, srcRelativePath);
  await copyDirRecursive(srcPath, destPath, options);
}

async function copyDirRecursive(
  src: string,
  dest: string,
  options?: { executable?: boolean },
): Promise<void> {
  ensureDir(dest);

  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      await copyDirRecursive(srcPath, destPath, options);
    } else {
      const sourceRelativePath = path
        .relative(path.join(__dirname, "devflow"), srcPath)
        .split(path.sep)
        .join("/");
      const content = readDevFlowFile(sourceRelativePath);
      const isExecutable =
        options?.executable && (entry.endsWith(".sh") || entry.endsWith(".py"));
      await writeFile(destPath, replacePythonCommandLiterals(content), {
        executable: isExecutable,
      });
    }
  }
}
