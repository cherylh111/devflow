/**
 * `devflow workflow` command — list and switch the active `.devflow/workflow.md`.
 *
 * Behavior contracts:
 *
 * - Hash boundary: after writing native content, refresh the
 *   `.devflow/workflow.md` entry in `.template-hashes.json`. After writing
 *   any non-native content, remove that entry. This prevents `devflow update`
 *   from silently restoring native bytes over a user-selected variant
 *   (see design.md "Durable-state contract").
 *
 * - Modified-file protection: if the on-disk workflow has been edited (hash
 *   mismatch and it isn't already byte-identical to the chosen template),
 *   interactive runs prompt; non-interactive runs fail unless `--force` or
 *   `--create-new` was passed.
 *
 * - `--create-new`: never touches `.devflow/workflow.md`; writes
 *   `.devflow/workflow.md.new` and leaves the hash file alone.
 */

import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import inquirer from "inquirer";

import { DIR_NAMES, PATHS } from "../constants/paths.js";
import { collectMissingAgents } from "../utils/agent-refs.js";
import { replacePythonCommandLiterals } from "../configurators/shared.js";
import {
  computeHash,
  loadHashes,
  removeHash,
  updateHashes,
} from "../utils/template-hash.js";
import {
  listWorkflowTemplates,
  resolveWorkflowTemplate,
  NATIVE_WORKFLOW_ID,
  WorkflowResolveError,
  type ResolvedWorkflowTemplate,
  type WorkflowTemplateListing,
} from "../utils/workflow-resolver.js";
import { localized } from "../utils/language-config.js";

export interface WorkflowCommandOptions {
  template?: string;
  marketplace?: string;
  list?: boolean;
  force?: boolean;
  createNew?: boolean;
}

function workflowFilePath(cwd: string): string {
  return path.join(cwd, PATHS.WORKFLOW_GUIDE_FILE);
}

function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY);
}

function printListing(templates: WorkflowTemplateListing[]): void {
  console.log(
    chalk.cyan(
      localized(
        "\nAvailable workflow templates:\n",
        "\n可用的工作流模板：\n",
      ),
    ),
  );
  for (const t of templates) {
    const tag =
      t.source === "bundled"
        ? chalk.gray(localized(" (bundled)", "（内置）"))
        : chalk.gray(localized(" (marketplace)", "（marketplace）"));
    console.log(`  ${chalk.green(t.id)}${tag} — ${t.name}`);
    if (t.description) {
      console.log(chalk.gray(`    ${t.description}`));
    }
  }
  console.log("");
}

/**
 * Decide whether the existing workflow.md is byte-identical to the resolved
 * template (treat as "safe to overwrite"), pristine (matches tracked hash —
 * also safe), or user-modified (needs confirmation / --force).
 */
function classifyExistingWorkflow(
  cwd: string,
  newContent: string,
):
  | { kind: "missing" }
  | { kind: "identical" }
  | { kind: "pristine" }
  | { kind: "modified" } {
  const filePath = workflowFilePath(cwd);
  if (!fs.existsSync(filePath)) {
    return { kind: "missing" };
  }
  const current = fs.readFileSync(filePath, "utf-8");
  if (current === newContent) {
    return { kind: "identical" };
  }
  const hashes = loadHashes(cwd);
  const storedHash = hashes[PATHS.WORKFLOW_GUIDE_FILE];
  if (storedHash && storedHash === computeHash(current)) {
    return { kind: "pristine" };
  }
  return { kind: "modified" };
}

async function chooseTemplateInteractively(
  templates: WorkflowTemplateListing[],
): Promise<string | null> {
  if (templates.length === 0) return null;
  const { id } = await inquirer.prompt<{ id: string }>([
    {
      type: "list",
      name: "id",
      message: localized("Select a workflow template:", "选择一个工作流模板："),
      choices: templates.map((t) => ({
        name: `${t.id} — ${t.name}${t.source === "bundled" ? localized(" (bundled)", "（内置）") : ""}`,
        value: t.id,
      })),
    },
  ]);
  return id;
}

