---
name: start
description: "通过读取 .devflow/ 中的 workflow guides、developer identity、git status、active tasks 和项目规范来初始化 AI 开发会话。分类传入任务，并路由到 brainstorm、direct edit 或 task workflow。用于开始新编码会话、恢复工作、开始新任务或重新建立项目上下文。"
---

# 启动会话

初始化一个由 DevFlow 管理的开发会话。此平台没有活动的 session-start hook，因此请按以下步骤手动加载等价的精简上下文。

---

## 步骤 1：当前状态
身份、git 状态、当前任务、活动任务和 journal 位置。

```bash
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py
```

如果输出包含以 `DevFlow update available:` 开头的行，在总结会话上下文时逐字复制整行。不要缩短可执行的命令提示。

## 步骤 2：工作流概览
精简的 Phase Index、请求分流规则、规划产物约定和步骤详情命令。

```bash
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode phase
```

完整指南位于 `.devflow/workflow.md`（按需读取）。

## 步骤 3：规范索引
发现 packages 和 spec layers，然后读取每个相关的 index 文件。

```bash
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode packages
cat .devflow/spec/guides/index.md
cat .devflow/spec/<package>/<layer>/index.md   # for each relevant layer
```

index 文件会列出真正开始编码时需要读取的具体规范文档。

## 步骤 4：决定下一步动作
通过步骤 1 可以知道当前任务和状态。检查任务目录：

- **活动任务状态为 `planning` 且没有 `prd.md`** → Phase 1.1。加载 `devflow-brainstorm` skill。
- **活动任务状态为 `planning` 且 `prd.md` 已存在** → 保持在 Phase 1。轻量任务可以只有 PRD；复杂任务需要 `design.md` + `implement.md`。在 `task.py start` 前加载相关 Phase 1 步骤详情。
- **活动任务状态为 `in_progress`** → Phase 2 step 2.1。加载步骤详情：
  ```bash
  {{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode phase --step 2.1 --platform {{CLI_FLAG}}
  ```
- **没有活动任务** → 先分类。简单对话 / 小任务只询问本轮是否需要创建 DevFlow task。复杂工作则询问是否可以创建 DevFlow task 并进入规划。如果用户拒绝，本会话跳过 DevFlow。

---

## Skill 路由（速查）

| 用户意图 | Skill |
|---|---|
| 新功能 / 需求不清 | `devflow-brainstorm` |
| 准备写代码 | `devflow-before-dev` |
| 已完成编码 / 质量检查 | `devflow-check` |
| 卡住 / 多次修同一类 bug | `devflow-break-loop` |
| 学到值得沉淀的内容 | `devflow-update-spec` |

完整规则和反合理化表位于 `.devflow/workflow.md`。
