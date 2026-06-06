# DevFlow 工作流

---

## 核心原则

1. **先计划，再编码**：开始前先弄清要做什么。
2. **规范靠注入，不靠记忆**：指南通过 hook/skill 注入，而不是让 AI 凭记忆回想。
3. **一切持久化**：研究、决策和经验都写入文件；对话会被压缩，文件不会。
4. **增量开发**：一次只推进一个任务。
5. **沉淀经验**：每个任务结束后复盘，把新知识写回 spec。

---

## DevFlow 系统

### 开发者身份

首次使用时，初始化你的身份：

```bash
python3 ./.devflow/scripts/init_developer.py <your-name>
```

这会创建 `.devflow/.developer`（已加入 gitignore）和 `.devflow/workspace/<your-name>/`。

### Spec 系统

`.devflow/spec/` 存放按 package 和 layer 组织的编码指南。

- `.devflow/spec/<package>/<layer>/index.md`：入口文件，包含 **Pre-Development Checklist** 和 **Quality Check**；
  实际指南位于它指向的 `.md` 文件中。
- `.devflow/spec/guides/index.md`：跨 package 的思考指南。

```bash
python3 ./.devflow/scripts/get_context.py --mode packages   # 列出 packages / layers
```

**何时更新 spec**：发现新的模式/约定、需要固化 bug 修复预防措施、产生新的技术决策。

### 任务系统

每个任务在 `.devflow/tasks/{MM-DD-name}/` 下都有自己的目录，包含 `task.json`、`prd.md`、可选的 `design.md`、可选的 `implement.md`、可选的 `research/`，
以及供支持子代理的平台使用的上下文清单（`implement.jsonl`、`check.jsonl`）。

```bash
# 任务生命周期
python3 ./.devflow/scripts/task.py create "<title>" [--slug <name>] [--parent <dir>]
python3 ./.devflow/scripts/task.py start <name>          # 设置活动任务（可用时按会话隔离）
python3 ./.devflow/scripts/task.py current --source      # 显示活动任务和来源
python3 ./.devflow/scripts/task.py finish                # 清除活动任务（触发 after_finish hooks）
python3 ./.devflow/scripts/task.py archive <name>        # 移动到 archive/{year-month}/
python3 ./.devflow/scripts/task.py list [--mine] [--status <s>]
python3 ./.devflow/scripts/task.py list-archive

# Code-spec 上下文（通过 JSONL 注入 implement/check agents）。
# 对支持子代理的平台，`task create` 会初始化 `implement.jsonl` / `check.jsonl`；
# 需要时 AI 会在规划期间整理真实的 spec + research 条目。
python3 ./.devflow/scripts/task.py add-context <name> <action> <file> <reason>
python3 ./.devflow/scripts/task.py list-context <name> [action]
python3 ./.devflow/scripts/task.py validate <name>

# 任务元数据
python3 ./.devflow/scripts/task.py set-branch <name> <branch>
python3 ./.devflow/scripts/task.py set-base-branch <name> <branch>    # PR 目标分支
python3 ./.devflow/scripts/task.py set-scope <name> <scope>

# 层级关系（parent/child）
python3 ./.devflow/scripts/task.py add-subtask <parent> <child>
python3 ./.devflow/scripts/task.py remove-subtask <parent> <child>

# 创建 PR
python3 ./.devflow/scripts/task.py create-pr [name] [--dry-run]
```

> 运行 `python3 ./.devflow/scripts/task.py --help` 查看权威的最新命令列表。

**当前任务机制**：`task.py create` 会创建任务目录，并在存在会话身份时自动设置当前会话的活动任务指针，让 planning 面包屑立即生效。
`task.py start` 写入同一个指针（已设置时是幂等操作），并把 `task.json.status` 从 `planning` 切到 `in_progress`。
状态存放在 `.devflow/.runtime/sessions/` 下。如果 hook 输入、`DEVFLOW_CONTEXT_ID` 或平台原生会话环境变量都没有提供 context key，
则没有活动任务，`task.py start` 会带着会话身份提示失败。`task.py finish` 删除当前会话文件（不改变状态）。
`task.py archive <task>` 写入 `status=completed`，把目录移动到 `archive/`，并删除仍指向已归档任务的运行时会话文件。

### Workspace 系统

在 `.devflow/workspace/<developer>/` 下记录每次 AI 会话，便于跨会话追踪。

- `journal-N.md`：会话日志。**每个文件最多 2000 行**；超过后会自动创建新的 `journal-(N+1).md`。
- `index.md`：个人索引（总会话数、最近活跃时间）。

```bash
python3 ./.devflow/scripts/add_session.py --title "Title" --commit "hash" --summary "Summary"
```

### 上下文脚本

```bash
python3 ./.devflow/scripts/get_context.py                            # 完整会话运行时信息
python3 ./.devflow/scripts/get_context.py --mode packages            # 可用 packages + spec layers
python3 ./.devflow/scripts/get_context.py --mode phase --step <X.Y>  # 某个工作流步骤的详细指南
```

---

