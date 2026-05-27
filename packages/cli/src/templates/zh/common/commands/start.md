# 开始会话

初始化一个由 DevFlow 管理的开发会话。本平台没有 session-start hook，因此需要按下面步骤手动加载等价的精简上下文。

---

## 第 1 步：读取当前状态

包含开发者身份、git 状态、当前任务、活跃任务和 journal 位置。

```bash
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py
```

如果输出中包含以 `DevFlow update available:` 开头的行，在总结会话上下文时逐字保留整行，不要缩短命令提示。

## 第 2 步：读取工作流概览

加载 Phase Index、请求分类规则、规划产物约定和按步骤读取详情的命令。

```bash
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode phase
```

完整指南在 `.devflow/workflow.md` 中，需要时再读取。

## 第 3 步：读取规范索引

发现 packages 和 spec layers，然后读取相关索引文件。

```bash
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode packages
cat .devflow/spec/guides/index.md
cat .devflow/spec/<package>/<layer>/index.md
```

索引文件会列出真正需要读取的规范文档。

## 第 4 步：决定下一步

根据第 1 步中的当前任务和状态检查任务目录：

- **活跃任务为 `planning` 且没有 `prd.md`**：进入 Phase 1.1，加载 `devflow-brainstorm` skill。
- **活跃任务为 `planning` 且已有 `prd.md`**：仍在 Phase 1。轻量任务可以只有 PRD；复杂任务还需要 `design.md` 和 `implement.md`。在运行 `task.py start` 前加载对应 Phase 1 步骤详情。
- **活跃任务为 `in_progress`**：进入 Phase 2 step 2.1：
  ```bash
  {{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode phase --step 2.1 --platform {{CLI_FLAG}}
  ```
- **没有活跃任务**：先分类。简单对话或小任务只询问本轮是否创建 DevFlow 任务；复杂任务询问是否创建任务并进入规划。如果用户拒绝，本轮跳过 DevFlow。

---

## Skill 路由速查

| 用户意图 | Skill |
|---|---|
| 新功能或需求不清 | `devflow-brainstorm` |
| 准备写代码 | `devflow-before-dev` |
| 已完成编码，需要质量检查 | `devflow-check` |
| 同类问题反复修复 | `devflow-break-loop` |
| 有值得沉淀的知识 | `devflow-update-spec` |

完整规则和反合理化表在 `.devflow/workflow.md`。
