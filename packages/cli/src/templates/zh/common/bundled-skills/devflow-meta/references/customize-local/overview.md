# 本地定制概览

此目录供本地 AI 在用户项目中使用；该项目已通过 npm 安装 DevFlow，并已运行 `devflow init`。AI 应修改项目内生成的 `.devflow/` 和平台目录，而不是 DevFlow CLI 上游源码。

## 先确定用户真正想改什么

| 用户说法 | 先阅读 |
| --- | --- |
| “更改 DevFlow 流程 / 阶段 / 下一个提示” | `change-workflow.md` |
| “更改任务创建、状态、归档或 hooks” | `change-task-lifecycle.md` |
| “AI 没有读取上下文 / 更改注入内容” | `change-context-loading.md` |
| “平台 hook 行为不符合预期” | `change-hooks.md` |
| “更改 implement/check/research agent 行为” | `change-agents.md` |
| “添加 skill/command/workflow/prompt” | `change-skills-or-commands.md` |
| “调整项目规范结构” | `change-spec-structure.md` |
| “添加团队约定和本地说明” | `add-project-local-conventions.md` |

## 通用操作顺序

1. **确认平台和目录**：检查存在哪些目录，例如 `.claude/`、`.codex/`、`.cursor/`。
2. **确认当前活动任务**：运行 `python3 ./.devflow/scripts/task.py current --source`。
3. **读取本地事实来源**：优先读取 `.devflow/workflow.md`、`.devflow/config.yaml` 和相关平台文件。
4. **窄范围修改**：只编辑与用户请求相关的文件。
5. **同步语义**：如果共享流程改变，检查平台入口点是否也需要更改；如果平台入口改变，检查 `.devflow/workflow.md` 是否仍一致。

## 本地文件优先级

| 层级 | 文件 |
| --- | --- |
| 工作流 | `.devflow/workflow.md` |
| 项目配置 | `.devflow/config.yaml` |
| 任务材料 | `.devflow/tasks/<task>/` |
| 项目规范 | `.devflow/spec/` |
| 运行时脚本 | `.devflow/scripts/` |
| 平台集成 | `.claude/`、`.codex/`、`.cursor/`、`.opencode/` 以及类似目录 |
| 共享 skill | `.agents/skills/` |

## 默认不要做的事

- 不要编辑全局 npm 安装目录。
- 不要编辑 `node_modules/@enpd/devflow`。
- 不要假设用户拥有 DevFlow GitHub 仓库。
- 不要用默认模板覆盖已被用户本地修改的文件。
- 不要把团队项目规则放进公开的 `devflow-meta`；项目规则属于 `.devflow/spec/` 或本地 skill。

## 何时检查上游源码

只有当用户明确表达以下目标之一时，才切换到上游源码视角：

- “我想给 DevFlow 提 PR”
- “我想更改 npm 包发布内容”
- “我想 fork DevFlow”
- “我想修改 `devflow init/update` 的生成逻辑”

否则，默认修改用户项目内的本地 DevFlow 文件。
