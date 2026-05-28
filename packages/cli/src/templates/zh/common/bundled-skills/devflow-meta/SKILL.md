---
name: devflow-meta
description: "理解并定制用户项目内的本地 DevFlow 架构。修改 devflow init 生成的 .devflow 以及平台 hooks、settings、agents、skills、commands、prompts 或 workflows 时使用。"
---

# DevFlow Meta

此技能面向已经在项目中运行 `devflow init` 的本地 DevFlow 用户。阅读后，AI 应理解该用户项目内的 DevFlow 架构、运行模型和定制入口点，然后按用户请求修改生成的 `.devflow/` 和平台目录文件。

默认操作范围是用户项目中的本地文件：

- `.devflow/`：workflow、config、tasks、spec、workspace、scripts 和 runtime state。
- 平台目录：`.claude/`、`.codex/`、`.cursor/`、`.opencode/`、`.kiro/`、`.gemini/`、`.qoder/`、`.codebuddy/`、`.github/`、`.factory/`、`.pi/`、`.kilocode/`、`.agent/`、`.windsurf/` 以及类似目录。
- 共享 skill 层：`.agents/skills/`。

不要假设用户拥有 DevFlow 源码仓库。不要默认修改全局 npm 安装目录或 `node_modules`。

## 如何使用

1. 先阅读 `references/local-architecture/overview.md`，建立本地 DevFlow 系统模型。
2. 如果请求涉及特定 AI 工具，阅读 `references/platform-files/platform-map.md` 和相关平台文件说明。
3. 如果用户想更改行为，阅读 `references/customize-local/overview.md`，再打开具体定制主题。
4. 编辑前，读取用户项目中的实际文件，并以本地内容为准。

## 参考

### 本地架构

- `references/local-architecture/overview.md`：三层本地 DevFlow 架构和定制原则。
- `references/local-architecture/generated-files.md`：`devflow init` 生成的文件及其定制边界。
- `references/local-architecture/workflow.md`：`.devflow/workflow.md` 中的阶段、路由和 workflow-state 块。
- `references/local-architecture/task-system.md`：任务目录、活动任务、JSONL 上下文和任务运行时。
- `references/local-architecture/spec-system.md`：`.devflow/spec/` 如何组织和注入。
- `references/local-architecture/workspace-memory.md`：`.devflow/workspace/`、日志和跨会话记忆。
- `references/local-architecture/context-injection.md`：Hooks、子代理 preludes 和上下文注入路径。

### 平台文件

- `references/platform-files/overview.md`：共享 `.devflow/` 文件如何关联平台目录。
- `references/platform-files/platform-map.md`：skills、agents、hooks 和 extensions 的平台目录与路径。
- `references/platform-files/hooks-and-settings.md`：settings/config 文件、hooks、plugins 和 extensions 如何连接到 DevFlow。
- `references/platform-files/agents.md`：`devflow-research`、`devflow-implement` 和 `devflow-check` 的本地文件职责。
- `references/platform-files/skills-and-commands.md`：skills、commands、prompts 和 workflows 的差异，以及如何更改它们。

### 本地定制

- `references/customize-local/overview.md`：为用户请求选择正确的本地定制入口点。
- `references/customize-local/change-workflow.md`：更改阶段、路由、下一步动作和 workflow-state。
- `references/customize-local/change-task-lifecycle.md`：更改任务创建、状态、归档行为和 hooks。
- `references/customize-local/change-context-loading.md`：更改任务、specs、journals 和 hook 上下文如何加载。
- `references/customize-local/change-hooks.md`：更改平台 hooks、settings 和 shell 会话桥接。
- `references/customize-local/change-agents.md`：更改 research、implement 和 check agent 行为。
- `references/customize-local/change-skills-or-commands.md`：添加或修改本地 skills、commands、prompts 和 workflows。
- `references/customize-local/change-spec-structure.md`：调整 `.devflow/spec/` 下的项目规范结构。
- `references/customize-local/add-project-local-conventions.md`：将团队规则放入项目本地 specs 或本地 skills。

## 当前规则

- `.devflow/workflow.md` 是本地工作流事实来源。
- `.devflow/config.yaml` 是项目级 DevFlow 配置和任务 hook 配置入口点。
- `.devflow/spec/` 存储用户项目特定编码约定和设计约束。
- `.devflow/tasks/` 存储任务 PRD、技术说明、研究文件和 JSONL 上下文。
- `.devflow/workspace/` 存储开发者日志和跨会话记忆。
- 平台 settings/config 文件决定哪些 hooks、agents、skills、commands、prompts 和 workflows 实际运行。
- `.devflow/.template-hashes.json` 和 `.devflow/.runtime/` 是管理/运行时状态文件。编辑前确认必要性。

## 不要

- 不要把 DevFlow 上游源码当作本地定制的默认目标。
- 不要通过修改全局 npm 安装目录或 `node_modules/@enpd/devflow` 来实现项目需求。
- 不要用默认模板覆盖用户已修改的本地文件。
- 不要把团队私有项目规则放入公开的 `devflow-meta`；项目规则应放在 `.devflow/spec/` 或项目本地 skill 中。
- 不要把已移除的历史机制描述为当前 DevFlow 行为。