<!--
  WORKFLOW-STATE 面包屑契约（编辑下方标签块前先读这里）

  下方 ## Phase Index 章节中的 [workflow-state:STATUS] 块，是每回合
  `<workflow-state>` 面包屑的唯一事实来源。每个受支持 AI 平台的
  UserPromptSubmit hook 都会读取这些块。inject-workflow-state.py
  （Python 平台）和 inject-workflow-state.js（OpenCode 插件）只负责解析；
  v0.5.0-rc.0 之后脚本中没有内置 fallback 字典。

  STATUS 字符集：[A-Za-z0-9_-]+。当 hook 找不到标签时，会降级为通用的
  "Refer to workflow.md for current step." 行；这是故意可见的，方便用户发现并修复
  损坏的 workflow.md。

  不变量（test/regression.test.ts）：
    每个标记为 `[required · once]` 的 workflow walkthrough 步骤，都必须在对应
    phase 的 [workflow-state:*] 块中有匹配的强制执行说明。面包屑是唯一的每回合通道；
    如果必需步骤没有在这里提到，AI 会静默跳过它（Phase 1 planning gate 跳过和
    Phase 3.4 commit 跳过都曾经由这个缺口触发）。

  TAG ↔ PHASE 作用域：
    [workflow-state:no_task]      → 无活动任务；Phase 1 之前
    [workflow-state:planning]     → 整个 Phase 1（status='planning'）
    [workflow-state:planning-inline] → Phase 1 的 Codex inline 变体
    [workflow-state:in_progress]  → Phase 2 + Phase 3.1-3.4
                                    （从 task.py start 到 task.py archive 之前，
                                    status 都保持 'in_progress'）
    [workflow-state:in_progress-inline] → Phase 2/3 的 Codex inline 变体
    [workflow-state:completed]    → 当前在正常流程中不会触发：cmd_archive 在同一次调用中
                                    翻转 status 并移动目录，所以 resolver 会丢失指针
                                    （保留该块供未来显式 in_progress→completed 状态转换使用）

  编辑检查清单：
    - 修改 [workflow-state:STATUS] 块时，同时检查对应 phase 中的
      `[required · once]` walkthrough 步骤是否同步
    - 编辑后运行 `devflow update`，把新块体推送到下游用户项目
      （按块进行 managed replacement）
    - 完整运行时契约：
      .devflow/spec/cli/backend/workflow-state-contract.md
-->

## Phase Index

```
Phase 1: Plan    → 分类请求，取得任务创建许可，然后写规划产物
Phase 2: Execute → 只有任务状态为 in_progress 后才实现
Phase 3: Finish  → 验证、更新 spec、提交并收尾
```

### 请求分流

- 简单对话或小任务：只询问本回合是否要创建 DevFlow 任务。如果用户说不创建，本会话跳过 DevFlow。
- 复杂任务：询问是否可以创建 DevFlow 任务并进入规划。如果用户不同意，不要做大范围 inline 实现；改为解释、澄清范围，或建议拆成更小的任务。
- 用户批准创建任务并不等于批准开始实现。仍然必须先完成规划。

### 规划产物
在 start review 前收敛 `prd.md`：移除临时 brainstorm 标题，合并 discovery notes，并清理占位 bullet。

- `prd.md`：需求、约束和验收标准。不要把技术设计或执行清单放在这里。
- `design.md`：复杂任务的技术设计，包括边界、契约、数据流、取舍、兼容性、发布/回滚形态。
- `implement.md`：复杂任务的执行计划，包括有序清单、验证命令、评审门和回滚点。
- `implement.jsonl` / `check.jsonl`：子代理上下文使用的 spec 和 research 清单。它们不能替代 `implement.md`。
- 轻量任务可以只有 PRD。复杂任务必须在 `task.py start` 前具备 `prd.md`、`design.md` 和 `implement.md`。
- `task.py start` 会执行 start gate：`prd.md` 必须存在且不能仍是生成的 `TBD` 占位内容。复杂任务设置 `task.json.meta.complex: true`；需要 sub-agent manifest 上下文的任务设置 `task.json.meta.requires_subagent_context: true` 并整理真实 JSONL 条目。

### 父子任务树

当一个用户请求包含多个可独立验证的交付物时，使用父任务。父任务负责源需求集、任务地图、跨子任务验收标准和最终集成评审；除非父任务本身也有直接工作，否则通常不应作为实现目标。

对子交付物使用子任务；子任务应能独立规划、实现、检查和归档。父子结构不是依赖系统：如果某个子任务必须等待另一个子任务，请把顺序写进子任务的 `prd.md` / `implement.md`，并保持每个子任务的验收标准可测试。

用 `task.py create "<title>" --slug <name> --parent <parent-dir>` 创建新的子任务。
用 `task.py add-subtask <parent> <child>` 关联已有任务，用 `task.py remove-subtask <parent> <child>` 解除错误关联。

<!-- 每回合面包屑：无活动任务时显示（Phase 1 之前） -->

