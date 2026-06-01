# 技术设计

## 边界

变更范围属于本地任务运行时：优先修改 `.devflow/scripts/task.py`，必要时在 `.devflow/scripts/common/task_store.py` 增加可复用辅助函数。测试通过 CLI 回归测试覆盖生成后的任务脚本行为。

## Start Gate

在 `cmd_start` 内部增加 start 阶段校验，执行时机必须早于 active-task 持久化和 `task.json.status` 修改。校验结果分为错误和警告：

- 错误默认阻止 start。
- 使用 `--force` 时可以绕过错误。
- 警告只打印，不阻止 start。
- `--force` 绕过时仍打印被绕过的错误，避免状态转换不可见。

## 规划产物

`prd.md` 始终必需，并且不能是未修改过的生成模板。复杂任务还必须提供 `design.md` 和 `implement.md`。

复杂度需要显式机器可读信号，不通过文件存在与否猜测。使用 `task.json.meta.complex == true` 作为规范标记；没有该标记时，为兼容既有任务，按轻量任务处理。

## JSONL Manifest 上下文

只有任务显式声明需要 sub-agent manifest 上下文时，才强制要求 JSONL manifest：

```json
{
  "meta": {
    "requires_subagent_context": true
  }
}
```

这类任务要求 `implement.jsonl` 和 `check.jsonl` 都至少包含一条真实上下文条目。只有 `_example` 且没有上下文字段的 seed 行不计入真实条目。

Codex inline 模式不要求 JSONL。它在 Phase 2 通过 `devflow-before-dev` 加载上下文。

## CLI 形态

扩展 `task.py start`：

- 新增 `--force` 用于显式绕过阻塞性 start-gate 错误。
- 不新增必填参数。

该设计保持既有轻量任务可继续工作，同时允许更严格的任务元数据启用强约束。
