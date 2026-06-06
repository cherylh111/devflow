# 设计

## 边界

除非用户明确批准实现，否则本任务只做研究和规划。建议的实现会改变 DevFlow 的任务恢复能力，不改变核心任务生命周期。

`task.json.status` 继续作为 workflow-state breadcrumb 的事实来源。新增的任务内进度文件只补充更细粒度的恢复信息，供 continue 使用。

## 建议架构

新增 `.devflow/tasks/<task>/progress.json`，由 DevFlow 脚本管理。

该文件应使用 JSON，而不是 YAML。原因是 DevFlow 现有任务元数据已经使用 JSON，且 Python 标准库在所有支持平台上都能稳定处理 JSON。

初始 schema：

```json
{
  "schema_version": 1,
  "phase": "planning",
  "step": "1.1",
  "summary": "",
  "resume_hint": "",
  "current_item": null,
  "completed_items": [],
  "pending_items": [],
  "last_validation": null,
  "updated_at": "2026-06-06T00:00:00Z",
  "updated_by": "agent"
}
```

schema 应刻意保持小而稳定。它只描述“从哪里恢复”，不复制完整 PRD、设计文档或实现计划。

## 脚本接口

在 `.devflow/scripts/common/` 下新增聚焦模块，例如 `task_progress.py`，并从 `.devflow/scripts/task.py` 分发命令：

- `python ./.devflow/scripts/task.py progress init <task>`
- `python ./.devflow/scripts/task.py progress set <task> <field> <value>`
- `python ./.devflow/scripts/task.py progress recover [task]`
- `python ./.devflow/scripts/task.py progress status [task] [--json]`

`recover` 应组合以下信息：

- `task.json.status`
- 规划产物是否存在：`prd.md`、`design.md`、`implement.md`、`research/`
- `progress.json` 字段
- 相关场景下的 JSONL 上下文整理状态
- 最新 git dirty 摘要
- 从 `.devflow/workflow.md` 推导出的下一步工作流动作

## 字段校验

进度写入必须使用白名单。未知字段应失败，并向 stderr 输出清晰错误。

建议允许写入的字段：

- `phase`
- `step`
- `summary`
- `resume_hint`
- `current_item`
- `completed_items`
- `pending_items`
- `last_validation`

枚举校验：

- `phase`：`planning`、`implement`、`check`、`finish`、`blocked`
- `step`：工作流步骤 id，例如 `1.1`、`1.2`、`2.1`、`2.2`、`3.1`、`3.3`、`3.4`

## 工作流集成

- `task.py create` 可以创建默认 `progress.json`，也可以由 `task.py progress init` 懒创建。
- `devflow-continue` 在可用时应优先使用 `task.py progress recover`，再回退到现有的 status/artifact 路由。
- `devflow-before-dev`、`devflow-check` 和收尾流程应提示 agent 在关键阶段边界更新进度。
- 第一版实现不应让 start gate 依赖 `progress.json`。这样可以保持轻量任务兼容。

## 兼容性

没有 `progress.json` 的既有任务必须继续可用。`recover` 可以从现有文件合成摘要，并提示运行 `progress init`。

归档任务时，应将 `progress.json` 作为任务目录的一部分保留下来。

## 权衡

独立的 `progress.json` 避免污染 `task.json`，但会增加一个任务产物。这个成本可以接受，因为该文件只服务于恢复进度这一窄目标。

脚本管理的进度比自由文本 agent 笔记更可靠，但需要更新工作流指导，确保 agent 在实际流程中调用它。

后续可以考虑解析 `implement.md` checkbox，但第一版不应依赖它。Markdown checklist 解析较脆弱，除非 DevFlow 先标准化实现计划格式。

## 不在范围内

- 替换 `task.json.status`
- 引入 Comet 的完整生命周期或 OpenSpec 集成
- 新增强制性的 issue tracker 层
- 在同一个改动中实现 glossary/ADR 捕获
