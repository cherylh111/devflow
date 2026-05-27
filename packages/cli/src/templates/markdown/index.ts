/**
 * Markdown templates for DevFlow workflow.
 *
 * Existing constants remain English for compatibility. Runtime writers should
 * call the getter functions so the active template language can select an
 * overlay under templates/zh/.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readLocalizedTemplate } from "../language.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readEnglishTemplate(filename: string): string {
  return readFileSync(join(__dirname, filename), "utf-8");
}

function readRuntimeTemplate(filename: string): string {
  return readLocalizedTemplate(import.meta.url, filename);
}

// Root files for new projects
export const agentsMdContent: string = readEnglishTemplate("agents.md");
export const workspaceIndexContent: string =
  readEnglishTemplate("workspace-index.md");
export const agentProgressIndexContent = workspaceIndexContent;
export const workflowGitignoreContent: string =
  readEnglishTemplate("gitignore.txt");

// Backend structure
export const backendIndexContent: string = readEnglishTemplate(
  "spec/backend/index.md.txt",
);
export const backendDirectoryStructureContent: string = readEnglishTemplate(
  "spec/backend/directory-structure.md.txt",
);
export const backendDatabaseGuidelinesContent: string = readEnglishTemplate(
  "spec/backend/database-guidelines.md.txt",
);
export const backendLoggingGuidelinesContent: string = readEnglishTemplate(
  "spec/backend/logging-guidelines.md.txt",
);
export const backendQualityGuidelinesContent: string = readEnglishTemplate(
  "spec/backend/quality-guidelines.md.txt",
);
export const backendErrorHandlingContent: string = readEnglishTemplate(
  "spec/backend/error-handling.md.txt",
);

// Frontend structure
export const frontendIndexContent: string = readEnglishTemplate(
  "spec/frontend/index.md.txt",
);
export const frontendDirectoryStructureContent: string = readEnglishTemplate(
  "spec/frontend/directory-structure.md.txt",
);
export const frontendTypeSafetyContent: string = readEnglishTemplate(
  "spec/frontend/type-safety.md.txt",
);
export const frontendHookGuidelinesContent: string = readEnglishTemplate(
  "spec/frontend/hook-guidelines.md.txt",
);
export const frontendComponentGuidelinesContent: string = readEnglishTemplate(
  "spec/frontend/component-guidelines.md.txt",
);
export const frontendQualityGuidelinesContent: string = readEnglishTemplate(
  "spec/frontend/quality-guidelines.md.txt",
);
export const frontendStateManagementContent: string = readEnglishTemplate(
  "spec/frontend/state-management.md.txt",
);

// Guides structure
export const guidesIndexContent: string = readEnglishTemplate(
  "spec/guides/index.md.txt",
);
export const guidesCrossLayerThinkingGuideContent: string = readEnglishTemplate(
  "spec/guides/cross-layer-thinking-guide.md.txt",
);
export const guidesCodeReuseThinkingGuideContent: string = readEnglishTemplate(
  "spec/guides/code-reuse-thinking-guide.md.txt",
);

export function getAgentsMdContent(): string {
  return readRuntimeTemplate("agents.md");
}

export function getWorkspaceIndexContent(): string {
  return readRuntimeTemplate("workspace-index.md");
}

export function getWorkflowGitignoreContent(): string {
  return readRuntimeTemplate("gitignore.txt");
}

export function getBackendIndexContent(): string {
  return readRuntimeTemplate("spec/backend/index.md.txt");
}

export function getBackendDirectoryStructureContent(): string {
  return readRuntimeTemplate("spec/backend/directory-structure.md.txt");
}

export function getBackendDatabaseGuidelinesContent(): string {
  return readRuntimeTemplate("spec/backend/database-guidelines.md.txt");
}

export function getBackendLoggingGuidelinesContent(): string {
  return readRuntimeTemplate("spec/backend/logging-guidelines.md.txt");
}

export function getBackendQualityGuidelinesContent(): string {
  return readRuntimeTemplate("spec/backend/quality-guidelines.md.txt");
}

export function getBackendErrorHandlingContent(): string {
  return readRuntimeTemplate("spec/backend/error-handling.md.txt");
}

export function getFrontendIndexContent(): string {
  return readRuntimeTemplate("spec/frontend/index.md.txt");
}

export function getFrontendDirectoryStructureContent(): string {
  return readRuntimeTemplate("spec/frontend/directory-structure.md.txt");
}

export function getFrontendTypeSafetyContent(): string {
  return readRuntimeTemplate("spec/frontend/type-safety.md.txt");
}

export function getFrontendHookGuidelinesContent(): string {
  return readRuntimeTemplate("spec/frontend/hook-guidelines.md.txt");
}

export function getFrontendComponentGuidelinesContent(): string {
  return readRuntimeTemplate("spec/frontend/component-guidelines.md.txt");
}

export function getFrontendQualityGuidelinesContent(): string {
  return readRuntimeTemplate("spec/frontend/quality-guidelines.md.txt");
}

export function getFrontendStateManagementContent(): string {
  return readRuntimeTemplate("spec/frontend/state-management.md.txt");
}

export function getGuidesIndexContent(): string {
  return readRuntimeTemplate("spec/guides/index.md.txt");
}

export function getGuidesCrossLayerThinkingGuideContent(): string {
  return readRuntimeTemplate("spec/guides/cross-layer-thinking-guide.md.txt");
}

export function getGuidesCodeReuseThinkingGuideContent(): string {
  return readRuntimeTemplate("spec/guides/code-reuse-thinking-guide.md.txt");
}
