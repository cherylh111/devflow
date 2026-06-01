# 实现计划

## 步骤

- [x] 阅读任务生命周期和 CLI 测试相关规范。
- [x] 增加 start 前置条件校验辅助函数。
- [x] 在 `cmd_start` 状态修改前接入校验。
- [x] 给 `task.py start` 增加 `--force` 参数。
- [x] 增加回归测试，覆盖占位 PRD、复杂任务缺失产物、inline JSONL 容忍、显式要求 sub-agent manifest 上下文等场景。
- [x] 适配 `.devflow/workflow.md`、英文/中文模板 workflow 和 native marketplace mirror，让 planning breadcrumb、1.4 start 步骤、完成标准都说明新的 metadata gate。
- [x] 运行聚焦测试、完整 regression 文件、lint、typecheck 和 Python 编译检查。

## 验证

```bash
pnpm --filter @enpd/devflow test -- -t start-gate
pnpm --filter @enpd/devflow test -- test/regression.test.ts
pnpm --filter @enpd/devflow lint
pnpm --filter @enpd/devflow typecheck
python -m py_compile .devflow/scripts/task.py packages/cli/src/templates/devflow/scripts/task.py
```
