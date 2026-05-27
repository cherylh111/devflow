import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import { init } from "../commands/init.js";
import { update } from "../commands/update.js";
import { upgrade } from "../commands/upgrade.js";
import { uninstall } from "../commands/uninstall.js";
import { runMem } from "../commands/mem.js";
import {
  runWorkflowCommand,
  WorkflowCommandError,
} from "../commands/workflow.js";
import { registerChannelCommand } from "../commands/channel/index.js";
import { registerKnowledgeCommand } from "../commands/knowledge/index.js";
import { DIR_NAMES } from "../constants/paths.js";
import { PACKAGE_NAME, VERSION } from "../constants/version.js";
import { compareVersions } from "../utils/compare-versions.js";
import {
  configureTemplateLanguage,
  localized,
} from "../utils/language-config.js";
import { applyCommanderLocalization } from "../utils/commander-localization.js";

// Re-export for backwards compatibility (consumers should prefer constants/version.js)
export { VERSION, PACKAGE_NAME };

/**
 * Check if a DevFlow update is available (compare project version with CLI version)
 */
function checkForUpdates(cwd: string): void {
  const versionFile = path.join(cwd, DIR_NAMES.WORKFLOW, ".version");

  if (!fs.existsSync(versionFile)) return;

  const projectVersion = fs.readFileSync(versionFile, "utf-8").trim();
  const cliVersion = VERSION;
  const comparison = compareVersions(cliVersion, projectVersion);

  if (comparison > 0) {
    // CLI is newer than project - update available
    console.log(
      chalk.yellow(
        `\n⚠️  DevFlow update available: ${projectVersion} → ${cliVersion}`,
      ),
    );
    console.log(chalk.gray(`   Run: devflow update\n`));
  } else if (comparison < 0) {
    // CLI is older than project - CLI needs updating
    console.log(
      chalk.yellow(
        `\n⚠️  Your CLI (${cliVersion}) is older than project (${projectVersion})`,
      ),
    );
    console.log(chalk.gray(`   Run: devflow upgrade\n`));
  }
}

// Check for updates at CLI startup (only if .devflow exists)
const cwd = process.cwd();
configureTemplateLanguage(cwd);
if (fs.existsSync(path.join(cwd, DIR_NAMES.WORKFLOW))) {
  checkForUpdates(cwd);
}

const program = new Command();

program
  .name("devflow")
  .description(
    localized(
      "AI-assisted development workflow framework for Cursor, Claude Code and more",
      "面向 Cursor、Claude Code 等工具的 AI 辅助开发工作流框架",
    ),
  )
  .version(
    VERSION,
    "-v, --version",
    localized("output the version number", "输出版本号"),
  )
  .helpOption("-h, --help", localized("display help for command", "显示命令帮助"))
  .addHelpCommand(
    "help [command]",
    localized("display help for command", "显示命令帮助"),
  );

