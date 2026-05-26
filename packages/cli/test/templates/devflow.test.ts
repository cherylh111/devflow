import { describe, expect, it } from "vitest";
import {
  scriptsInit,
  commonInit,
  commonPaths,
  commonDeveloper,
  commonGitContext,
  commonTaskQueue,
  commonTaskUtils,
  commonActiveTask,
  commonCliAdapter,
  getDeveloperScript,
  initDeveloperScript,
  taskScript,
  getContextScript,
  addSessionScript,
  workflowMdTemplate,
  gitignoreTemplate,
  getAllScripts,
} from "../../src/templates/devflow/index.js";
import { guidesLearningsContent } from "../../src/templates/markdown/index.js";

// =============================================================================
// Template Constants — module-level string exports
// =============================================================================

describe("devflow template constants", () => {
  const allTemplates = {
    scriptsInit,
    commonInit,
    commonPaths,
    commonDeveloper,
    commonGitContext,
    commonTaskQueue,
    commonTaskUtils,
    commonActiveTask,
    commonCliAdapter,
    getDeveloperScript,
    initDeveloperScript,
    taskScript,
    getContextScript,
    addSessionScript,
    workflowMdTemplate,
    gitignoreTemplate,
  };

  function inProgressBreadcrumb(): string {
    const inProgressMatch = /\[workflow-state:in_progress\]([\s\S]*?)\[\/workflow-state:in_progress\]/.exec(
      workflowMdTemplate,
    );
    if (!inProgressMatch) {
      throw new Error("in_progress breadcrumb block must exist in workflow.md");
    }
    return inProgressMatch[1];
  }

  it("all templates are non-empty strings", () => {
    for (const [name, content] of Object.entries(allTemplates)) {
      expect(content.length, `${name} should be non-empty`).toBeGreaterThan(0);
    }
  });

  it("Python scripts contain valid Python syntax indicators", () => {
    // scriptsInit (__init__.py) only has docstrings, so use scripts with actual code
    const pyScripts = [
      commonInit,
      commonPaths,
      commonActiveTask,
      getDeveloperScript,
      taskScript,
    ];
    for (const script of pyScripts) {
      expect(
        script.includes("import") ||
          script.includes("def ") ||
          script.includes("class ") ||
          script.includes("#"),
      ).toBe(true);
    }
  });

  it("scriptsInit is a Python docstring module", () => {
    expect(scriptsInit).toContain('"""');
  });

  it("workflowMdTemplate is markdown", () => {
    expect(workflowMdTemplate).toContain("#");
  });

  it("[issue-225] workflow.md in_progress breadcrumb has class-2 sub-agent dispatch protocol", () => {
    // The in_progress breadcrumb instructs the main agent to prefix
    // dispatch prompts with "Active task: <path>" on class-2 platforms.
    // Without this line, codex/copilot/gemini/qoder sub-agents cannot
    // find the active task (no PreToolUse hook to inject context).
    const block = inProgressBreadcrumb();
    expect(block).toContain("Active task:");
    expect(block.toLowerCase()).toContain("class-2");
    expect(block).toMatch(/codex|copilot|gemini|qoder/);
  });

  it("[issue-237] workflow.md in_progress breadcrumb self-exempts implement/check sub-agents", () => {
    // The in_progress breadcrumb may be injected into sub-agent turns on some
    // hosts, so its main-session dispatch guidance must not recursively apply
    // to a sub-agent that is already doing the requested work.
    const block = inProgressBreadcrumb();
    expect(block).toContain("Main-session default");
    expect(block).toContain("Sub-agent self-exemption");
    expect(block).toContain("already running as `devflow-implement`");
    expect(block).toContain("do NOT spawn another `devflow-implement`");
    expect(block).toContain("already running as `devflow-check`");
    expect(block).toContain("do NOT spawn another `devflow-check`");
    expect(block).toContain("main session only");
  });

  it("[issue-237] workflow.md Phase 2 dispatch steps require prompt recursion guards", () => {
    expect(workflowMdTemplate).toContain("**Dispatch prompt guard**");
    expect(workflowMdTemplate).toContain(
      "already the `devflow-implement` sub-agent",
    );
    expect(workflowMdTemplate).toContain(
      "not spawn another `devflow-implement` / `devflow-check`",
    );
    expect(workflowMdTemplate).toContain(
      "already the `devflow-check` sub-agent",
    );
    expect(workflowMdTemplate).toContain(
      "not spawn another `devflow-check` / `devflow-implement`",
    );
  });

  it("gitignoreTemplate contains ignore patterns", () => {
    expect(gitignoreTemplate).toContain(".developer");
    expect(gitignoreTemplate).toContain("__pycache__");
  });

  it("workflow.md describes the knowledge update path", () => {
    expect(workflowMdTemplate).toContain("#### 3.3 Knowledge update");
    expect(workflowMdTemplate).toContain("devflow knowledge learn");
    expect(workflowMdTemplate).toContain("devflow spec add --layer <layer>");
    expect(workflowMdTemplate).toContain("devflow knowhow add --type <type>");
    expect(workflowMdTemplate).toContain("devflow wiki create/update/append/remove-entry/delete");
    expect(workflowMdTemplate).toContain("devflow wiki connect --dry-run --report");
    expect(workflowMdTemplate).toContain("devflow wiki connect --fix --report");
    expect(workflowMdTemplate).toContain("devflow wiki cleanup --fix --report");
    expect(workflowMdTemplate).toContain("devflow wiki digest <topic> --report");
    expect(workflowMdTemplate).toContain("devflow wiki digest <topic> --create-issues --report");
    expect(workflowMdTemplate).toContain("devflow-learn");
  });

  it("workflow.md describes the auto-run fast path", () => {
    expect(workflowMdTemplate).toContain("### Auto Runner");
    expect(workflowMdTemplate).toContain("/devflow:auto-run");
    expect(workflowMdTemplate).toContain("without manual `/devflow:continue`");
    expect(workflowMdTemplate).toContain("Phase 3.4 commit plan is rejected");
  });

  it("guides include a project learnings scaffold", () => {
    expect(guidesLearningsContent).toContain("# Project Learnings");
    expect(guidesLearningsContent).toContain("&lt;spec-entry&gt;");
    expect(guidesLearningsContent).toContain("devflow knowledge learn");
  });
});

