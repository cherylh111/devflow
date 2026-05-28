# 添加项目本地约定

很多时候用户不需要更改 DevFlow 机制；他们需要本地 AI 理解团队约定。这种情况下，优先使用 `.devflow/spec/` 或项目本地 skill，而不是编辑 `devflow-meta`。

## 内容放在哪里

| 内容类型 | 位置 |
| --- | --- |
| 代码必须遵循的规则 | `.devflow/spec/<layer>/` |
| 跨层思考方法 | `.devflow/spec/guides/` |
| 项目特定流程的 AI 能力 | 平台本地 skill |
| 一次性任务材料 | `.devflow/tasks/<task>/` |
| 会话摘要 | `.devflow/workspace/<developer>/journal-N.md` |

## 创建项目本地 Skill

如果用户希望 AI 知道“此项目如何定制 DevFlow”，创建本地 skill：

```text
.claude/skills/devflow-local/
└── SKILL.md
```

示例：

```md
---
name: devflow-local
description: "Project-local DevFlow customizations for this repository. Use when changing this project's DevFlow workflow, hooks, local agents, or team-specific conventions."
---

# DevFlow Local

## Local Scope

This skill documents this repository's DevFlow customizations only.

## Custom Workflow Rules

- ...

## Local Hook Changes

- ...

## Local Agent Changes

- ...
```

对于多平台项目，在其他平台 skill 目录放置等价版本，或在支持共享层的平台上使用 `.agents/skills/`。

## 写入 `.devflow/spec/`

如果内容是编码约定，把它写入 spec。示例：

```text
.devflow/spec/backend/error-handling.md
.devflow/spec/frontend/components.md
.devflow/spec/guides/cross-platform-thinking-guide.md
```

写入后，更新对应的 `index.md`，使 AI 能从入口点找到新规则。

## 让当前任务使用新约定

写入 spec 后，将其添加到当前任务上下文：

```bash
python3 ./.devflow/scripts/task.py add-context <task> implement ".devflow/spec/backend/error-handling.md" "Error handling conventions"
python3 ./.devflow/scripts/task.py add-context <task> check ".devflow/spec/backend/error-handling.md" "Review error handling"
```

## 不要在 `devflow-meta` 中存储项目私有规则

`devflow-meta` 是用于理解 DevFlow 架构和本地定制入口的公开 skill。请将项目私有内容放在：

- `.devflow/spec/`
- 项目本地 skill
- 当前任务
- 工作区日志

这可以防止未来 DevFlow 内置 `devflow-meta` 更新覆盖团队自己的约定。
