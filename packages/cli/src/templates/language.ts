import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export type TemplateLanguage = "en" | "zh";

let activeTemplateLanguage: TemplateLanguage = "en";

export function normalizeTemplateLanguage(
  value: string | undefined,
): TemplateLanguage {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || normalized === "en" || normalized === "english") {
    return "en";
  }
  if (
    normalized === "zh" ||
    normalized === "cn" ||
    normalized === "zh-cn" ||
    normalized === "chinese" ||
    normalized === "han"
  ) {
    return "zh";
  }
  throw new Error(`Unsupported DevFlow language "${value}". Use "en" or "zh".`);
}

export function setTemplateLanguage(language: TemplateLanguage): void {
  activeTemplateLanguage = language;
}

export function getTemplateLanguage(): TemplateLanguage {
  return activeTemplateLanguage;
}

export function getTemplatesRoot(): string {
  return dirname(fileURLToPath(import.meta.url));
}

export function getLocalizedTemplatePath(
  importMetaUrl: string,
  relativePath: string,
): string {
  const sourceDir = dirname(fileURLToPath(importMetaUrl));
  return getLocalizedTemplatePathFromEnglishPath(join(sourceDir, relativePath));
}

export function getLocalizedTemplatePathFromEnglishPath(
  englishPath: string,
): string {
  if (activeTemplateLanguage === "en") {
    return englishPath;
  }

  const templatesRoot = getTemplatesRoot();
  const sourceRelative = relative(templatesRoot, englishPath);
  const localizedPath = join(
    templatesRoot,
    activeTemplateLanguage,
    sourceRelative,
  );
  return existsSync(localizedPath) ? localizedPath : englishPath;
}

export function readLocalizedTemplate(
  importMetaUrl: string,
  relativePath: string,
): string {
  return readFileSync(
    getLocalizedTemplatePath(importMetaUrl, relativePath),
    "utf-8",
  );
}

export function readLocalizedTemplateFile(englishPath: string): string {
  return readFileSync(
    getLocalizedTemplatePathFromEnglishPath(englishPath),
    "utf-8",
  );
}
