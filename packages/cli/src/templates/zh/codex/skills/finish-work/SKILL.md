---
name: finish-work
description: "收尾一个活动 DevFlow 任务：归档它（以及用户想清理的其他已完成但未归档任务）并记录会话日志。如果工作树存在未提交代码变更则拒绝运行（这些应先在 workflow Phase 3.4 处理）。当用户要求 finish / wrap up / call it a day，或调用 $finish-work 时使用。"
---

# 收尾工作

收尾当前会话：归档活动任务（以及用户想清理的其他已完成但未归档任务），并记录会话 journal。这里不提交代码；代码提交发生在调用本 skill 前的 workflow Phase 3.4。

## 步骤 1：查看当前状态

```bash
python3 ./.devflow/scripts/get_context.py --mode record
```

这会输出：

- **My active tasks** — 检查除当前任务外是否还有实际已完成（代码已合并、AC 已满足）且本轮应归档的任务。
- **Git status** — 快速查看哪些文件是 dirty。
- **Recent commits** — 步骤 4 的 `--commit` 需要这些提交 hash。

如果 `--mode record` 显示了与当前会话无关的其他已完成任务，用一次性确认提示用户：“These N tasks look done — archive them too in this round? [y/N]”。默认是否；当前活动任务无论如何都在步骤 3 归档。

## 步骤 2：健全性检查 — 分类 dirty 路径

运行：

```bash
git status --porcelain
```

过滤掉 `.devflow/workspace/` 和 `.devflow/tasks/` 下的路径；这些由 `add_session.py` 和 `task.py archive` 自动提交管理，会作为本 skill 自身工作的一部分显示为 dirty。

对剩余每个 dirty 路径，判断它属于**当前任务**还是**其他并行工作**（例如另一个终端窗口正在编辑同一仓库）。启发式规则：

- 当前任务的 `prd.md` / `implement.jsonl` / `check.jsonl` 引用的路径 → 当前任务
- 位于任务声明范围匹配的代码区域，或你记得本会话编辑过的路径 → 当前任务
- 位于无关区域且你不记得本会话碰过的路径 → 其他并行工作

然后按以下方式处理：

- **任一剩余路径看起来像当前任务工作** — 退出并提示：
  > "工作区中有来自本任务的未提交代码变更：`<list>`。请先回到 workflow Phase 3.4 提交它们，再运行 `$finish-work`。"

  不要在这里运行 `git commit`。不要提示用户提交。用户回到 Phase 3.4，由 AI 在那里驱动批量提交。
- **所有剩余路径看起来都无关**（其他并行窗口的工作）— 报告一次并继续步骤 3：
  > "提示：任务范围外存在 dirty 文件，将它们留给另一个窗口处理：`<list>`。"
- **确实不确定** — 询问用户一次：“Are `<list>` this task's work I forgot to commit, or another window's? (commit / ignore)” — 然后按回答处理。

## 步骤 3：归档任务

```bash
python3 ./.devflow/scripts/task.py archive <task-name>
```

至少归档当前活动任务（如果有）。再加上用户在步骤 1 确认的任何额外任务。每次归档都会通过脚本自动提交生成一个 `chore(task): archive ...` commit。

如果没有活动任务，且用户未确认任何清理归档，跳过此步骤。

## 步骤 4：记录会话 journal

```bash
python3 ./.devflow/scripts/add_session.py \
  --title "Session Title" \
  --commit "hash1,hash2" \
  --summary "Brief summary"
```

为 `--commit` 使用 Phase 3.4 生成的工作提交 hash（可在步骤 1 的 `Recent commits` 列表中看到，或通过 `git log --oneline` 查看）。不要包含步骤 3 的归档提交 hash。这会生成一个 `chore: record journal` commit。

最终 git log 顺序：`<work commits from 3.4>` → `chore(task): archive ...`（一个或多个）→ `chore: record journal`。

---

## 与其他 Skills 的关系

```
开发流程：
  Phase 3.4 (workflow.md) -> AI 草拟批量提交 -> 用户确认 -> git commit
                                                                              |
                                                                              v
                                                                    $finish-work
                                                                    (检查 + 归档 + journal)

调试流程：
  遇到 bug -> 修复 -> $break-loop -> 知识沉淀
```

- `$finish-work` — 本 skill，检查 + 归档 + 记录会话。
- `$break-loop` — 调试后的深度分析。