[workflow-state:no_task]
没有活动任务。先分类当前回合；创建任何 DevFlow 任务前，必须先请求任务创建许可。
简单对话 / 小任务：只询问本回合是否应创建 DevFlow 任务。如果用户说不创建，本会话跳过 DevFlow。
复杂任务：询问用户是否可以创建 DevFlow 任务并进入规划阶段。如果用户说不可以，解释情况、澄清范围，或建议拆成更小的任务。
[/workflow-state:no_task]

### Phase 1: Plan
- 1.0 创建任务 `[required · once]`（仅在取得任务创建许可后）
- 1.1 需求探索 `[required · repeatable]`（`prd.md`；复杂任务还需要 `design.md` + `implement.md`）
- 1.2 研究 `[optional · repeatable]`
- 1.3 配置上下文 `[conditional · once]` — Claude Code、Cursor、OpenCode、Codex、Kiro、Gemini、Qoder、CodeBuddy、Copilot、Droid、Pi
- 1.4 激活任务 `[required · once]`（评审门之后运行 `task.py start`；状态 → in_progress）
- 1.5 完成标准

<!-- 每回合面包屑：整个 Phase 1 显示（status='planning'） -->

[workflow-state:planning]
在 start review 前收敛 `prd.md`：移除临时 brainstorm 标题，合并 discovery notes，并清理占位 bullet。
加载 `devflow-brainstorm`；保持在规划阶段。
轻量任务：`prd.md` 可以足够。复杂任务：完成 `prd.md`、`design.md` 和 `implement.md`，并设置 `task.json.meta.complex: true`；在 `task.py start` 前请求评审。
多交付物范围：考虑使用一个父任务加多个可独立验证的子任务；依赖关系必须写入子任务产物，不能由树结构暗示。
子代理模式：如果 Phase 2 需要 manifest 上下文，设置 `task.json.meta.requires_subagent_context: true`，并在启动前把真实 spec/research/knowledge 条目整理到 `implement.jsonl` / `check.jsonl`。
[/workflow-state:planning]

<!-- 每回合面包屑：codex.dispatch_mode=inline 时在整个 Phase 1 显示。
     这是 Codex 专用的 [workflow-state:planning] 可选替代。主代理会在 Phase 2
     直接编辑代码，因此跳过 jsonl 整理；inline 工作流加载 `devflow-before-dev`，
     而不是把 JSONL 注入子代理。 -->

[workflow-state:planning-inline]
在 start review 前收敛 `prd.md`：移除临时 brainstorm 标题，合并 discovery notes，并清理占位 bullet。
加载 `devflow-brainstorm`；保持在规划阶段。
轻量任务：`prd.md` 可以足够。复杂任务：完成 `prd.md`、`design.md` 和 `implement.md`，并设置 `task.json.meta.complex: true`；在 `task.py start` 前请求评审。
多交付物范围：考虑使用一个父任务加多个可独立验证的子任务；依赖关系必须写入子任务产物，不能由树结构暗示。
Inline 模式：保持 `task.json.meta.requires_subagent_context` 未设置，跳过 jsonl 整理；Phase 2 通过 `devflow-before-dev` 读取产物和 specs。
[/workflow-state:planning-inline]

### Phase 2: Execute
- 2.1 实现 `[required · repeatable]`
- 2.2 质量检查 `[required · repeatable]`
- 2.3 回滚 `[on demand]`

<!-- 每回合面包屑：status='in_progress' 时显示。
     范围：整个 Phase 2 + Phase 3.1-3.4（从 task.py start 到 task.py archive 前，
     status 都保持 'in_progress'；只有 archive 会翻转它）。因此块体必须覆盖从实现到提交的
     每个必需步骤，包括 Phase 3.3 spec update 和 Phase 3.4 commit。 -->

子代理派发协议适用于所有平台和所有子代理，包括 class-2 Codex/Copilot/Gemini/Qoder 以及 `devflow-research`：
每个派发提示都必须先以 `Active task: <task path from task.py current>` 开头，然后再写角色专属指令。

[workflow-state:in_progress]
工具：`devflow-implement` / `devflow-research` 只是子代理类型（Task/Agent tool，不是 Skill；没有同名 skill）。
`devflow-update-spec` 是 skill。`devflow-check` 两种形态都存在；代码变更后的验证优先使用 Agent 形态。
流程：`devflow-implement` -> `devflow-check` -> `devflow-update-spec` -> commit（Phase 3.4）-> `/devflow:finish-work`。
主会话默认：派发 implement/check 子代理。子代理自豁免：如果已经作为 `devflow-implement` 运行，不要再 spawn 另一个 `devflow-implement` 或 `devflow-check`；
如果已经作为 `devflow-check` 运行，不要再 spawn 另一个 `devflow-check` 或 `devflow-implement`。只有主会话可以派发。
派发提示以 `Active task: <task path from task.py current>` 开头。读取上下文顺序：jsonl 条目 -> `prd.md` -> `design.md if present` -> `implement.md if present`。
[/workflow-state:in_progress]

<!-- 每回合面包屑：codex.dispatch_mode=inline 且 status='in_progress' 时显示。
     这是 Codex 专用的 [workflow-state:in_progress] 可选替代。主会话会直接编辑代码，
     而不是派发子代理。 -->

