# 实现计划

1. 写代码前加载相关实现规范：
   - `.devflow/spec/devflow/backend/index.md`
   - `.devflow/spec/devflow/backend/script-conventions.md`
   - `.devflow/spec/devflow/backend/workflow-state-contract.md`
   - `.devflow/spec/devflow/unit-test/index.md`
   - `.devflow/spec/guides/index.md`
2. 新增 `common/task_progress.py`，包含：
   - progress schema 默认值
   - 读取和写入 helper
   - 字段白名单与枚举校验
   - 恢复摘要构建器
3. 为 `task.py` 增加 `progress` argparse 子命令分发。
4. 根据兼容性检查结果决定是否在 `cmd_create` 中自动创建 `progress.json`；如果会给轻量任务带来噪音，则保持懒创建。
5. 更新 `devflow-continue`，将 `task.py progress recover [task]` 作为恢复时的第一步提示。
6. 更新 `.devflow/workflow.md` 的 Phase 2/3 指导，使长时间实现、检查和收尾工作在阶段边界更新进度。
7. 增加聚焦测试：
   - `progress init` 能创建合法 JSON
   - 未知字段会失败
   - 非法枚举会失败
   - 没有 `progress.json` 时 `recover` 仍可工作
   - `recover` 能报告规划产物和下一步动作
   - 归档任务会保留 progress 文件
8. 运行验证：
   - task/progress 相关聚焦测试
   - 如果修改 `workflow.md`，运行 workflow-state 回归测试
   - `pnpm lint && pnpm typecheck`

## 回滚点

- 如果 progress 文件创建对轻量任务造成噪音，回退为仅懒创建。
- 如果工作流指导改动过宽，先将实现限制在脚本和 `devflow-continue` 文档。
- 如果测试发现平台路径问题，统一使用 repo-relative path，并在 Python 中全程使用 `pathlib.Path`。

## 评审门

在用户批准本计划前，不开始实现。当前阶段只产出研究和设计产物。
