# 自动运行队列

按 DevFlow 工作流处理已经批准的 ready task 队列。只有在用户明确批准队列后才能使用。

## 运行原则

- 按 `.devflow/workflow.md` 的 Phase 1 / Phase 2 / Phase 3 顺序执行。
- 每个任务都必须有可验证的验收条件。
- 遇到未解决的决策、失败的检查、被拒绝的提交计划或用户停止请求时立即停止。
- 不要跳过 planning review、quality check 或 commit review。

## 启动上下文

先读取当前队列和工作流状态：

```bash
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode phase
```

然后按队列顺序处理任务。每完成一个任务，重新读取当前状态再继续下一个。
