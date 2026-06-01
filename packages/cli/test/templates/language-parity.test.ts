import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const templatesRoot = join(testDir, "..", "..", "src", "templates");
const zhRoot = join(templatesRoot, "zh");

function walkFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files.sort();
}

function readText(path: string): string {
  return readFileSync(path, "utf-8");
}

function lines(text: string): string[] {
  return text.split(/\r?\n/);
}

function placeholders(text: string): string[] {
  return [
    ...new Set(
      text.match(/\{\{[^}]+\}\}|\$[A-Z_]+|<[^>\n ]+>/g) ?? [],
    ),
  ].sort();
}

function fenceCount(text: string): number {
  return lines(text).filter((line) => line.trim().startsWith("```")).length;
}

function headingShape(text: string): string[] {
  return lines(text)
    .filter((line) => line.trimStart().startsWith("#"))
    .map((line) => line.trimStart().match(/^#+/)?.[0] ?? "");
}

describe("Chinese template overlays", () => {
  it("preserve the original English template format", () => {
    const zhFiles = walkFiles(zhRoot);
    expect(zhFiles.length).toBeGreaterThan(0);

    for (const zhPath of zhFiles) {
      const relativePath = relative(zhRoot, zhPath);
      const englishPath = join(templatesRoot, relativePath);
      const english = readText(englishPath);
      const chinese = readText(zhPath);

      expect(chinese, relativePath).not.toHaveLength(0);
      expect(lines(chinese), relativePath).toHaveLength(lines(english).length);
      expect(fenceCount(chinese), relativePath).toBe(fenceCount(english));
      expect(placeholders(chinese), relativePath).toEqual(placeholders(english));
      expect(headingShape(chinese), relativePath).toEqual(headingShape(english));
    }
  });

  it("preserves runtime-parsed workflow heading anchors", () => {
    const workflow = readText(join(zhRoot, "devflow", "workflow.md"));
    const requiredHeadings = [
      "## Phase Index",
      "### Phase 1: Plan",
      "### Phase 2: Execute",
      "### Phase 3: Finish",
      "## Phase 1: Plan",
      "## Phase 2: Execute",
      "## Phase 3: Finish",
    ];

    for (const heading of requiredHeadings) {
      expect(workflow, heading).toMatch(
        new RegExp(`^${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "m"),
      );
    }
  });

  it("preserves workflow start-gate metadata guidance", () => {
    const workflow = readText(join(zhRoot, "devflow", "workflow.md"));
    expect(workflow).toContain("task.json.meta.complex");
    expect(workflow).toContain("task.json.meta.requires_subagent_context");
    expect(workflow).toContain("implement.jsonl");
    expect(workflow).toContain("check.jsonl");
    expect(workflow).toContain("devflow-before-dev");
    expect(workflow).toContain("--force");
  });
});