[workflow-state:in_progress-inline]
流程：`devflow-before-dev` -> 编辑 -> `devflow-check` -> 验证 -> `devflow-update-spec` -> commit（Phase 3.4）-> `/devflow:finish-work`。
Inline 模式不要派发 implement/check 子代理。
读取上下文：`prd.md` -> `design.md if present` -> `implement.md if present`，再加上由 skills 加载的相关 spec/research。
[/workflow-state:in_progress-inline]

### Phase 3: Finish
- 3.1 质量验证 `[required · repeatable]`
- 3.2 调试复盘 `[on demand]`
- 3.3 更新 spec `[required · once]`
- 3.4 提交变更 `[required · once]`
- 3.5 收尾提醒

<!-- 每回合面包屑：status='completed' 时显示。
     当前在正常流程中不会触发：cmd_archive 在同一次调用中写入 status='completed'
     并把任务目录移动到 archive/，所以 active-task resolver 会丢失指针，hook 永远不会在
     已归档任务上触发。保留该块供未来状态转换重设计使用（例如显式
     in_progress→completed 命令）。和 live blocks 通过同一个 spec 通道编辑。 -->

[workflow-state:completed]
代码已提交。运行 `/devflow:finish-work`；如果工作区仍有脏文件，先回到 Phase 3.4。
[/workflow-state:completed]

### 规则

1. 先判断当前处于哪个 Phase，然后从该 Phase 的下一步继续。
2. 每个 Phase 内按顺序执行步骤；`[required]` 步骤不能跳过。
3. Phase 可以回滚（例如 Execute 发现 prd 缺陷 → 回到 Plan 修复，再重新进入 Execute）。
4. 标记为 `[once]` 的步骤，如果输出已经存在，就跳过；不要重复运行。
5. 产物是否存在会决定下一步；轻量任务缺少 `design.md` / `implement.md` 是有效的，复杂任务缺少它们则表示规划未完成。

### 活动任务路由

当用户请求在活动任务中匹配以下意图时，先路由；需要时再加载详细 phase 步骤。

[Claude Code, Cursor, OpenCode, codex-sub-agent, Kiro, Gemini, Qoder, CodeBuddy, Copilot, Droid, Pi]

- 规划或需求不清 -> `devflow-brainstorm`。
- `in_progress` 实现/检查 -> 派发 `devflow-implement` / `devflow-check`。
- 反复调试 -> `devflow-break-loop`；spec 更新 -> `devflow-update-spec`。

[/Claude Code, Cursor, OpenCode, codex-sub-agent, Kiro, Gemini, Qoder, CodeBuddy, Copilot, Droid, Pi]

[codex-inline, Kilo, Antigravity, Windsurf]

- 规划或需求不清 -> `devflow-brainstorm`。
- 编辑前 -> `devflow-before-dev`；编辑后 -> `devflow-check`。
- 反复调试 -> `devflow-break-loop`；spec 更新 -> `devflow-update-spec`。

[/codex-inline, Kilo, Antigravity, Windsurf]

### 护栏

- 批准创建任务不等于批准实现；实现必须等产物评审后运行 `task.py start`。
- 轻量任务可以只有 PRD；复杂任务需要 `design.md` + `implement.md`。
- 规划必须持久化到任务产物；报告完成前必须运行检查。

### 加载步骤详情

每个步骤中，运行下面的命令获取详细指南：

```bash
python3 ./.devflow/scripts/get_context.py --mode phase --step <step>
# 例如：python3 ./.devflow/scripts/get_context.py --mode phase --step 1.1
```

---

## Phase 1: Plan

目标：分类请求，在需要任务时取得任务创建许可，并产出实现前所需的规划产物。

#### 1.0 创建任务 `[required · once]`

仅在取得任务创建许可后创建任务目录。该命令会把状态设为 `planning`，写入 `task.json`，创建默认 `prd.md`，并在存在会话身份时自动把新任务设为目标：

```bash
python3 ./.devflow/scripts/task.py create "<task title>" --slug <name>
```

`--slug` 只填写人类可读名称。**不要**包含 `MM-DD-` 日期前缀；`task.py create` 会自动添加该前缀。

对于任务树，先创建父任务，再用 `--parent <parent-dir>` 创建每个子任务。不要因为存在子任务就启动父任务；应启动拥有下一个可独立验证交付物的子任务。

该命令成功后，每回合面包屑会自动切换到 `[workflow-state:planning]`，提示 AI 保持在规划阶段。

这里只运行 `create`，不要同时运行 `start`。`start` 会把状态切到 `in_progress`，导致规划产物评审前面包屑就进入实现阶段。把 `start` 留到步骤 1.4。

如果 `python3 ./.devflow/scripts/task.py current --source` 已经指向一个任务，则跳过。

#### 1.1 需求探索 `[required · repeatable]`
在请求 start review 前，先把 `prd.md` 收敛为最终需求和验收标准，移除临时 brainstorm 标题和占位 bullet。

加载 `devflow-brainstorm` skill，并按该 skill 的指导与用户交互式探索需求。

