---
name: devflow-use
description: "指导开发人员和 AI 编码代理把 DevFlow 作为开发工作流来使用。用于用户询问如何使用 DevFlow、需要 DevFlow 最佳实践、开始或恢复 DevFlow 管理的工作、需要选择正确的 DevFlow 阶段/skill/命令，或需要让任务、spec、检查、提交、归档和 journal 保持一致时。"
---

# 使用 DevFlow

使用这个 skill 在 DevFlow 管理的项目中工作。以本地项目文件为准；这个 skill 提供操作模型，不替代 `.devflow/workflow.md` 或任务产物。

## 核心模型

DevFlow 把开发状态保存在项目文件中：

- `.devflow/workflow.md` 定义阶段规则。
- `.devflow/tasks/` 保存 PRD、设计、实现计划和活动任务状态。
- `.devflow/spec/` 保存编码约定，改代码前必须读取。
- `.devflow/workspace/` 保存会话 journal 和可复用记忆。
- 平台目录和 `.agents/skills/` 提供面向 AI 的命令、skills、agents、hooks 和 prompts。

当这些文件存在时，不要另起一套并行流程。读取它们，遵循当前指令，并在工作变化时更新它们。

## 开始或恢复

1. 用 `python ./.devflow/scripts/get_context.py` 加载当前上下文。
2. 用 `python ./.devflow/scripts/get_context.py --mode phase` 加载阶段索引。
3. 如果存在活动任务，根据任务状态和产物继续。
4. 如果没有活动任务，创建任务前先分类请求：
   - 简单对话或小改动：询问是否创建 DevFlow 任务。
   - 复杂实现：询问是否创建 DevFlow 任务并进入规划。
5. 优先使用项目提供的 `devflow-start` 或 `devflow-continue` skill/命令；不可用时直接运行脚本。

## 规划工作

通过规划在改代码前消除歧义：

- 只有得到用户同意后才创建任务：`python ./.devflow/scripts/task.py create "<title>" --slug <slug>`。
- `prd.md` 只记录目标、需求、约束、验收条件和非目标。
- 复杂任务要增加 `design.md` 记录架构，并增加 `implement.md` 记录执行清单。
- 提问前先检查仓库。只询问代码库无法回答的产品意图、风险偏好或范围决策。
- 一次只问一个高价值问题，并给出推荐答案和取舍。
- 规划产物准备好后再启动任务：`python ./.devflow/scripts/task.py start <task-dir>`。

## 实现

编辑前加载实现上下文：

1. 读取 `prd.md`，再读取存在的 `design.md` 和 `implement.md`。
2. 运行 `python ./.devflow/scripts/get_context.py --mode packages`。
3. 读取相关的 `.devflow/spec/<package>/<layer>/index.md` 文件。
4. 遵循每个相关的开发前清单，并读取其中引用的 spec。
5. 用满足任务的最小变更实现。优先使用项目已有模式，而不是新抽象。

可用时使用 `devflow-before-dev`。inline 模式下主 agent 直接编辑。agent 分发模式下，实现和检查 agent 必须收到活动任务路径，并先加载任务上下文。

## 检查

质量检查与变更风险匹配前，不要报告完成：

- 对照 PRD、设计、实现计划和相关 spec 重新阅读改动文件。
- 针对触达行为运行 focused tests。
- 当变更影响共享行为或用户可见流程时，运行 lint、typecheck 和更广的测试。
- 修改生成文件时，验证 init/update 模板一致性。
- 先修复失败，再进入收尾。

可用时使用 `devflow-check`。把检查输出当作需要验证的证据，不要用它替代读代码。

## 保留知识

当工作产生可复用规则时，更新持久知识：

- 把可执行的编码约定写入 `.devflow/spec/`。
- 把任务级决策写入任务产物。
- 在 finish work 时把会话结果写入 journal。
- 可用时使用 `devflow-update-spec` 或 `devflow-learn`。

不要只把重要项目规则埋在聊天记录里。

## 收尾

按顺序收尾：

1. 确认检查通过，并且工作树只包含当前任务改动。
2. 先创建逻辑清晰的工作提交，再归档。
3. 用 `python ./.devflow/scripts/task.py archive <task-name>` 归档已完成任务。
4. 用 `python ./.devflow/scripts/add_session.py --title "<title>" --commit "<hashes>" --summary "<summary>"` 记录会话。

可用时使用 `devflow-finish-work`。不要归档无关的活动任务，除非用户明确要求。

## 最佳实践

- 让 PRD、设计、实现、检查、提交、归档和 journal 保持同步。
- 小范围工作优先使用轻量 PRD-only 任务；复杂工作使用设计和实现计划。
- 先读 spec，再改代码。
- 上下文重要时，在任务 notes 中使用精确日期和具体文件路径。
- 不要把无关的用户改动放进你的提交。
- 不要因为任务看起来熟悉就绕过 DevFlow。