async function confirmOverwriteInteractively(): Promise<
  "overwrite" | "skip" | "create-new"
> {
  const { action } = await inquirer.prompt<{ action: string }>([
    {
      type: "list",
      name: "action",
      message:
        localized(
          "Your .devflow/workflow.md has local edits. What do you want to do?",
          "你的 .devflow/workflow.md 有本地修改。要怎么处理？",
        ),
      choices: [
        {
          name: localized(
            "Overwrite (replace local edits)",
            "覆盖（替换本地修改）",
          ),
          value: "overwrite",
        },
        {
          name: localized(
            "Write to .devflow/workflow.md.new and keep current",
            "写入 .devflow/workflow.md.new 并保留当前文件",
          ),
          value: "create-new",
        },
        {
          name: localized("Skip (no changes)", "跳过（不修改）"),
          value: "skip",
        },
      ],
    },
  ]);
  return action as "overwrite" | "skip" | "create-new";
}

function applyHashContract(cwd: string, templateId: string): void {
  const relPath = PATHS.WORKFLOW_GUIDE_FILE;
  if (templateId === NATIVE_WORKFLOW_ID) {
    const filePath = workflowFilePath(cwd);
    const current = fs.readFileSync(filePath, "utf-8");
    const files = new Map<string, string>();
    files.set(relPath, current);
    updateHashes(cwd, files);
  } else {
    // Non-native workflow is user-managed local content. Drop the hash entry
    // so `devflow update` treats it as modified and does not silently restore
    // native bytes.
    removeHash(cwd, relPath);
  }
}

async function writeWorkflow(
  cwd: string,
  template: ResolvedWorkflowTemplate,
  options: WorkflowCommandOptions,
): Promise<void> {
  const filePath = workflowFilePath(cwd);
  const dest = path.dirname(filePath);
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const finalContent = replacePythonCommandLiterals(template.content);

  // `--create-new` always writes the `.new` sibling, regardless of disk state.
  if (options.createNew) {
    const newPath = `${filePath}.new`;
    fs.writeFileSync(newPath, finalContent, "utf-8");
    console.log(
      chalk.cyan(
        localized(
          `  + Wrote ${path.relative(cwd, newPath)} (workflow.md unchanged)`,
          `  + 已写入 ${path.relative(cwd, newPath)}（workflow.md 未改变）`,
        ),
      ),
    );
    return;
  }

  const classification = classifyExistingWorkflow(cwd, finalContent);

  if (classification.kind === "identical") {
    console.log(
      chalk.gray(
        localized(
          `  ○ ${PATHS.WORKFLOW_GUIDE_FILE} already matches "${template.id}" — refreshing hash entry`,
          `  ○ ${PATHS.WORKFLOW_GUIDE_FILE} 已经匹配 "${template.id}"，正在刷新 hash 记录`,
        ),
      ),
    );
    applyHashContract(cwd, template.id);
    return;
  }

  if (classification.kind === "modified" && !options.force) {
    const explicitTemplate = Boolean(options.template);
    if (explicitTemplate || !isInteractive()) {
      throw new WorkflowCommandError(
        localized(
          `${PATHS.WORKFLOW_GUIDE_FILE} has local edits. Re-run with --force to overwrite or --create-new to write ${PATHS.WORKFLOW_GUIDE_FILE}.new.`,
          `${PATHS.WORKFLOW_GUIDE_FILE} 有本地修改。请重新运行并加上 --force 覆盖，或加上 --create-new 写入 ${PATHS.WORKFLOW_GUIDE_FILE}.new。`,
        ),
      );
    }
    const action = await confirmOverwriteInteractively();
    if (action === "skip") {
      console.log(chalk.gray(localized("  ○ Skipped", "  ○ 已跳过")));
      return;
    }
    if (action === "create-new") {
      const newPath = `${filePath}.new`;
      fs.writeFileSync(newPath, finalContent, "utf-8");
      console.log(
        chalk.cyan(
          localized(
            `  + Wrote ${path.relative(cwd, newPath)} (workflow.md unchanged)`,
            `  + 已写入 ${path.relative(cwd, newPath)}（workflow.md 未改变）`,
          ),
        ),
      );
      return;
    }
    // fall through to overwrite
  }

  fs.writeFileSync(filePath, finalContent, "utf-8");
  console.log(
    chalk.green(
      localized(
        `  ✓ Replaced ${PATHS.WORKFLOW_GUIDE_FILE} with "${template.id}"`,
        `  ✓ 已将 ${PATHS.WORKFLOW_GUIDE_FILE} 替换为 "${template.id}"`,
      ),
    ),
  );
  applyHashContract(cwd, template.id);
}