program
  .command("init")
  .description(
    localized(
      "Initialize devflow in the current project",
      "在当前项目初始化 DevFlow",
    ),
  )
  .option("--cursor", localized("Include Cursor commands", "包含 Cursor 命令"))
  .option(
    "--claude",
    localized("Include Claude Code commands", "包含 Claude Code 命令"),
  )
  .option(
    "--opencode",
    localized("Include OpenCode commands", "包含 OpenCode 命令"),
  )
  .option("--codex", localized("Include Codex skills", "包含 Codex skill"))
  .option(
    "--kilo",
    localized("Include Kilo CLI commands", "包含 Kilo CLI 命令"),
  )
  .option(
    "--kiro",
    localized("Include Kiro Code skills", "包含 Kiro Code skill"),
  )
  .option(
    "--gemini",
    localized("Include Gemini CLI commands", "包含 Gemini CLI 命令"),
  )
  .option(
    "--antigravity",
    localized("Include Antigravity workflows", "包含 Antigravity 工作流"),
  )
  .option(
    "--windsurf",
    localized("Include Windsurf workflows", "包含 Windsurf 工作流"),
  )
  .option("--qoder", localized("Include Qoder commands", "包含 Qoder 命令"))
  .option(
    "--codebuddy",
    localized("Include CodeBuddy commands", "包含 CodeBuddy 命令"),
  )
  .option(
    "--copilot",
    localized("Include GitHub Copilot hooks", "包含 GitHub Copilot hook"),
  )
  .option(
    "--droid",
    localized("Include Factory Droid commands", "包含 Factory Droid 命令"),
  )
  .option(
    "--pi",
    localized("Include Pi Agent extension assets", "包含 Pi Agent 扩展资源"),
  )
  .option(
    "--lang <lang>",
    localized("Template language: en or zh", "模板语言：en 或 zh"),
  )
  .option(
    "-y, --yes",
    localized("Skip prompts and use defaults", "跳过提示并使用默认值"),
  )
  .option(
    "-u, --user <name>",
    localized(
      "Initialize developer identity with specified name",
      "使用指定名称初始化开发者身份",
    ),
  )
  .option(
    "-f, --force",
    localized(
      "Overwrite existing files without asking",
      "不询问，直接覆盖已有文件",
    ),
  )
  .option(
    "-s, --skip-existing",
    localized("Skip existing files without asking", "不询问，跳过已有文件"),
  )
  .option(
    "--monorepo",
    localized("Force monorepo mode", "强制使用 monorepo 模式"),
  )
  .option(
    "--no-monorepo",
    localized("Skip monorepo detection", "跳过 monorepo 检测"),
  )
  .option(
    "-t, --template <name>",
    localized(
      "Use a remote spec template (e.g., electron-fullstack)",
      "使用远程 spec 模板（例如 electron-fullstack）",
    ),
  )
  .option(
    "--overwrite",
    localized(
      "Overwrite existing spec directory when using template",
      "使用模板时覆盖已有 spec 目录",
    ),
  )
  .option(
    "--append",
    localized(
      "Only add missing files when using template",
      "使用模板时只添加缺失文件",
    ),
  )
  .option(
    "-r, --registry <source>",
    localized(
      "Use a custom template registry (e.g., gh:myorg/myrepo/specs)",
      "使用自定义模板 registry（例如 gh:myorg/myrepo/specs）",
    ),
  )
  .option(
    "--workflow <id>",
    localized(
      "Workflow template id for .devflow/workflow.md (default: native; e.g., tdd, channel-driven-subagent-dispatch)",
      ".devflow/workflow.md 的工作流模板 id（默认 native，例如 tdd、channel-driven-subagent-dispatch）",
    ),
  )
  .option(
    "--workflow-source <source>",
    localized(
      "Custom marketplace source for the --workflow lookup (e.g., gh:myorg/myrepo/marketplace)",
      "--workflow 查询使用的自定义 marketplace 来源（例如 gh:myorg/myrepo/marketplace）",
    ),
  )
  .action(async (options: Record<string, unknown>) => {
    try {
      await init(options);
    } catch (error) {
      console.error(
        chalk.red(localized("Error:", "错误：")),
        error instanceof Error ? error.message : error,
      );
      if (process.env.DEBUG || process.env.DEVFLOW_DEBUG) {
        console.error(error instanceof Error ? error.stack : error);
      }
      process.exit(1);
    }
  });

program
  .command("update")
  .description(
    localized(
      "Update devflow configuration and commands to latest version",
      "将 DevFlow 配置和命令更新到最新版本",
    ),
  )
  .option(
    "--dry-run",
    localized("Preview changes without applying them", "预览变更但不写入"),
  )
  .option(
    "-f, --force",
    localized(
      "Overwrite all changed files without asking",
      "不询问，覆盖所有已变更文件",
    ),
  )
  .option(
    "-s, --skip-all",
    localized(
      "Skip all changed files without asking",
      "不询问，跳过所有已变更文件",
    ),
  )
  .option(
    "-n, --create-new",
    localized(
      "Create .new copies for all changed files",
      "为所有已变更文件创建 .new 副本",
    ),
  )
  .option(
    "--allow-downgrade",
    localized("Allow downgrading to an older version", "允许降级到旧版本"),
  )
  .option(
    "--migrate",
    localized(
      "Apply pending file migrations (renames/deletions)",
      "应用待处理文件迁移（重命名/删除）",
    ),
  )
  .option(
    "--lang <lang>",
    localized("Template language override: en or zh", "覆盖模板语言：en 或 zh"),
  )
  .action(async (options: Record<string, unknown>) => {
    try {
      await update({
        dryRun: options.dryRun as boolean,
        force: options.force as boolean,
        skipAll: options.skipAll as boolean,
        createNew: options.createNew as boolean,
        allowDowngrade: options.allowDowngrade as boolean,
        migrate: options.migrate as boolean,
        lang: options.lang as string | undefined,
      });
    } catch (error) {
      console.error(
        chalk.red(localized("Error:", "错误：")),
        error instanceof Error ? error.message : error,
      );
      if (process.env.DEBUG || process.env.DEVFLOW_DEBUG) {
        console.error(error instanceof Error ? error.stack : error);
      }
      process.exit(1);
    }
  });

