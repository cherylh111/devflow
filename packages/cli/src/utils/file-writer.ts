import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import inquirer from "inquirer";

import { localized } from "./language-config.js";
import { toPosix } from "./posix.js";

export type WriteMode = "ask" | "force" | "skip" | "append";

export interface WriteOptions {
  mode: WriteMode;
}

interface PromptAnswer {
  action: string;
}

// Global write mode (set from CLI options)
let globalWriteMode: WriteMode = "ask";

export function setWriteMode(mode: WriteMode): void {
  globalWriteMode = mode;
}

export function getWriteMode(): WriteMode {
  return globalWriteMode;
}

// ---------------------------------------------------------------------------
// Write recording
//
// `devflow init` uses recording to capture exactly which files were actually
// written this run (vs skipped because they already existed). The captured
// set is what `.template-hashes.json` should contain — NOT a blind directory
// walk of `.codex/` / `.claude/` / etc, which would include user-owned files
// that pre-dated init. See `pruneOrphanManifestKeys` for the self-heal side
// of the same contract.
// ---------------------------------------------------------------------------

/** When recording is active, every actual `writeFile` disk write appends here. */
let writeRecorder: Set<string> | null = null;
/** Project root used to convert absolute write paths to POSIX-relative keys. */
let writeRecorderRoot: string | null = null;

/**
 * Begin recording every write into the returned Set. Calls accumulate into the
 * same set until `stopRecordingWrites` runs. POSIX relative paths (relative to
 * `cwd`) are stored, matching `.template-hashes.json` keys.
 *
 * Nested recording sessions are NOT supported — the caller must ensure
 * `stopRecordingWrites` runs before the next `startRecordingWrites`. Failure
 * is silent (the second `start` replaces the first set), so callers should
 * always pair start/stop in try/finally.
 */
export function startRecordingWrites(cwd: string): Set<string> {
  const sink = new Set<string>();
  writeRecorder = sink;
  writeRecorderRoot = cwd;
  return sink;
}

/** End recording. Subsequent writes are not captured until `start` is called again. */
export function stopRecordingWrites(): void {
  writeRecorder = null;
  writeRecorderRoot = null;
}

/** Record a successful write. Called internally by `writeFile`. */
function recordWrite(absPath: string): void {
  if (!writeRecorder || !writeRecorderRoot) return;
  const rel = path.relative(writeRecorderRoot, absPath);
  // Defensive: skip writes outside cwd (no meaningful manifest key).
  if (rel.startsWith("..") || path.isAbsolute(rel)) return;
  writeRecorder.add(toPosix(rel));
}

/**
 * Get relative path from cwd for display
 */
function getRelativePath(filePath: string): string {
  const cwd = process.cwd();
  const relativePath = path.relative(cwd, filePath);
  return relativePath || path.basename(filePath);
}

/**
 * Append content to file
 */
function appendToFile(
  filePath: string,
  content: string,
  options?: { executable?: boolean },
): void {
  const existingContent = fs.readFileSync(filePath, "utf-8");
  const newContent = existingContent.endsWith("\n")
    ? existingContent + content
    : existingContent + "\n" + content;
  fs.writeFileSync(filePath, newContent);
  if (options?.executable) {
    fs.chmodSync(filePath, "755");
  }
}

/**
 * Write file with conflict handling
 * - If file doesn't exist: write directly
 * - If file exists and content is identical: skip silently
 * - If file exists and mode is 'force': overwrite
 * - If file exists and mode is 'skip': skip
 * - If file exists and mode is 'append': append to end
 * - If file exists and mode is 'ask': prompt user
 */