brainstorm skill 会指导你：
- 一次只问一个问题。
- 能通过研究回答的，不要问用户。
- 优先提供选项，而不是问开放式问题。
- 每次用户回答后立即更新 `prd.md`。
- 当交付物可独立验证时，把大范围拆成父任务加子任务。
- 让 `prd.md` 聚焦需求和验收标准。
- 对复杂任务，在实现开始前产出 `design.md` 和 `implement.md`。

考虑父子拆分时：
- 当一个请求包含多个可独立验证的交付物时，使用父任务。
- 父任务负责源需求、子任务映射、跨子任务验收标准和最终集成评审。
- 子任务负责能独立规划、实现、检查和归档的实际交付物。
- 父子结构不是依赖系统。如果子任务 B 依赖子任务 A，请把顺序写入子任务的 `prd.md` / `implement.md`。
- 启动拥有下一个交付物的子任务。除非父任务本身有直接实现工作，否则不要启动父任务。

每当需求变化时，回到此步骤并修订相关产物。

#### 1.2 研究 `[optional · repeatable]`

研究可以在需求探索期间随时发生。它不限于本地代码；你可以使用任何可用工具（MCP server、skill、web search 等）查找外部信息，包括第三方库文档、行业实践、API reference 等。

[Claude Code, Cursor, OpenCode, codex-sub-agent, Kiro, Gemini, Qoder, CodeBuddy, Copilot, Droid, Pi]

派发 research 子代理：

- **Agent type**: `devflow-research`
- **Task description**: Research <specific question>
- **关键要求**：研究输出必须持久化到 `{TASK_DIR}/research/`

[/Claude Code, Cursor, OpenCode, codex-sub-agent, Kiro, Gemini, Qoder, CodeBuddy, Copilot, Droid, Pi]

[codex-inline, Kilo, Antigravity, Windsurf]

在主会话中直接研究，并把发现写入 `{TASK_DIR}/research/`。（对 `codex-inline` 而言，这可以避开 `fork_turns="none"` 隔离导致 `devflow-research` 子代理无法解析活动任务路径的问题。）

[/codex-inline, Kilo, Antigravity, Windsurf]

**研究产物约定**：
- 每个研究主题一个文件（例如 `research/auth-library-comparison.md`）。
- 在文件中记录第三方库用法示例、API reference、版本约束。
- 记录你发现的相关 spec 文件路径，供后续引用。

Brainstorm 和研究可以自由交错：可以暂停去研究技术问题，然后回到与用户讨论。

**关键原则**：研究输出必须写入文件，不能只留在聊天中。对话会被压缩，文件不会。

#### 1.3 配置上下文 `[required · once]`

[Claude Code, Cursor, OpenCode, codex-sub-agent, Kiro, Gemini, Qoder, CodeBuddy, Copilot, Droid, Pi]

整理 `implement.jsonl` 和 `check.jsonl`，让 Phase 2 子代理拿到正确的 spec/research 上下文。这些文件在 `task create` 时会带一个自描述 `_example` 种子行；这里的工作是填入真实条目。

**位置**：`{TASK_DIR}/implement.jsonl` 和 `{TASK_DIR}/check.jsonl`（已经存在）。

**格式**：每行一个 JSON 对象。支持的上下文条目：

```jsonl
{"file": "<repo-relative path>", "reason": "<why>"}
{"file": "<repo-relative dir>/", "type": "directory", "reason": "<why>"}
{"knowledge": "<entry-id>", "type": "knowledge", "reason": "<why>"}
```

`file` 路径相对于 repo root。`knowledge` id 是可通过 `python3 ./.devflow/scripts/knowledge.py search` 搜索的结构化条目，包括 `.devflow/spec/wiki/` 下的 wiki 条目和 `.devflow/spec/guides/learnings.md` 下的经验。

**应放入**：
- **Spec 文件**：`.devflow/spec/<package>/<layer>/index.md` 以及与本任务相关的具体指南文件（`error-handling.md`、`conventions.md` 等）。
- **Research 文件**：子代理需要参考的 `{TASK_DIR}/research/*.md`。
- **Knowledge 条目**：应注入但不需要加载整个 markdown 文件的可复用经验、wiki notes、knowhow references 或 spec entries。

**不应放入**：
- 代码文件（`src/**`、`packages/**/*.ts` 等）：这些由子代理在实现期间读取，不在这里预注册。
- 你即将修改的文件：原因相同。

**两个文件的分工**：
- `implement.jsonl` → implement 子代理正确写代码所需的 specs + research。
- `check.jsonl` → check 子代理所需的 specs（质量指南、检查约定，必要时同样包含 research）。

这些清单不能替代 `implement.md`。`implement.md` 是复杂任务的人类可读执行计划；jsonl 文件只列出要注入或加载的上下文文件/knowledge 条目。

**如何发现相关 specs**：

```bash
python3 ./.devflow/scripts/get_context.py --mode packages
python3 ./.devflow/scripts/knowledge.py search "<query>"
python3 ./.devflow/scripts/knowledge.py load <id>
```

