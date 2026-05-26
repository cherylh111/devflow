import { describe, expect, it } from "vitest";
import fs from "node:fs";
import {
  getDevFlowTemplatePath,
  getClaudeTemplatePath,
  getDevFlowSourcePath,
  readDevFlowFile,
  readTemplate,
  readScript,
  readMarkdown,
} from "../../src/templates/extract.js";

describe("template path functions", () => {
  it("getDevFlowTemplatePath returns existing directory", () => {
    const p = getDevFlowTemplatePath();
    expect(fs.existsSync(p)).toBe(true);
    expect(fs.statSync(p).isDirectory()).toBe(true);
  });

  it("getClaudeTemplatePath returns existing directory", () => {
    const p = getClaudeTemplatePath();
    expect(fs.existsSync(p)).toBe(true);
    expect(fs.statSync(p).isDirectory()).toBe(true);
  });
});

describe("deprecated source path aliases", () => {
  it("getDevFlowSourcePath equals getDevFlowTemplatePath", () => {
    expect(getDevFlowSourcePath()).toBe(getDevFlowTemplatePath());
  });
});

describe("readDevFlowFile", () => {
  it("reads workflow.md from devflow templates", () => {
    const content = readDevFlowFile("workflow.md");
    expect(typeof content).toBe("string");
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain("#");
  });

  it("reads a script file", () => {
    const content = readDevFlowFile("scripts/task.py");
    expect(typeof content).toBe("string");
    expect(content.length).toBeGreaterThan(0);
  });

  it("throws for nonexistent file", () => {
    expect(() => readDevFlowFile("nonexistent.txt")).toThrow();
  });
});

describe("readTemplate", () => {
  it("throws for nonexistent category/file", () => {
    expect(() => readTemplate("scripts", "nonexistent.txt")).toThrow();
  });
});

describe("readScript", () => {
  it("reads a Python script from scripts/", () => {
    const content = readScript("task.py");
    expect(typeof content).toBe("string");
    expect(content.length).toBeGreaterThan(0);
  });
});

describe("readMarkdown", () => {
  it("reads workflow.md", () => {
    const content = readMarkdown("workflow.md");
    expect(typeof content).toBe("string");
    expect(content).toContain("#");
  });
});
