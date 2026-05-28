# 更改本地任务生命周期

任务生命周期包括创建、启动、上下文配置、完成、归档、父/子任务和生命周期 hooks。默认定制目标是 `.devflow/tasks/`、`.devflow/config.yaml` 和 `.devflow/scripts/`。

## 先读取这些文件

1. `.devflow/workflow.md`
2. `.devflow/config.yaml`
3. `.devflow/scripts/task.py`
4. `.devflow/scripts/common/task_store.py`
5. `.devflow/scripts/common/task_utils.py`
6. The current task's `.devflow/tasks/<task>/task.json`

## 常见需求和编辑点

| 需求 | 编辑点 |
| --- | --- |
| 任务创建后自动同步外部系统 | `.devflow/config.yaml` 中的 `hooks.after_create`。 |
| 任务启动后自动更新状态 | `.devflow/config.yaml` 中的 `hooks.after_start`。 |
| 任务完成后运行脚本 | `.devflow/config.yaml` 中的 `hooks.after_finish`。 |
| 归档后清理外部资源 | `.devflow/config.yaml` 中的 `hooks.after_archive`。 |
| 更改默认任务字段 | `.devflow/scripts/common/task_store.py`。 |
| 更改任务解析/搜索 | `.devflow/scripts/common/task_utils.py`。 |
| 更改活动任务行为 | `.devflow/scripts/common/active_task.py`。 |

## 生命周期 hooks

`.devflow/config.yaml` 支持：

```yaml
hooks:
  after_create:
    - "python3 .devflow/scripts/hooks/my_sync.py create"
  after_start:
    - "python3 .devflow/scripts/hooks/my_sync.py start"
  after_finish:
    - "python3 .devflow/scripts/hooks/my_sync.py finish"
  after_archive:
    - "python3 .devflow/scripts/hooks/my_sync.py archive"
```

Hook 命令会收到 `TASK_JSON_PATH` 环境变量，指向当前任务的 `task.json`。Hook 失败通常应警告，但不阻断主任务操作。

## 更改任务字段

如果用户想添加项目本地字段，优先放在 `task.json` 的 `meta` 下，以免破坏现有脚本对标准字段的假设。

示例：

```json
"meta": {
  "linearIssue": "ENG-123",
  "risk": "high"
}
```

如果确实需要更改标准字段，检查每个读取 `task.json` 的本地脚本。

## 更改活动任务

活动任务是存储在 `.devflow/.runtime/sessions/` 中的会话级状态。不要退回到全局 `.current-task` 模型。如果用户想更改活动任务行为，编辑：

- `.devflow/scripts/common/active_task.py`
- platform hooks or shell session bridges
- active task descriptions in `.devflow/workflow.md`

### `task.py create` 设置活动指针

`.devflow/scripts/common/task_store.py` 中的 `cmd_create` 会在写入新任务目录后尽力调用 `set_active_task`。行为如下：

- 当调用 shell 携带会话身份时（`DEVFLOW_CONTEXT_ID` 环境变量，或 `resolve_context_key` 可识别的任意平台专属会话环境变量，见 `active_task.py:_ENV_SESSION_KEYS`），`.devflow/.runtime/sessions/<context_key>.json` 中的每会话指针会被重写为指向新任务。该任务的 `status=planning`，并且 `[workflow-state:planning]` 会在下一个 `UserPromptSubmit` 触发。
- 当会话身份不可用时（AI 会话之外的原始 CLI 调用，或平台没有将身份传递给 shell），任务目录仍会创建，`status=planning` 仍会写入，但活动指针保持不变。用户回到 AI 会话后，可以用 `task.py start <dir>` 稍后附加任务。

这使 `[workflow-state:planning]` 在 `task.py create` 之后的 brainstorm 和 JSONL 整理工作期间成为实时面包屑。R7 之前的行为会让面包屑一直停在 `no_task`，直到 `task.py start`，因此 planning 块实际上是无效文本。

如果你 fork `task.py` 添加新的创建路径（例如绕过 `cmd_create` 的外部导入），请审计该路径是否也调用 `set_active_task`。没有该调用时，创建出的任务不会显示为活动任务。完整状态写入表在 `.devflow/spec/cli/backend/workflow-state-contract.md` 中。

## 修改步骤

1. 用 `python3 ./.devflow/scripts/task.py current --source` 确认当前任务。
2. 读取当前任务的 `task.json`，确认状态和字段。
3. 对于配置需求，先编辑 `.devflow/config.yaml`。
4. 对于脚本行为需求，再编辑 `.devflow/scripts/`。
5. 如果 AI 流程变化，同步 `.devflow/workflow.md`。

## Do Not

- 不要直接编辑 `.devflow/.runtime/sessions/` 来“修复”业务状态。
- 不要把项目私有字段硬编码进脚本；优先使用 `meta`。
- 不要默认要求用户 fork DevFlow CLI。