上下文脚本会列出每个 package 及其 spec layers 和路径。`knowledge.py search` 会查找聚焦的结构化条目；`knowledge.py load` 会在你把 id 加入 JSONL 前显示确切内容。

**如何追加条目**：

可以直接在编辑器中修改 jsonl 文件，也可以使用：

```bash
python3 ./.devflow/scripts/task.py add-context "$TASK_DIR" implement "<path>" "<reason>"
python3 ./.devflow/scripts/task.py add-context "$TASK_DIR" check "<path>" "<reason>"
python3 ./.devflow/scripts/task.py add-context "$TASK_DIR" implement "knowledge:<id>" "<reason>"
python3 ./.devflow/scripts/task.py add-context "$TASK_DIR" check "wiki:<id>" "<reason>"
```

真实条目存在后可以删除 `_example` 种子行（可选；消费者会自动跳过它）。

跳过条件：`implement.jsonl` 和 `check.jsonl` 已经有代理整理过的条目（只有种子行不算）。

[/Claude Code, Cursor, OpenCode, codex-sub-agent, Kiro, Gemini, Qoder, CodeBuddy, Copilot, Droid, Pi]

[codex-inline, Kilo, Antigravity, Windsurf]

跳过此步骤。Phase 2 中由 `devflow-before-dev` skill 直接加载上下文。

[/codex-inline, Kilo, Antigravity, Windsurf]

#### 1.4 激活任务 `[required · once]`

产物评审后，把任务状态切换为 `in_progress`：

```bash
python3 ./.devflow/scripts/task.py start <task-dir>
```

对轻量任务，`prd.md` 可以足够，但它不能仍包含生成的 `TBD` 占位内容。对复杂任务，启动前必须存在并评审 `prd.md`、`design.md` 和 `implement.md`，并且任务必须声明 `task.json.meta.complex: true`。对子代理任务，如果需要 manifest 上下文，声明 `task.json.meta.requires_subagent_context: true` 并整理真实 `implement.jsonl` / `check.jsonl` 条目；只有该 metadata 标记为 true 时，`task.py start` 才会阻止 seed-only manifest。Codex inline 任务保持该标记未设置，并通过 `devflow-before-dev` 加载上下文。

该命令成功后，面包屑会自动切换为 `[workflow-state:in_progress]`，随后执行 Phase 2 / 3 的其余步骤。

如果 `task.py start` 报出 start-gate 校验错误，回到 Phase 1 修复产物或 metadata。只有在有意绕过且能解释为什么任务仍应进入实现时，才使用 `--force`。

如果 `task.py start` 报出会话身份错误（hook 输入、`DEVFLOW_CONTEXT_ID` 或平台原生 session env 都没有 context key），按错误提示设置会话身份后重试。

#### 1.5 完成标准

| 条件 | 必需 |
|------|:---:|
| `prd.md` 存在 | ✅ |
| 用户确认任务应进入实现 | ✅ |
| 已运行 `task.py start`（status = in_progress） | ✅ |
| `research/` 有产物（复杂任务） | 建议 |
| `design.md` 存在（复杂任务） | ✅ |
| `implement.md` 存在（复杂任务） | ✅ |
| `task.json.meta.complex: true`（复杂任务） | ✅ |

[Claude Code, Cursor, OpenCode, codex-sub-agent, Kiro, Gemini, Qoder, CodeBuddy, Copilot, Droid, Pi]

| 需要 sub-agent manifest 上下文时，`task.json.meta.requires_subagent_context: true` 加已整理的 `implement.jsonl` / `check.jsonl` | ✅ |

[/Claude Code, Cursor, OpenCode, codex-sub-agent, Kiro, Gemini, Qoder, CodeBuddy, Copilot, Droid, Pi]

---

## Phase 2: Execute

目标：把已评审的规划产物转化为能通过质量检查的代码。

#### 2.1 实现 `[required · repeatable]`

[Claude Code, Cursor, OpenCode, Gemini, Qoder, CodeBuddy, Copilot, Droid, Pi]

派发 implement 子代理：

- **Agent type**: `devflow-implement`
- **Task description**: Implement the reviewed task artifacts, consulting materials under `{TASK_DIR}/research/`; finish by running project lint and type-check
- **派发提示护栏**：告诉被派发的 agent 它已经是 `devflow-implement` 子代理，必须直接实现，不要再 spawn 另一个 `devflow-implement` / `devflow-check`。

平台 hook/plugin 会自动处理：
- 读取 `implement.jsonl`，并把引用的 spec/research 文件和 knowledge 条目注入 agent prompt。
- 注入 `prd.md`、存在的 `design.md` 和存在的 `implement.md`。

[/Claude Code, Cursor, OpenCode, Gemini, Qoder, CodeBuddy, Copilot, Droid, Pi]

[codex-sub-agent]

派发 implement 子代理：

- **Agent type**: `devflow-implement`
- **Task description**: Implement the reviewed task artifacts, consulting materials under `{TASK_DIR}/research/`; finish by running project lint and type-check
- **派发提示护栏**：prompt 必须以 `Active task: <task path>` 开头，然后明确说明被派发的 agent 已经是 `devflow-implement`，必须直接实现，不要再 spawn 另一个 `devflow-implement` / `devflow-check`。