/**
 * Distinct error class so `cli/index.ts` can format these as user errors
 * without dumping stack traces.
 */
export class WorkflowCommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowCommandError";
  }
}

export async function runWorkflowCommand(
  options: WorkflowCommandOptions,
): Promise<void> {
  const cwd = process.cwd();
  if (!fs.existsSync(path.join(cwd, DIR_NAMES.WORKFLOW))) {
    throw new WorkflowCommandError(
      localized(
        "No .devflow/ directory found. Run `devflow init` first.",
        "未找到 .devflow/ 目录。请先运行 `devflow init`。",
      ),
    );
  }

  // List mode — print and exit.
  if (options.list) {
    const { templates, errorMessage } = await listWorkflowTemplates({
      source: options.marketplace,
    });
    printListing(templates);
    if (errorMessage) {
      console.log(chalk.yellow(`⚠ ${errorMessage}`));
    }
    return;
  }

  // Resolve template id (non-interactive flag or interactive picker).
  let templateId = options.template;
  if (!templateId) {
    if (!isInteractive()) {
      throw new WorkflowCommandError(
        localized(
          "No --template specified and stdin is not a TTY. Pass --template <id> or run interactively.",
          "未指定 --template，且 stdin 不是 TTY。请传入 --template <id> 或在交互模式下运行。",
        ),
      );
    }
    const { templates, errorMessage } = await listWorkflowTemplates({
      source: options.marketplace,
    });
    if (errorMessage) {
      console.log(chalk.yellow(`⚠ ${errorMessage}`));
    }
    const picked = await chooseTemplateInteractively(templates);
    if (!picked) {
      throw new WorkflowCommandError(
        localized(
          "No workflow template available.",
          "没有可用的工作流模板。",
        ),
      );
    }
    templateId = picked;
  }

  // Resolve content.
  let template: ResolvedWorkflowTemplate;
  try {
    template = await resolveWorkflowTemplate(templateId, {
      source: options.marketplace,
    });
  } catch (err) {
    if (err instanceof WorkflowResolveError) {
      throw new WorkflowCommandError(err.message);
    }
    throw err;
  }

  await writeWorkflow(cwd, template, options);

  // Best-effort warning: if the resolved workflow references
  // `.devflow/agents/<name>.md` files that don't exist on disk, point the user
  // at `devflow update` so `devflow channel spawn --agent <name>` doesn't fail
  // mid-session. Non-blocking; never errors a successful write.
  warnAboutMissingAgents(cwd, template.content);
}

function warnAboutMissingAgents(cwd: string, workflowContent: string): void {
  const missing = collectMissingAgents(cwd, workflowContent);
  if (missing.length === 0) return;
  process.stderr.write(
    chalk.yellow(
      `\nWarning: The selected workflow references .devflow/agents/{${missing.join(",")}}.md, but those files are not on disk.\n`,
    ) +
      chalk.yellow(
        `  Run \`devflow update\` to backfill the bundled agent definitions, or create them under ${PATHS.AGENTS}/.\n`,
      ),
  );
}
