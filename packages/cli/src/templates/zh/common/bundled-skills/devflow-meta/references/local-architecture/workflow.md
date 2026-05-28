# 本地工作流系统

`.devflow/workflow.md` 是用户项目内 DevFlow 工作流的事实来源。AI 不需要 DevFlow 源码也能理解当前项目应如何推进任务；这个文件就足够。

## 文件职责

`.devflow/workflow.md` 有三项职责：

1. **解释工作流阶段**：Plan、Execute、Finish。
2. **定义技能路由**：用户表达某类意图时，AI 应使用哪个技能或代理。
3. **提供 workflow-state 提示块**：hooks 可以将当前状态对应的提示块注入对话。

## 当前阶段模型

```text
Phase 1: Plan    -> clarify what to build, produce prd.md and required research
Phase 2: Execute -> implement against the PRD and specs, then check
Phase 3: Finish  -> final verification, preserve lessons, and wrap up
```

每个阶段包含编号步骤，例如 `1.3 Configure context`。这些编号不是 `task.json` 中的运行时字段，而是供 AI 和人阅读的工作流结构。

## 技能路由

`workflow.md` 按平台能力区分路由：

- 支持子代理的平台：默认派发 `devflow-implement` 执行实现，派发 `devflow-check` 执行检查。
- 不支持子代理的平台：主会话读取 `devflow-before-dev` 等技能，然后直接执行。

更改本地 AI 行为时，先更新 `workflow.md` 中的路由说明，再检查对应平台的技能、命令或代理文件是否也需要同步。

## Workflow-State 提示块

`workflow.md` 底部可以包含如下状态块：

```text
[workflow-state:no_task]
...
[/workflow-state:no_task]
```

Hooks 会根据当前任务状态选择正确块并注入对话。常见状态包括：

| 状态 | 含义 |
| --- | --- |
| `no_task` | 当前会话没有活动任务。 |
| `planning` | 任务仍处于需求、研究或上下文配置阶段。 |
| `in_progress` | 任务已进入实现和检查阶段。 |
| `completed` | 任务已完成，等待收尾或归档。 |

如果用户想更改“无任务时是否创建任务”“何时可跳过任务创建”或“是否要求子代理”等策略，请编辑这些状态块及其上方的路由表。

## 本地修改模式

常见更改：

| 目标 | 编辑点 |
| --- | --- |
| 添加阶段 | 更新 Phase Index、阶段正文、路由和状态块。 |
| 更改任务创建策略 | 更新 `no_task` 状态块和 Phase 1 说明。 |
| 更改默认实现/检查路径 | 更新 Phase 2 和技能路由。 |
| 更改收尾流程 | 更新 Phase 3 和 `finish-work` 相关说明。注意当前拆分：Phase 3.4 = AI 驱动的代码提交（分批、用户确认），Phase 3.5 = `/finish-work`（归档 + 记录会话）。工作树脏时 `/finish-work` 会拒绝运行。 |
| 更改平台差异 | 更新按平台分组的路由说明。 |

编辑后，让 AI 重新阅读 `.devflow/workflow.md`；不要假设旧对话中的流程仍然有效。

## 与平台文件的关系

`workflow.md` 是本地工作流的语义中心，但每个平台也可能有自己的入口文件：

- 技能，例如 `devflow-brainstorm` 和 `devflow-check`。
- 命令、提示或工作流，例如 continue 和 finish-work。
- hooks，例如 session-start 或 workflow-state 注入。

如果只修改 `workflow.md`，平台入口文件可能仍保留旧说法。当用户想改变“AI 实际做什么”时，也要检查相关平台目录。
