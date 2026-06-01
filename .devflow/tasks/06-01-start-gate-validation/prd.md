# Start gate validation

## 目标

防止 `task.py start` 把规划不足的任务推进到实现阶段，同时保留 Codex inline 工作流中不强制要求 JSONL manifest 的设计。

## 需求

- `task.py start` 必须在修改任务状态前执行 start 阶段校验。
- 当 `prd.md` 缺失或仍是默认占位内容时，校验必须失败。
- 当任务被标记为复杂任务且缺少 `design.md` 或 `implement.md` 时，校验必须失败。
- Codex inline 模式不得强制要求已整理的 `implement.jsonl` / `check.jsonl`。
- sub-agent manifest 校验必须能识别 seed-only 或空 JSONL，并且只在任务明确要求 sub-agent manifest 上下文时阻止 start。
- 用户必须能通过显式 force 参数有意绕过 start gate。

## 验收标准

- [x] 缺少 `prd.md` 或 `prd.md` 仍是默认占位内容时，启动任务失败，除非使用 force。
- [x] 复杂任务缺少 `design.md` 或 `implement.md` 时，启动任务失败，除非使用 force。
- [x] Codex inline 模式允许 seed-only 或缺失 JSONL manifest。
- [x] sub-agent manifest 校验把 `_example` 行视为非真实上下文条目。
- [x] 回归测试覆盖新的 start gate 行为。
