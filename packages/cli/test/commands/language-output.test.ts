import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { update } from "../../src/commands/update.js";
import { setTemplateLanguage } from "../../src/templates/language.js";

describe("localized command output", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "devflow-lang-output-"));
    vi.spyOn(process, "cwd").mockReturnValue(tmpDir);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setTemplateLanguage("en");
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("prints update errors in Chinese when --lang zh is selected", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await update({ lang: "zh" });

    const output = log.mock.calls.flat().join("\n");
    expect(output).toContain("错误：当前目录尚未初始化 DevFlow。");
    expect(output).toContain("请先运行 'devflow init'。");
  });
});
