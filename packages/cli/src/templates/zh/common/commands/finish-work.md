# 完成工作

结束当前会话：归档活跃任务，并记录 session journal。代码提交不在这里完成；它应在 workflow Phase 3.4 完成后再调用本命令。

## 第 1 步：查看当前状态

```bash
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode record
```

输出会包含：

- **My active tasks**：检查除当前任务外是否还有已完成但未归档的任务。
- **Git status**：快速查看工作区是否有脏文件。
- **Recent commits**：第 4 步记录 journal 时需要 work commit hash。

如果发现其他已完成任务，向用户做一次确认：“这些 N 个任务看起来已完成，本轮也归档吗？[y/N]”。默认否；当前活跃任务仍按第 3 步归档。

## 第 2 步：检查脏文件

运行：

```bash
git status --porcelain
```

过滤 `.devflow/workspace/` 和 `.devflow/tasks/` 下的路径，它们由 `add_session.py` 和 `task.py archive` 自动提交管理。

对剩余脏文件判断是否属于当前任务：

- 当前任务 `prd.md` / `implement.jsonl` / `check.jsonl` 中提到的路径：当前任务
- 与任务范围匹配，或你记得本会话改过的路径：当前任务
- 明显无关且你没有印象改过的路径：其他并行工作

路由：

- **仍有当前任务的未提交代码变更**：停止并提示用户回到 Phase 3.4 提交后再运行 `{{CMD_REF:finish-work}}`。
- **剩余变更都是无关并行工作**：说明一次并继续第 3 步。
- **无法判断**：只问用户一次，然后按回答路由。

## 第 3 步：归档任务

```bash
{{PYTHON_CMD}} ./.devflow/scripts/task.py archive <task-name>
```

至少归档当前活跃任务；如果第 1 步用户确认，也归档额外任务。每次归档都会由脚本生成 `chore(task): archive ...` 提交。

如果没有活跃任务且用户没有确认清理归档，跳过本步。

## 第 4 步：记录 session journal

```bash
{{PYTHON_CMD}} ./.devflow/scripts/add_session.py \
  --title "Session Title" \
  --commit "hash1,hash2" \
  --summary "Brief summary"
```

`--commit` 使用 Phase 3.4 产生的工作提交 hash，不包含第 3 步的 archive commit。该命令会生成 `chore: record journal` 提交。
