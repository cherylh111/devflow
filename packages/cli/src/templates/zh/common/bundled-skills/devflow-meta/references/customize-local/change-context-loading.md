# 更改本地上下文加载

上下文加载决定 AI 何时读取工作流、任务、规范、研究、工作区和 git 状态。当用户说“AI 不知道当前任务”“代理没有读取规范”或“上下文太多/太少”时，阅读本页。

## 先读取这些文件

1. `.devflow/workflow.md`
2. `.devflow/scripts/get_context.py`
3. `.devflow/scripts/common/session_context.py`
4. `.devflow/scripts/common/task_context.py`
5. `.devflow/scripts/common/active_task.py`
6. Current platform hooks or agent files
7. The current task's `implement.jsonl` / `check.jsonl`

## 上下文来源

| 来源 | 用途 |
| --- | --- |
| `.devflow/workflow.md` | 工作流和下一步提示。 |
| `.devflow/tasks/<task>/prd.md` | 当前任务需求。 |
| `.devflow/tasks/<task>/design.md` | 复杂任务技术设计。 |
| `.devflow/tasks/<task>/implement.md` | 复杂任务执行计划。 |
| `.devflow/tasks/<task>/implement.jsonl` | 实现前要读取的 spec/research。 |
| `.devflow/tasks/<task>/check.jsonl` | 检查期间要读取的 spec/research。 |
| `.devflow/spec/` | 项目规范。 |
| `.devflow/workspace/` | 会话记录。 |
| git status | 当前工作树变更。 |

## 常见需求和编辑点

| 需求 | 编辑点 |
| --- | --- |
| 在新会话中注入更多/更少信息 | `session_context.py` 或平台 `session-start` hook。 |
| 更改每次用户输入的提示 | `.devflow/workflow.md` 中的 `[workflow-state:STATUS]` 块。`inject-workflow-state` hook 只负责解析并逐字读取该块。 |
| Agent 没有读取 specs | 任务 JSONL、agent prelude、`inject-subagent-context` hook。 |
| 活动任务丢失 | `active_task.py` 和平台会话身份传递。 |
| 更改 JSONL 验证规则 | `task_context.py`。 |

## JSONL 规则

`implement.jsonl` / `check.jsonl` 是关键上下文加载接口：

```jsonl
{"file": ".devflow/spec/backend/index.md", "reason": "Backend conventions"}
{"file": ".devflow/tasks/04-28-x/research/api.md", "reason": "API research"}
{"knowledge": "DFL-20260526-example", "type": "knowledge", "reason": "Relevant learning"}
```

只包含 spec/research 文件和聚焦知识条目。不要把即将修改的代码文件放进这些清单；agents 会在实现期间自行读取代码文件。

## 更改会话上下文

如果用户希望每个新会话看到更多项目状态，编辑：

- `.devflow/scripts/common/session_context.py`
- the corresponding platform `session-start` hook

上下文不能无限增长。优先注入索引和路径，让 AI 按需读取详细文件。

## 更改子代理上下文

先确定平台使用哪种模式：

- hook push：编辑 `inject-subagent-context` hook。
- agent pull：编辑对应 `devflow-implement` / `devflow-check` agent 文件中的读取步骤。

两种模式下，都要确保 agent 最终读取：

1. 活动任务
2. 对应 JSONL
3. JSONL 引用的 spec/research/knowledge
4. `prd.md`
5. `design.md` if present
6. `implement.md` if present

## 排查顺序

```bash
python3 ./.devflow/scripts/task.py current --source
python3 ./.devflow/scripts/task.py list-context <task>
python3 ./.devflow/scripts/task.py validate <task>
python3 ./.devflow/scripts/get_context.py --mode packages
```

编辑 hooks/agents 前，先确认任务和 JSONL 正确。
