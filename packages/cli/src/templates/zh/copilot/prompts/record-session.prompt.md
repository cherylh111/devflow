---
description: "DevFlow Copilot prompt: Method 1: Simple parameters"
---

[!] **前置条件**：此命令只能在人类已经测试并提交代码之后使用。

**不要直接运行 `git commit`** — 下面的脚本会自行提交 `.devflow/` metadata。你只需要读取 git history（`git log`、`git status`、`git diff`）并运行 Python 脚本。

---

## 记录工作进展

### 步骤 1：获取上下文并检查任务

```bash
python3 ./.devflow/scripts/get_context.py --mode record
```

[!] 归档工作**实际完成**的任务 — 根据工作状态判断，而不是根据 task.json 中的 `status` 字段：
- 代码已提交？→ 归档它（不要等待 PR）
- 所有验收标准已满足？→ 归档它
- 不要仅因为 `status` 仍是 `planning` 或 `in_progress` 就跳过归档

```bash
python3 ./.devflow/scripts/task.py archive <task-name>
```

### 步骤 2：一键添加 Session

```bash
# 方法 1：简单参数
python3 ./.devflow/scripts/add_session.py \
  --title "Session Title" \
  --commit "hash1,hash2" \
  --summary "Brief summary of what was done"

# 方法 2：通过 stdin 传入详细内容
cat << 'EOF' | python3 ./.devflow/scripts/add_session.py --stdin --title "Title" --commit "hash"
| Feature | Description |
|---------|-------------|
| New API | Added user authentication endpoint |
| Frontend | Updated login form |

**Updated Files**:
- `packages/api/modules/auth/router.ts`
- `apps/web/modules/auth/components/login-form.tsx`
EOF
```

**自动完成**：
- [OK] 将 session 追加到 journal-N.md
- [OK] 自动检测行数，超过 2000 行时创建新文件
- [OK] 自动检测 Branch context（`--branch` 可覆盖；否则 Branch = task.json -> 当前 git branch；缺失值会优雅省略）
- [OK] 更新 index.md（Total Sessions +1、Last Active、line stats、history）
- [OK] 自动提交 .devflow/workspace 和 .devflow/tasks 变更

---

## 脚本命令参考

| 命令 | 用途 |
|---------|---------|
| `python3 ./.devflow/scripts/get_context.py --mode record` | 获取 record-session 上下文 |
| `python3 ./.devflow/scripts/add_session.py --title "..." --commit "..."` | **一键添加 session（推荐，branch 自动补全）** |
| `python3 ./.devflow/scripts/task.py archive <name>` | 归档已完成任务（自动提交） |
| `python3 ./.devflow/scripts/task.py list` | 列出活动任务 |