program
  .command("upgrade")
  .description(
    localized(
      "Upgrade the global DevFlow CLI package",
      "升级全局 DevFlow CLI 包",
    ),
  )
  .option(
    "--tag <tag>",
    localized(
      "npm dist-tag or version to install (default follows current channel: latest, beta, or rc)",
      "要安装的 npm dist-tag 或版本（默认跟随当前通道：latest、beta 或 rc）",
    ),
  )
  .option(
    "--dry-run",
    localized(
      "Print the install command without running it",
      "只打印安装命令，不执行",
    ),
  )
  .action(async (options: Record<string, unknown>) => {
    try {
      await upgrade({
        tag: options.tag as string | undefined,
        dryRun: options.dryRun as boolean,
      });
    } catch (error) {
      console.error(
        chalk.red(localized("Error:", "错误：")),
        error instanceof Error ? error.message : error,
      );
      if (process.env.DEBUG || process.env.DEVFLOW_DEBUG) {
        console.error(error instanceof Error ? error.stack : error);
      }
      process.exit(1);
    }
  });

program
  .command("uninstall")
  .description(
    localized(
      "Remove all devflow files (managed platform files + .devflow/) from this project",
      "从当前项目移除所有 DevFlow 文件（受管平台文件和 .devflow/）",
    ),
  )
  .option("-y, --yes", localized("Skip confirmation prompt", "跳过确认提示"))
  .option(
    "--dry-run",
    localized(
      "List what would be removed without changing anything",
      "只列出会移除的内容，不实际修改",
    ),
  )
  .action(async (options: Record<string, unknown>) => {
    try {
      await uninstall({
        yes: options.yes as boolean,
        dryRun: options.dryRun as boolean,
      });
    } catch (error) {
      console.error(
        chalk.red(localized("Error:", "错误：")),
        error instanceof Error ? error.message : error,
      );
      if (process.env.DEBUG || process.env.DEVFLOW_DEBUG) {
        console.error(error instanceof Error ? error.stack : error);
      }
      process.exit(1);
    }
  });

program
  .command("mem")
  .description(
    localized(
      "Search/recall AI conversation history across Claude Code, Codex, OpenCode (run 'devflow mem help' for subcommands and flags)",
      "搜索/召回 Claude Code、Codex、OpenCode 的 AI 会话历史（运行 'devflow mem help' 查看子命令和参数）",
    ),
  )
  .allowUnknownOption(true)
  .helpOption(false)
  .argument(
    "[args...]",
    localized(
      "subcommand and arguments (list|search|context|extract|projects|help)",
      "子命令和参数（list|search|context|extract|projects|help）",
    ),
  )
  .action((args: string[] = []) => {
    try {
      runMem(args);
    } catch (error) {
      console.error(
        chalk.red(localized("Error:", "错误：")),
        error instanceof Error ? error.message : error,
      );
      if (process.env.DEBUG || process.env.DEVFLOW_DEBUG) {
        console.error(error instanceof Error ? error.stack : error);
      }
      process.exit(1);
    }
  });

program
  .command("workflow")
  .description(
    localized(
      "List or switch the project's .devflow/workflow.md template (native, tdd, channel-driven-subagent-dispatch, or marketplace)",
      "列出或切换项目的 .devflow/workflow.md 模板（native、tdd、channel-driven-subagent-dispatch 或 marketplace）",
    ),
  )
  .option(
    "-t, --template <id>",
    localized(
      "Workflow template id (e.g., native, tdd, channel-driven-subagent-dispatch)",
      "工作流模板 id（例如 native、tdd、channel-driven-subagent-dispatch）",
    ),
  )
  .option(
    "-m, --marketplace <source>",
    localized(
      "Custom marketplace source (e.g., gh:myorg/myrepo/marketplace)",
      "自定义 marketplace 来源（例如 gh:myorg/myrepo/marketplace）",
    ),
  )
  .option(
    "--list",
    localized(
      "List available workflow templates and exit",
      "列出可用工作流模板并退出",
    ),
  )
  .option(
    "-f, --force",
    localized(
      "Overwrite a modified workflow.md without asking",
      "不询问，覆盖已修改的 workflow.md",
    ),
  )
  .option(
    "-n, --create-new",
    localized(
      "Write .devflow/workflow.md.new instead of replacing the active workflow",
      "写入 .devflow/workflow.md.new，而不是替换当前工作流",
    ),
  )
  .action(async (options: Record<string, unknown>) => {
    try {
      await runWorkflowCommand({
        template: options.template as string | undefined,
        marketplace: options.marketplace as string | undefined,
        list: options.list as boolean | undefined,
        force: options.force as boolean | undefined,
        createNew: options.createNew as boolean | undefined,
      });
    } catch (error) {
      if (error instanceof WorkflowCommandError) {
        console.error(chalk.red(localized("Error:", "错误：")), error.message);
        process.exit(1);
      }
      console.error(
        chalk.red(localized("Error:", "错误：")),
        error instanceof Error ? error.message : error,
      );
      if (process.env.DEBUG || process.env.DEVFLOW_DEBUG) {
        console.error(error instanceof Error ? error.stack : error);
      }
      process.exit(1);
    }
  });

registerKnowledgeCommand(program);
registerChannelCommand(program);
applyCommanderLocalization(program);

program.parse();
