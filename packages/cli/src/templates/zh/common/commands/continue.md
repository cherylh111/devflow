# 继续当前任务

恢复当前任务，并根据 `.devflow/workflow.md` 找到正确的阶段和步骤。

---

## 第 1 步：加载当前上下文

```bash
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py
```

确认当前任务、git 状态和最近提交。

## 第 2 步：加载 Phase Index

```bash
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode phase
```

显示 Plan / Execute / Finish 的阶段索引、路由规则和 skill 映射。

## 第 3 步：判断当前位置

根据 `get_context.py` 输出的活跃任务 `status` 和已有产物路由：

- `status=planning` 且没有 `prd.md`：进入 **1.1**，加载 `devflow-brainstorm`
- `status=planning` 且只有 `prd.md`：判断轻量或复杂。轻量任务可进入 **1.4** 审核；复杂任务回到 **1.1** 补 `design.md` 和 `implement.md`
- `status=planning` 且复杂产物齐全但 jsonl 未整理：进入 **1.3**
- `status=planning` 且必需产物齐全、jsonl 已整理或 inline mode：进入 **1.4**，请求 start review，用户确认后才运行 `task.py start`
- `status=in_progress` 且尚未开始实现：进入 **2.1**
- `status=in_progress` 且实现完成但未检查：进入 **2.2**
- `status=in_progress` 且检查通过：进入 **3.1**
- `status=completed`：通常立即归档，进入 archive flow

阶段规则：

1. 每个阶段内按顺序执行，`[required]` 步骤不能跳过。
2. `[once]` 步骤在对应产物已存在时视为完成。只有轻量任务可以只需要 `prd.md`；复杂任务还需要 `design.md` 和 `implement.md`。
3. 如果发现需求或设计有缺口，可以回到更早阶段。

## 第 4 步：加载具体步骤

确认要恢复的步骤后运行：

```bash
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode phase --step <X.X> --platform {{CLI_FLAG}}
```

按加载出的指令执行。每个 `[required]` 步骤完成后进入下一步。

---

## 参考

完整工作流和阶段详情位于 `.devflow/workflow.md`。本命令只是入口，权威指引在那里。
