import { spawnSync } from "node:child_process";
import chalk from "chalk";
import { PACKAGE_NAME, VERSION } from "../constants/version.js";
import { localized } from "../utils/language-config.js";

export interface UpgradeOptions {
  tag?: string;
  dryRun?: boolean;
}

interface SpawnResult {
  status: number | null;
  signal: NodeJS.Signals | null;
  error?: Error;
}

interface SpawnOptions {
  stdio: "inherit";
  shell: false;
}

type SpawnRunner = (
  command: string,
  args: string[],
  options: SpawnOptions,
) => SpawnResult;

export interface UpgradeCommandPlan {
  command: string;
  args: string[];
  spawnOptions: SpawnOptions;
  displayCommand: string;
  target: string;
  tag: string;
  binaryCheckCommand: string;
}

const NPM_TAG_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function resolveUpgradeTag(
  currentVersion: string = VERSION,
  requestedTag?: string,
): string {
  if (requestedTag) {
    if (!NPM_TAG_RE.test(requestedTag)) {
      throw new Error(
        localized(
          `Invalid npm tag/version "${requestedTag}". Use a simple dist-tag or version such as latest, beta, rc, or 0.6.0-beta.8.`,
          `无效的 npm tag/version "${requestedTag}"。请使用简单的 dist-tag 或版本号，例如 latest、beta、rc 或 0.6.0-beta.8。`,
        ),
      );
    }
    return requestedTag;
  }

  if (currentVersion.includes("-beta")) return "beta";
  if (currentVersion.includes("-rc")) return "rc";
  return "latest";
}

function binaryCheckCommand(
  platform: NodeJS.Platform = process.platform,
): string {
  return platform === "win32" ? "where devflow" : "which devflow";
}

export function buildUpgradeCommand(
  options: UpgradeOptions = {},
  currentVersion: string = VERSION,
  platform: NodeJS.Platform = process.platform,
): UpgradeCommandPlan {
  const tag = resolveUpgradeTag(currentVersion, options.tag);
  const target = `${PACKAGE_NAME}@${tag}`;
  const npmArgs = ["install", "-g", target];
  const displayCommand = `npm ${npmArgs.join(" ")}`;
  const spawnOptions: SpawnOptions = { stdio: "inherit", shell: false };

  if (platform === "win32") {
    return {
      command: "cmd.exe",
      args: ["/d", "/s", "/c", displayCommand],
      spawnOptions,
      displayCommand,
      target,
      tag,
      binaryCheckCommand: binaryCheckCommand(platform),
    };
  }

  return {
    command: "npm",
    args: npmArgs,
    spawnOptions,
    displayCommand,
    target,
    tag,
    binaryCheckCommand: binaryCheckCommand(platform),
  };
}

function troubleshooting(plan: UpgradeCommandPlan): string {
  return [
    "",
    localized("Troubleshooting:", "排查建议："),
    localized(
      `- Manual command: ${plan.displayCommand}`,
      `- 手动执行命令：${plan.displayCommand}`,
    ),
    localized(
      "- Check npm global prefix and PATH: npm config get prefix",
      "- 检查 npm 全局 prefix 和 PATH：npm config get prefix",
    ),
    localized(
      `- Check which DevFlow binary your shell resolves: ${plan.binaryCheckCommand}`,
      `- 检查当前 shell 解析到的 DevFlow 可执行文件：${plan.binaryCheckCommand}`,
    ),
    localized(
      "- If this is a permissions error, fix your Node/npm install or npm prefix; DevFlow does not run sudo.",
      "- 如果是权限错误，请修复 Node/npm 安装或 npm prefix；DevFlow 不会运行 sudo。",
    ),
    localized(
      "- If npm reports an existing binary or locked file, resolve that npm error manually; DevFlow does not run --force.",
      "- 如果 npm 报告已有可执行文件或文件被锁定，请手动处理该 npm 错误；DevFlow 不会运行 --force。",
    ),
  ].join("\n");
}

export async function upgrade(
  options: UpgradeOptions = {},
  runner: SpawnRunner = spawnSync,
): Promise<void> {
  const plan = buildUpgradeCommand(options);

  console.log(
    chalk.cyan(
      localized(
        `Upgrading DevFlow CLI to ${plan.target}`,
        `正在将 DevFlow CLI 升级到 ${plan.target}`,
      ),
    ),
  );
  console.log(chalk.gray(localized(`Run: ${plan.displayCommand}`, `运行：${plan.displayCommand}`)));

  if (options.dryRun) {
    console.log(chalk.gray(localized("Dry run: no changes made.", "预览模式：未做任何修改。")));
    return;
  }

  const result = runner(plan.command, plan.args, plan.spawnOptions);
  if (result.error) {
    throw new Error(
      localized(
        `Failed to run npm. Install npm or run manually: ${plan.displayCommand}${troubleshooting(plan)}`,
        `运行 npm 失败。请安装 npm，或手动运行：${plan.displayCommand}${troubleshooting(plan)}`,
      ),
    );
  }
  if (result.signal) {
    throw new Error(
      localized(
        `npm install was interrupted by ${result.signal}.${troubleshooting(plan)}`,
        `npm install 被 ${result.signal} 中断。${troubleshooting(plan)}`,
      ),
    );
  }
  if (result.status === null) {
    throw new Error(
      localized(
        `npm install failed without an exit status.${troubleshooting(plan)}`,
        `npm install 失败且没有退出状态。${troubleshooting(plan)}`,
      ),
    );
  }
  if (result.status !== 0) {
    throw new Error(
      localized(
        `npm install failed with exit code ${result.status}.${troubleshooting(plan)}`,
        `npm install 失败，退出码 ${result.status}。${troubleshooting(plan)}`,
      ),
    );
  }

  console.log(chalk.green(localized("\n✓ DevFlow CLI upgrade completed", "\n✓ DevFlow CLI 升级完成")));
  console.log(chalk.gray(localized("Run: devflow --version", "运行：devflow --version")));
  console.log(chalk.gray(localized(`Run: ${plan.binaryCheckCommand}`, `运行：${plan.binaryCheckCommand}`)));
}
