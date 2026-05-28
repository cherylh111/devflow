# 自动运行任务队列

运行 trusted-team 快速路径：连续处理已就绪的 DevFlow 任务，不要求用户在阶段之间手动调用 `{{CMD_REF:continue}}`。

此命令是 AI 驱动的 runner，不是后台 daemon。你仍然在当前会话中执行实际实现、检查、知识 review、提交、归档和 journal 步骤。当任务需要新的产品决策、检查无法变绿、提交计划被拒绝，或用户要求停止时，立即停止。

---

## 步骤 1：加载 Runner 上下文

```bash
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode phase
{{PYTHON_CMD}} ./.devflow/scripts/task.py list --mine
```

如果因为未配置 developer 导致 `--mine` 失败，运行：

```bash
{{PYTHON_CMD}} ./.devflow/scripts/task.py list
```

## 步骤 2：建立一次性运行许可

开始第一个任务前，总结你发现的队列：

- 当前活动任务（如果有）
- 你打算启动的已就绪 `planning` 任务
- 你打算恢复的 `in_progress` 任务
- 被跳过的任务及原因

只询问一次是否批准自动运行该队列。批准后，不要在阶段之间再要求用户调用 `{{CMD_REF:continue}}`。保留现有 Phase 3.4 提交计划确认，除非用户已提前明确批准具体提交计划。

只有满足以下条件时，才把任务视为已就绪：

- `prd.md` 存在
- 轻量任务：PRD 足够，且不包含未解决的 `TBD`
- 复杂任务：`prd.md`、`design.md` 和 `implement.md` 都存在
- 需求已经讨论过；看不到开放的产品决策

跳过未就绪任务。在最终总结中报告它们。

## 步骤 3：处理一个任务

对每个已批准任务，运行正常工作流，不等待手动阶段命令。

### A. 激活或恢复

如果没有活动任务，且下一个任务仍处于 `planning`，启动它：

```bash
{{PYTHON_CMD}} ./.devflow/scripts/task.py start <task-dir-or-name>
```

如果任务已经活动且为 `in_progress`，恢复它。

然后加载实现步骤详情：

```bash
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode phase --step 2.1 --platform {{CLI_FLAG}}
```

### B. 实现

{{#AGENT_CAPABLE}}
使用该平台的正常 Phase 2 路由：

- sub-agent 模式：分派 `devflow-implement`，并把 `Active task: <task path>` 放在 prompt 开头
- inline 模式：加载 `devflow-before-dev` 并直接编辑

{{/AGENT_CAPABLE}}
{{^AGENT_CAPABLE}}
加载 `devflow-before-dev` 并直接编辑。

{{/AGENT_CAPABLE}}
读取 `prd.md`，再读取存在的 `design.md`，再读取存在的 `implement.md`。如果 `research/` 存在，也要查阅。

### C. 检查并修复

运行 Phase 2.2 和 Phase 3.1 检查，不等待手动命令：

```bash
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode phase --step 2.2 --platform {{CLI_FLAG}}
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode phase --step 3.1 --platform {{CLI_FLAG}}
```

使用 `devflow-check`；直接修复所有发现的问题，并重新运行相关项目检查直到变绿。如果检查暴露需求缺陷，停止 runner，并回到该任务的规划阶段。

### D. 知识 Review

运行 Phase 3.3 判断：

```bash
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode phase --step 3.3 --platform {{CLI_FLAG}}
```

如有必要，使用 `devflow-update-spec`、`python3 ./.devflow/scripts/knowledge.py learn` 或本地知识条目沉淀可复用知识。如果没有可记录内容，简要说明该结论。

### E. 提交工作

严格按 `.devflow/workflow.md` 中的写法运行 Phase 3.4：

```bash
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode phase --step 3.4 --platform {{CLI_FLAG}}
```

不要跳过 dirty-file 分类。不要提交无法识别的用户更改。在运行 `git add` / `git commit` 前，展示批量提交计划并获得必需的一次性确认。

### F. 完成工作

工作提交完成后，立即运行 finish-work flow：

```bash
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode record
```

然后遵循 `{{CMD_REF:finish-work}}`：

1. 分类 dirty paths
2. 使用 `task.py archive` 归档已完成任务
3. 使用 `add_session.py` 记录 session journal

完成后，在选择下一个任务前清理或刷新当前上下文：

```bash
{{PYTHON_CMD}} ./.devflow/scripts/task.py current --source
{{PYTHON_CMD}} ./.devflow/scripts/task.py list --mine
```

## 步骤 4：继续或停止

移动到下一个已批准且就绪的任务，并重复步骤 3。

在以下情况下停止 runner：

- 已批准队列为空
- 下一个任务未就绪
- 实现或检查被阻塞
- Phase 3.4 提交确认被拒绝
- dirty files 无法安全分类
- 用户打断或改变方向

## 最终报告

报告：

- 已完成并归档的任务
- 为每个任务创建的 commits
- 被跳过的任务及原因
- 无法运行的任何检查
