# 本地上下文注入系统

DevFlow 上下文注入的目标是让 AI 在正确时间读取正确文件，而不是依赖模型记忆。在用户项目中，注入由 `.devflow/` 脚本与平台 hooks、agents 和 skills 共同实现。

## 注入的上下文类型

| 类型 | 来源 | 用途 |
| --- | --- | --- |
| session context | `.devflow/scripts/get_context.py` | 当前开发者、git 状态、活动任务、活动任务列表、日志、包。 |
| workflow context | `.devflow/workflow.md` | 当前 DevFlow 流程和下一步动作。 |
| spec context | `.devflow/spec/` + task JSONL | 实现/检查期间必须遵循的规范和结构化知识。 |
| task context | `.devflow/tasks/<task>/prd.md`, `design.md`, `implement.md`, `research/` | 当前任务需求、设计、执行计划、研究和选定知识条目。 |
| platform context | Platform hooks/settings/agents | 让不同 AI 工具通过自身机制读取上述文件。 |

## session-start

支持 session-start 的平台会在会话开始、清空、压缩或收到类似事件时注入 DevFlow 概览。注入内容通常包括：

- 工作流摘要。
- 当前任务状态。
- 活动任务。
- 规范索引路径。
- 开发者身份和 git 状态。

如果用户觉得 AI 在新会话中不知道当前任务，先检查平台的 session-start hook 或等价机制是否已安装并运行。

## workflow-state

workflow-state 是围绕每个用户回合注入的轻量提示。它根据当前任务状态，从 `.devflow/workflow.md` 中选择一个块，例如 `no_task`、`planning`、`in_progress` 或 `completed`。

如果用户想更改“AI 在某个状态下接下来应该做什么”，先编辑 `.devflow/workflow.md` 中对应状态块。

## 子代理上下文

实现和检查代理需要任务上下文。DevFlow 有两种加载模式：

1. **hook push**：平台 hook 在代理启动前注入 JSONL 引用的文件/知识，以及 `prd.md`、存在时的 `design.md` 和存在时的 `implement.md`。
2. **agent pull**：代理定义指示代理在启动后读取活动任务、JSONL 上下文、知识条目和任务产物。

两种模式下，任务目录中的 JSONL 文件都是规范/研究/知识上下文清单。任务产物按以下顺序单独读取：`prd.md` -> `design.md if present` -> `implement.md if present`。

## JSONL 读取规则

`implement.jsonl` 和 `check.jsonl` 每行包含一个 JSON 对象：

```jsonl
{"file": ".devflow/spec/backend/index.md", "reason": "Backend rules"}
{"file": ".devflow/spec/backend/", "type": "directory", "reason": "Backend docs"}
{"knowledge": "DFL-20260526-example", "type": "knowledge", "reason": "Relevant learning"}
```

读取器应跳过没有 context 字段的种子行。`file` 条目加载仓库相对文件/目录。`knowledge`、`wiki` 或 `{"type":"knowledge","id":"..."}` 条目按 id 从 `.devflow/spec`、`.devflow/tasks` 或 `.devflow/workspace` 加载聚焦的结构化知识。配置 JSONL 时，AI 只应包含规范/研究/知识上下文，不要预注册即将修改的代码文件。

## 活动任务与上下文键

活动任务状态位于 `.devflow/.runtime/sessions/`，并按会话隔离。Hooks 会尝试从平台事件、环境变量、转录路径或 `DEVFLOW_CONTEXT_ID` 解析上下文键。

如果 shell 命令看不到相同上下文键，`task.py current --source` 可能报告没有活动任务。这种情况下，检查平台是否把会话身份传入 shell，而不是手写全局当前任务文件。

## 本地定制点

| 需求 | 编辑位置 |
| --- | --- |
| 更改 session-start 注入内容 | 平台的 `session-start` hook 或插件文件。 |
| 更改每回合 workflow-state 规则 | `.devflow/workflow.md` 中的 `[workflow-state:STATUS]` 块。平台 workflow-state hook 会逐字解析这些块，不嵌入后备文本。 |
| 更改子代理如何读取上下文 | 平台代理定义、`inject-subagent-context` hook 或代理 prelude。 |
| 更改 JSONL 验证/显示 | `.devflow/scripts/common/task_context.py`。 |
| 更改活动任务解析 | `.devflow/scripts/common/active_task.py`。 |

修改上下文注入时，验证两件事：新会话能看到正确任务，子代理能看到正确任务产物/规范/研究/知识。
