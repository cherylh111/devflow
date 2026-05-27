import fs from "node:fs";
import path from "node:path";
import { DIR_NAMES } from "../constants/paths.js";
import {
  getTemplateLanguage,
  normalizeTemplateLanguage,
  setTemplateLanguage,
  type TemplateLanguage,
} from "../templates/language.js";

export function loadConfiguredLanguage(cwd: string): string | undefined {
  const configPath = path.join(cwd, DIR_NAMES.WORKFLOW, "config.yaml");
  if (!fs.existsSync(configPath)) return undefined;

  try {
    const content = fs.readFileSync(configPath, "utf-8");
    const match = content.match(/^\s*language\s*:\s*["']?([^"'\s#]+)["']?/m);
    return match?.[1];
  } catch {
    return undefined;
  }
}

export function configureTemplateLanguage(
  cwd: string,
  override?: string,
): TemplateLanguage {
  const language = normalizeTemplateLanguage(
    override ?? process.env.DEVFLOW_LANG ?? loadConfiguredLanguage(cwd),
  );
  setTemplateLanguage(language);
  return language;
}

export function localized(en: string, zh: string): string {
  return getTemplateLanguage() === "zh" ? zh : en;
}