Codex 子代理定义会自动处理上下文加载要求：
- 通过 `task.py current --source` 解析活动任务，然后读取 `prd.md`、存在的 `design.md` 和存在的 `implement.md`。
- 读取 `implement.jsonl`，并要求 agent 在编码前加载每个被引用的 spec/research 文件或 knowledge 条目。

[/codex-sub-agent]

[Kiro]

派发 implement 子代理：

- **Agent type**: `devflow-implement`
- **Task description**: Implement the reviewed task artifacts, consulting materials under `{TASK_DIR}/research/`; finish by running project lint and type-check
- **派发提示护栏**：告诉被派发的 agent 它已经是 `devflow-implement` 子代理，必须直接实现，不要再 spawn 另一个 `devflow-implement` / `devflow-check`。

平台 prelude 会自动处理上下文加载要求：
- 读取 `implement.jsonl`，并把引用的 spec/research 文件和 knowledge 条目注入 agent prompt。
- 注入 `prd.md`、存在的 `design.md` 和存在的 `implement.md`。

[/Kiro]

[codex-inline, Kilo, Antigravity, Windsurf]

1. 加载 `devflow-before-dev` skill 读取项目指南。
2. 读取 `{TASK_DIR}/prd.md`，然后读取存在的 `design.md` 和存在的 `implement.md`。
3. 查阅 `{TASK_DIR}/research/` 下的材料。
4. 按已评审产物实现代码。
5. 运行项目 lint 和 type-check。

[/codex-inline, Kilo, Antigravity, Windsurf]

#### 2.2 质量检查 `[required · repeatable]`

[Claude Code, Cursor, OpenCode, codex-sub-agent, Kiro, Gemini, Qoder, CodeBuddy, Copilot, Droid, Pi]

派发 check 子代理：

- **Agent type**: `devflow-check`
- **Task description**: Review all code changes against specs and task artifacts; fix any findings directly; ensure lint and type-check pass
- **派发提示护栏**：告诉被派发的 agent 它已经是 `devflow-check` 子代理，必须直接 review/fix，不要再 spawn 另一个 `devflow-check` / `devflow-implement`。

check agent 的职责：
- 根据 specs review 代码变更。
- 根据 `prd.md`、存在的 `design.md` 和存在的 `implement.md` review 代码变更。
- 自动修复发现的问题。
- 运行 lint 和 typecheck 验证。

[/Claude Code, Cursor, OpenCode, codex-sub-agent, Kiro, Gemini, Qoder, CodeBuddy, Copilot, Droid, Pi]

[codex-inline, Kilo, Antigravity, Windsurf]

加载 `devflow-check` skill，并按其指导验证代码：
- Spec 合规。
- lint / type-check / tests。
- 跨层一致性（当变更跨越多个层时）。

如果发现问题 → 修复 → 重新检查，直到通过。

[/codex-inline, Kilo, Antigravity, Windsurf]

#### 2.3 回滚 `[on demand]`

- `check` 暴露 prd 缺陷 → 回到 Phase 1，修复 `prd.md`，然后重做 2.1。
- 实现方向错误 → 回滚代码，重做 2.1。
- 需要更多研究 → 研究（同 Phase 1.2），把发现写入 `research/`。

---

## Phase 3: Finish

目标：确保代码质量，沉淀经验，记录工作。

#### 3.1 质量验证 `[required · repeatable]`

加载 `devflow-check` skill 并进行最终验证：
- Spec 合规。
- lint / type-check / tests。
- 跨层一致性（当变更跨越多个层时）。

如果发现问题 → 修复 → 重新检查，直到通过。

#### 3.2 调试复盘 `[on demand]`

如果本任务涉及反复调试（同一个问题被修复多次），加载 `devflow-break-loop` skill：
- 分类根因。
- 解释之前的修复为什么失败。
- 提出预防措施。

目标是沉淀调试经验，避免同类问题再次发生。

#### 3.3 更新 spec `[required · once]`

加载 `devflow-update-spec` skill，并判断本任务是否产生值得记录的新知识：
- 新发现的模式或约定。
- 遇到的坑。
- 新的技术决策。

据此更新 `.devflow/spec/` 下的文档。即使结论是“无需更新”，也要走完判断过程。

#### 3.4 提交变更 `[required · once]`

AI 驱动本任务代码变更的批量提交，以便之后 `/finish-work` 能干净运行。目标：先产生工作提交，再产生 bookkeeping（archive + journal）提交；不要交错。

**步骤**：

1. **检查脏状态**：
   ```bash
   git status --porcelain
   ```
   快照每个脏路径。如果工作区干净，跳到 3.5。

2. **从最近历史学习 commit 风格**（让草拟消息风格一致）：
   ```bash
   git log --oneline -5
   ```
   注意前缀约定（`feat:` / `fix:` / `chore:` / `docs:` ...）、语言（中文/English）和长度风格。