// =============================================================================
// getAllScripts — pure function assembling pre-loaded strings
// =============================================================================

describe("getAllScripts", () => {
  it("returns a Map", () => {
    const scripts = getAllScripts();
    expect(scripts).toBeInstanceOf(Map);
  });

  it("contains expected script entries", () => {
    const scripts = getAllScripts();
    expect(scripts.has("__init__.py")).toBe(true);
    expect(scripts.has("common/__init__.py")).toBe(true);
    expect(scripts.has("common/paths.py")).toBe(true);
    expect(scripts.has("common/active_task.py")).toBe(true);
    expect(scripts.has("task.py")).toBe(true);
    expect(scripts.has("get_developer.py")).toBe(true);
  });

  it("has at least one entry", () => {
    const scripts = getAllScripts();
    expect(scripts.size).toBeGreaterThan(0);
  });

  it("all values are non-empty strings", () => {
    const scripts = getAllScripts();
    for (const [key, value] of scripts) {
      expect(value.length, `${key} should be non-empty`).toBeGreaterThan(0);
    }
  });

  it("values match the exported constants", () => {
    const scripts = getAllScripts();
    expect(scripts.get("__init__.py")).toBe(scriptsInit);
    expect(scripts.get("common/__init__.py")).toBe(commonInit);
    expect(scripts.get("task.py")).toBe(taskScript);
  });

  it("does not contain multi_agent entries", () => {
    const scripts = getAllScripts();
    for (const [key] of scripts) {
      expect(key, `${key} should not be a multi_agent script`).not.toContain("multi_agent");
    }
  });
});
