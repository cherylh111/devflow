/**
 * DevFlow workflow templates.
 *
 * Existing exported constants are kept as English bytes for compatibility.
 * Runtime writers should call the getter functions so the active template
 * language can select an overlay under templates/zh/.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readLocalizedTemplate } from "../language.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readEnglishTemplate(relativePath: string): string {
  return readFileSync(join(__dirname, relativePath), "utf-8");
}

function readRuntimeTemplate(relativePath: string): string {
  return readLocalizedTemplate(import.meta.url, relativePath);
}

const SCRIPT_PATHS = [
  "__init__.py",
  "common/__init__.py",
  "common/paths.py",
  "common/developer.py",
  "common/git_context.py",
  "common/task_queue.py",
  "common/task_utils.py",
  "common/active_task.py",
  "common/cli_adapter.py",
  "common/config.py",
  "common/io.py",
  "common/log.py",
  "common/git.py",
  "common/types.py",
  "common/tasks.py",
  "common/task_context.py",
  "common/task_progress.py",
  "common/task_store.py",
  "common/session_context.py",
  "common/packages_context.py",
  "common/workflow_phase.py",
  "common/devflow_config.py",
  "common/safe_commit.py",
  "common/trace.py",
  "get_developer.py",
  "init_developer.py",
  "task.py",
  "get_context.py",
  "add_session.py",
  "knowledge.py",
] as const;

function readScriptTemplate(
  relativePath: (typeof SCRIPT_PATHS)[number],
): string {
  return readEnglishTemplate(`scripts/${relativePath}`);
}

// Python scripts - package init
export const scriptsInit = readScriptTemplate("__init__.py");

// Python scripts - common
export const commonInit = readScriptTemplate("common/__init__.py");
export const commonPaths = readScriptTemplate("common/paths.py");
export const commonDeveloper = readScriptTemplate("common/developer.py");
export const commonGitContext = readScriptTemplate("common/git_context.py");
export const commonTaskQueue = readScriptTemplate("common/task_queue.py");
export const commonTaskUtils = readScriptTemplate("common/task_utils.py");
export const commonActiveTask = readScriptTemplate("common/active_task.py");
export const commonCliAdapter = readScriptTemplate("common/cli_adapter.py");
export const commonConfig = readScriptTemplate("common/config.py");
export const commonIo = readScriptTemplate("common/io.py");
export const commonLog = readScriptTemplate("common/log.py");
export const commonGit = readScriptTemplate("common/git.py");
export const commonTypes = readScriptTemplate("common/types.py");
export const commonTasks = readScriptTemplate("common/tasks.py");
export const commonTaskContext = readScriptTemplate("common/task_context.py");
export const commonTaskProgress = readScriptTemplate("common/task_progress.py");
export const commonTaskStore = readScriptTemplate("common/task_store.py");
export const commonSessionContext = readScriptTemplate(
  "common/session_context.py",
);
export const commonPackagesContext = readScriptTemplate(
  "common/packages_context.py",
);
export const commonWorkflowPhase = readScriptTemplate(
  "common/workflow_phase.py",
);
export const commonDevFlowConfig = readScriptTemplate(
  "common/devflow_config.py",
);
export const commonSafeCommit = readScriptTemplate("common/safe_commit.py");
export const commonTrace = readScriptTemplate("common/trace.py");

// Python scripts - main
export const getDeveloperScript = readScriptTemplate("get_developer.py");
export const initDeveloperScript = readScriptTemplate("init_developer.py");
export const taskScript = readScriptTemplate("task.py");
export const getContextScript = readScriptTemplate("get_context.py");
export const addSessionScript = readScriptTemplate("add_session.py");
export const knowledgeScript = readScriptTemplate("knowledge.py");

// Configuration files
export const workflowMdTemplate = readEnglishTemplate("workflow.md");
export const configYamlTemplate = readEnglishTemplate("config.yaml");
export const gitignoreTemplate = readEnglishTemplate("gitignore.txt");

export function getWorkflowMdTemplate(): string {
  return readRuntimeTemplate("workflow.md");
}

export function getConfigYamlTemplate(): string {
  return readRuntimeTemplate("config.yaml");
}

export function getGitignoreTemplate(): string {
  return readRuntimeTemplate("gitignore.txt");
}

export function getAllScripts(): Map<string, string> {
  const scripts = new Map<string, string>();
  for (const scriptPath of SCRIPT_PATHS) {
    scripts.set(scriptPath, readRuntimeTemplate(`scripts/${scriptPath}`));
  }
  return scripts;
}