3. **把脏文件分成两组**：
   - **本会话 AI 编辑**：你在本会话中通过 Edit/Write/Bash 工具调用写入/编辑过的文件。你知道改了什么以及原因。
   - **未识别**：本会话中你没有触碰过的脏文件（可能是用户手动编辑、上次会话遗留 WIP 或无关工作）。不要静默纳入。

4. **草拟提交计划**。把 AI 编辑的文件按逻辑提交分组（每个内聚变更单元一个 commit，不是每个文件一个 commit）。每项包含：`<commit message>` + 文件列表。把未识别文件单独列在底部。

5. **只展示一次计划，并请求一次性确认**。格式：
   ```
   Proposed commits (in order):
     1. <message>
        - <file>
        - <file>
     2. <message>
        - <file>

   Unrecognized dirty files (NOT in any commit — confirm include/exclude):
     - <file>
     - <file>

   Reply 'ok' / '行' to execute. Reply with edits, or '我自己来' / 'manual' to abort.
   ```

6. **确认后**：按顺序对每批运行 `git add <files>` + `git commit -m "<msg>"`。不要 amend。不要 push。

7. **被拒绝时**（用户回复“不行” / “我自己来” / “manual” / 对计划有任何反对）：停止。不要尝试第二版计划。用户将手动提交；用户确认后再跳到 3.5。

**规则**：
- 任何地方都不要 `git commit --amend`：三阶段三提交流（工作提交 → archive commit → journal commit）。
- 此步骤绝不 push 到远端。
- 如果用户只想调整消息措辞但接受文件分组，修改消息并再确认一次；如果用户拒绝分组，退出到手动模式。
- 批量计划只提示一次；不要每个 commit 都提示一次。

#### 3.5 收尾提醒

完成上述步骤后，提醒用户可以运行 `/finish-work` 收尾（归档任务、记录会话）。

---

## 自定义 DevFlow（供 fork 使用）

本节面向想修改 DevFlow 工作流本身的开发者。所有自定义都通过编辑此文件完成；脚本只负责解析。

### 更改步骤含义

编辑上方 Phase 1 / 2 / 3 章节中对应步骤的 walkthrough 正文。关键不变量：
- 无活动任务时必须先分流，并在创建 DevFlow 任务前请求任务创建许可。
- 规划必须区分轻量 PRD-only 任务和启动前需要 `prd.md`、`design.md`、`implement.md` 的复杂任务。
- 每条必需执行路径都必须保证在 `/devflow:finish-work` 前能到达 Phase 3.4 commit 提醒。

所有标签块都位于上方 `## Phase Index` 章节中，紧跟在各 phase 摘要之后：

| 范围 | 对应标签 |
|---|---|
| 无活动任务（Phase 1 之前） | `[workflow-state:no_task]`（Phase Index ASCII 图之后） |
| 整个 Phase 1（任务已创建 → 可进入实现） | `[workflow-state:planning]`（Phase 1 摘要之后） |
| Codex inline Phase 1 | `[workflow-state:planning-inline]` |
| Phase 2 + Phase 3.1-3.4（实现 + 检查 + 收尾） | `[workflow-state:in_progress]`（Phase 2 摘要之后） |
| Codex inline Phase 2 + Phase 3.1-3.4 | `[workflow-state:in_progress-inline]` |
| Phase 3.5 之后（已归档） | `[workflow-state:completed]`（Phase 3 摘要之后；**当前不会触发**） |

### 更改每回合提示文本

直接编辑对应 `[workflow-state:STATUS]` 块的正文。编辑后，运行 `devflow update`（如果你是模板维护者），或重启 AI 会话（如果你是在自定义自己的项目）；不需要修改脚本。

### 添加自定义状态

添加新块：

```
[workflow-state:my-status]
你的每回合提示文本
[/workflow-state:my-status]
```

约束：
- STATUS 字符集：`[A-Za-z0-9_-]+`（允许下划线和连字符，例如 `in-review`、`blocked-by-team`）。
- 必须有生命周期 hook 把 `task.json.status` 写成你的自定义值，否则该标签永远不会被读取。
- 生命周期 hooks 位于 `task.json.hooks.after_*`，并绑定到 `after_create / after_start / after_finish / after_archive` 之一。

### 添加生命周期 hook

在 `task.json` 中添加 `hooks` 字段：

```json
{
  "hooks": {
    "after_finish": [
      "your-script-or-command-here"
    ]
  }
}
```

支持的事件：`after_create / after_start / after_finish / after_archive`。注意 `after_finish` 不等于状态变化（它只清除活动任务指针）；如需“任务已完成”通知，请使用 `after_archive`。

### 完整契约

关于工作流状态机的运行时契约、所有状态写入点位置、伪状态（`no_task` / `stale_<source_type>`）、hook 可达性矩阵以及其他深入细节，请参阅：

- `.devflow/spec/cli/backend/workflow-state-contract.md`：运行时契约 + writer 表 + 测试不变量。
- `.devflow/scripts/inject-workflow-state.py`：实际解析器（只读取 workflow.md，没有内置文本）。