export async function writeFile(
  filePath: string,
  content: string,
  options?: { executable?: boolean },
): Promise<boolean> {
  const exists = fs.existsSync(filePath);
  const displayPath = getRelativePath(filePath);

  if (!exists) {
    // File doesn't exist, write directly
    fs.writeFileSync(filePath, content);
    if (options?.executable) {
      fs.chmodSync(filePath, "755");
    }
    recordWrite(filePath);
    return true;
  }

  // File exists, check if content is identical
  const existingContent = fs.readFileSync(filePath, "utf-8");
  if (existingContent === content) {
    // Content identical, but no disk write happened. Do not record it for
    // init-time manifests: pre-existing user files can legitimately be
    // byte-identical to a DevFlow template and still not be DevFlow-owned.
    return false;
  }

  // File exists with different content, handle based on mode.
  // Non-TTY (CI, pipes, scripted runs): never prompt — fall back to skip
  // rather than crash with ERR_USE_AFTER_CLOSE if a CLI flag forgot to call
  // setWriteMode. Layer-level safety net for the init.ts mapping.
  const mode =
    globalWriteMode === "ask" && !process.stdin.isTTY
      ? "skip"
      : globalWriteMode;

  if (mode === "force") {
    fs.writeFileSync(filePath, content);
    if (options?.executable) {
      fs.chmodSync(filePath, "755");
    }
    console.log(
      chalk.yellow(
        localized(
          `  ↻ Overwritten: ${displayPath}`,
          `  ↻ 已覆盖：${displayPath}`,
        ),
      ),
    );
    recordWrite(filePath);
    return true;
  }

  if (mode === "skip") {
    console.log(
      chalk.gray(
        localized(
          `  ○ Skipped: ${displayPath} (already exists)`,
          `  ○ 已跳过：${displayPath}（已存在）`,
        ),
      ),
    );
    // Skipped: devflow did NOT write this file — caller should not track it
    // in the manifest. This is the AGENTS.md skip-existing case.
    return false;
  }

  if (mode === "append") {
    appendToFile(filePath, content, options);
    console.log(
      chalk.blue(
        localized(`  + Appended: ${displayPath}`, `  + 已追加：${displayPath}`),
      ),
    );
    // Append: devflow added devflow content to a user-owned file. Tracking
    // is risky here (uninstall would unlink the whole file), so we do NOT
    // record appended files. Users on `--append` get a fresh manifest miss
    // on next update; that's the safer default.
    return true;
  }

  // mode === 'ask': Interactive prompt
  const { action } = await inquirer.prompt<PromptAnswer>([
    {
      type: "list",
      name: "action",
      message: localized(
        `File "${displayPath}" already exists. What would you like to do?`,
        `文件 "${displayPath}" 已存在。要怎么处理？`,
      ),
      choices: [
        {
          name: localized("Skip (keep existing)", "跳过（保留现有文件）"),
          value: "skip",
        },
        { name: localized("Overwrite", "覆盖"), value: "overwrite" },
        { name: localized("Append to end", "追加到末尾"), value: "append" },
        {
          name: localized(
            "Skip all remaining conflicts",
            "跳过后续所有冲突",
          ),
          value: "skip-all",
        },
        {
          name: localized(
            "Overwrite all remaining conflicts",
            "覆盖后续所有冲突",
          ),
          value: "overwrite-all",
        },
        {
          name: localized(
            "Append all remaining conflicts",
            "追加后续所有冲突",
          ),
          value: "append-all",
        },
      ],
    },
  ]);

  if (action === "skip") {
    console.log(
      chalk.gray(
        localized(`  ○ Skipped: ${displayPath}`, `  ○ 已跳过：${displayPath}`),
      ),
    );
    return false;
  }

  if (action === "overwrite") {
    fs.writeFileSync(filePath, content);
    if (options?.executable) {
      fs.chmodSync(filePath, "755");
    }
    console.log(
      chalk.yellow(
        localized(
          `  ↻ Overwritten: ${displayPath}`,
          `  ↻ 已覆盖：${displayPath}`,
        ),
      ),
    );
    recordWrite(filePath);
    return true;
  }

  if (action === "append") {
    appendToFile(filePath, content, options);
    console.log(
      chalk.blue(
        localized(`  + Appended: ${displayPath}`, `  + 已追加：${displayPath}`),
      ),
    );
    return true;
  }

  if (action === "skip-all") {
    globalWriteMode = "skip";
    console.log(
      chalk.gray(
        localized(`  ○ Skipped: ${displayPath}`, `  ○ 已跳过：${displayPath}`),
      ),
    );
    return false;
  }

  if (action === "overwrite-all") {
    globalWriteMode = "force";
    fs.writeFileSync(filePath, content);
    if (options?.executable) {
      fs.chmodSync(filePath, "755");
    }
    console.log(
      chalk.yellow(
        localized(
          `  ↻ Overwritten: ${displayPath}`,
          `  ↻ 已覆盖：${displayPath}`,
        ),
      ),
    );
    recordWrite(filePath);
    return true;
  }

  if (action === "append-all") {
    globalWriteMode = "append";
    appendToFile(filePath, content, options);
    console.log(
      chalk.blue(
        localized(`  + Appended: ${displayPath}`, `  + 已追加：${displayPath}`),
      ),
    );
    return true;
  }

  return false;
}

/**
 * Ensure directory exists
 */
export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}
