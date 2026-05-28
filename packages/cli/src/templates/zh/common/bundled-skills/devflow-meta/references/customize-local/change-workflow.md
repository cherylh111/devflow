# 更改本地工作流

当用户想更改 DevFlow 阶段、下一步提示、是否创建任务、是否使用子代理，或何时检查/收尾时，先编辑 `.devflow/workflow.md`。

## 先读取这些文件

1. `.devflow/workflow.md`
2. 当前平台的入口文件，例如 skills/commands/prompts/workflows
3. 当前任务的 `task.json` 和 `prd.md`

## 常见需求和编辑点

| 需求 | 编辑点 |
| --- | --- |
| 更改阶段名称或阶段顺序 | `Phase Index` 和对应 Phase 章节。 |
| 更改无任务时是否创建任务 | `[workflow-state:no_task]` 状态块。 |
| 更改 planning 期间的下一步 | Phase 1 和 `[workflow-state:planning]`。 |
| 更改 in_progress 期间是否需要 agent | Phase 2 和 `[workflow-state:in_progress]`。 |
| 更改完成后的收尾流程 | Phase 3 和 `[workflow-state:completed]`。 |
| 更改某个用户意图触发哪个 skill | `Skill Routing` 表。 |

## 修改步骤

1. 在 `.devflow/workflow.md` 中找到相关章节。
2. 更改规则时，保留明确的触发条件和下一步动作。
3. 如果添加或重命名 skill/agent，同步平台目录中的对应文件。
4. Workflow-state 变更只需要编辑 `.devflow/workflow.md` 中的 `[workflow-state:STATUS]` 块。hook 只负责解析，会读取你放入块中的任何内容。保持起止标签的 STATUS 字符串完全一致（`[workflow-state:foo]…[/workflow-state:foo]`）；STATUS 不匹配的标签对会被静默丢弃。
5. 让 AI 重新阅读 `.devflow/workflow.md`；不要继续使用旧对话中的规则。

## 示例：放宽任务创建要求

若要更改何时可以跳过任务创建，通常编辑 `[workflow-state:no_task]`：

```md
[workflow-state:no_task]
Task is not required when the answer is a one-reply explanation, no files are changed, and no research is needed.
[/workflow-state:no_task]
```

如果正式 Phase 1 流程也需要更改，同步 Phase 1 章节。

## 示例：某个平台不使用子代理

如果用户只希望某个平台避免使用子代理，先确认该平台在工作流中是否有单独分组。然后更改该平台分组的 Phase 2 路由，而不是跨平台删除所有 `devflow-implement` / `devflow-check` 说明。

## `/devflow:continue` 路由表

`/devflow:continue` 通过决定下一步加载哪个阶段步骤来恢复任务。该决策结合 `task.json.status` 和任务目录中的产物是否存在。映射固定在命令本身；添加自定义状态的 fork 必须同时扩展 workflow.md 标签块和此表。

| `status` | Artifact state | Resume at |
| --- | --- | --- |
| `planning` | `prd.md` missing | Phase 1.1 (load `devflow-brainstorm`) |
| `planning` | lightweight task with `prd.md` complete | ask for start review, then run `task.py start` |
| `planning` | complex task missing `design.md` or `implement.md` | complete missing planning artifacts |
| `planning` | complex task has `prd.md`, `design.md`, and `implement.md` | ask for start review, then run `task.py start` |
| `in_progress` | no implementation in conversation history | Phase 2.1 (`devflow-implement`) |
| `in_progress` | implementation done, no `devflow-check` run | Phase 2.2 (`devflow-check`) |
| `in_progress` | check passed | Phase 3.1 (verify quality + spec update) |
| `completed` | task is still in active tree | Phase 3.5 (run `/devflow:finish-work` to archive) |

添加自定义状态（例如 `in-review`）时，需要在 `.devflow/workflow.md` 中添加 `[workflow-state:in-review]` 块作为每回合面包屑，并扩展此路由表。通常做法是编辑 `/devflow:continue` 命令文件（`.{platform}/commands/devflow/continue.md` 或等价文件），增加一行决定从哪里恢复。没有路由条目时，`/devflow:continue` 会落入默认分支，用户不会到达你预期的步骤。

## 说明

`.devflow/workflow.md` 是本地项目工作流，不是不可变模板。用户可以按团队习惯调整它。编辑后，平台入口文件可能仍包含旧描述，因此也要检查它们。
