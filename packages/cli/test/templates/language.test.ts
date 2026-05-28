import { afterEach, describe, expect, it } from "vitest";
import {
  getTemplateLanguage,
  setTemplateLanguage,
} from "../../src/templates/language.js";
import {
  getWorkflowMdTemplate,
  workflowMdTemplate,
} from "../../src/templates/devflow/index.js";
import { getAgentsMdContent } from "../../src/templates/markdown/index.js";
import { getAllAgents as getCodexAgents } from "../../src/templates/codex/index.js";
import { getAllAgents as getKiroAgents } from "../../src/templates/kiro/index.js";
import { getSkillTemplates } from "../../src/templates/common/index.js";

describe("template language selection", () => {
  afterEach(() => {
    setTemplateLanguage("en");
  });

  it("keeps English templates as the default", () => {
    expect(getTemplateLanguage()).toBe("en");
    expect(getWorkflowMdTemplate()).toBe(workflowMdTemplate);
    expect(getAgentsMdContent()).toContain("DevFlow Instructions");
    expect(getAgentsMdContent()).not.toContain("DevFlow 使用说明");
  });

  it("reads Chinese overlays when language is zh", () => {
    setTemplateLanguage("zh");

    expect(getWorkflowMdTemplate()).toContain("DevFlow 工作流");
    expect(getAgentsMdContent()).toContain("DevFlow 使用说明");
    expect(
      getSkillTemplates().find((skill) => skill.name === "before-dev")?.content,
    ).toContain("写代码前");
  });

  it("localizes platform agent prompts without replacing English defaults", () => {
    setTemplateLanguage("zh");

    const codexImplement = getCodexAgents().find(
      (agent) => agent.name === "devflow-implement",
    );
    expect(codexImplement?.content).toContain("实现 Agent");

    const kiroImplement = getKiroAgents().find(
      (agent) => agent.name === "devflow-implement",
    );
    expect(() => JSON.parse(kiroImplement?.content ?? "")).not.toThrow();
    expect(kiroImplement?.content).toContain("实现 Agent");

    setTemplateLanguage("en");
    expect(
      getCodexAgents().find((agent) => agent.name === "devflow-implement")
        ?.content,
    ).toContain("DevFlow implementer");
  });
});
