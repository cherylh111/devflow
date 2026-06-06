# 外部 Skills 与任务进度状态研究

## 已检查来源

- `https://github.com/mattpocock/skills`
- `https://github.com/mindfold-ai/Trellis/issues/326`
- `https://github.com/rpamis/comet`
- 本地检查用临时 clone：
  - `%TEMP%/devflow-external-research/mattpocock-skills`
  - `%TEMP%/devflow-external-research/rpamis-comet`

## Matt Pocock Skills

### 有价值的想法

- 小而可组合的 skills。该仓库将 skills 设计为聚焦的工程实践，而不是接管整个开发流程的大型系统。
- 渐进式披露。主 `SKILL.md` 保持聚焦，较深的参考资料拆到相邻文件中按需读取。
- 强触发描述。`write-a-skill` 将 description 视为 agent 加载 skill 前看到的主要路由信号。
- 领域语言与 ADR 捕获。`grill-with-docs` 会用 `CONTEXT.md` 挑战模糊术语，并且只在决策难以逆转、缺少上下文会令人意外、且确实存在取舍时创建 ADR。
- setup 文档区分硬依赖与软依赖。关于 setup pointer 的 ADR 将“没有 issue tracker 配置就不能工作”的 skills，与“有领域文档会更好但缺少也能工作”的 skills 分开。
- debugging 与 TDD skills 强调反馈循环、通过公共接口验证行为，以及一次只推进一个垂直切片。
- handoff skill 会把紧凑的延续上下文保存到聊天之外，同时避免复制已经持久化的产物。

### 与 DevFlow 的匹配度

- DevFlow 已经有可组合 skills、任务产物、package/layer specs 和结构化知识。最大的缺口不是“更多 skills”，而是更紧凑的恢复机制和更低 token 成本的 continue。
- `grill-with-docs` 的思路与 DevFlow 现有 `devflow-brainstorm` 和 `devflow-update-spec` 匹配：已确认的术语和令人意外的决策，可以在没有独立 glossary/ADR 系统时沉淀到 `.devflow/spec/wiki/` 或 package specs。
- `diagnose` 的反馈循环纪律可以在未来成为 `devflow-diagnose` skill，也可以被并入 `devflow-break-loop`，用于 bug fix 前的诊断。它有价值，但不是 Trellis #326 的最直接答案。
- `write-a-skill` 的结构与当前系统 skill 指导大体一致。DevFlow 仍可以改进：让 skill 入口更短，并将长参考资料下沉到一层引用文件。

## Trellis Issue 326

### 问题

该 issue 请求在 workflow 中增加 task 进度状态文件，使 continue 能更快恢复，尤其适用于复杂任务。其直接收益是减少恢复时重读完整 spec 的需要，从而节省 token。

### 灵感来源

该 issue 指向 `rpamis/comet`。Comet 相关机制是脚本支撑的 `.comet.yaml` 状态文件，以及能输出结构化恢复上下文的 recovery 命令。

## Comet

### 相关机制

- `.comet.yaml` 存储 workflow 字段，例如 phase、build mode、pause point、verification result、report path、archive status 和关联产物路径。
- `comet-state.sh` 是状态读写的唯一接口，会校验字段名和枚举值。
- `comet-state.sh check <change> <phase> --recover` 会输出紧凑恢复上下文，包括 phase、产物状态、任务计数和推荐恢复动作。
- build skill 明确要求幂等。恢复时读取 state、plan base ref 和 task progress，然后从第一个未完成任务继续。
- 阶段 guard 会在状态流转前检查前置条件。验证阶段要求证据，而不是只接受 agent 声称“已通过”。
- status 命令会列出 active changes、任务进度和下一条推荐命令。

### 与 DevFlow 的匹配度

- recovery-context 概念可以直接适配 DevFlow。
- 状态文件思路应改造为 JSON + Python，而不是照搬 Bash/YAML。DevFlow 脚本层是跨平台 Python，并且已经用 JSON 管理 `task.json`。
- Comet 的完整五阶段 OpenSpec/Superpowers 流程对 DevFlow 来说过重。DevFlow 已有自己的任务生命周期，不应再导入另一套 lifecycle。

## 本地 DevFlow 对照

### 现有优势

- 每个任务都有 `task.json`、`prd.md`、可选 `design.md`、可选 `implement.md`、可选 `research/` 和 JSONL manifests。
- `task.py start` 已经执行规划 start gate，并写入 `task.json.status`。
- active task 通过 `.devflow/.runtime/sessions/` 做 session 级跟踪。
- `devflow-continue` 已经能根据 status 和产物存在情况进行路由。
- workflow breadcrumbs 由 `task.json.status` 和 `.devflow/workflow.md` 中的 managed blocks 驱动。

### 缺口

- 没有任务内 progress 文件来记录当前 workflow step、resume hint、已完成实现项、上次验证命令或上次 agent 写入。
- `devflow-continue` 必须从较大的产物和 status 中推断进度，而不是读取紧凑恢复上下文。
- `implement.md` 目前不是机器解析的完成状态来源。Agent 可能更新它，也可能忽略它。
- Phase 2/3 的进展主要存在于对话中，除非 commit、journal 或最终 archive 捕获了它。

## 关于 Issue Tracker Setup 与 DevFlow Task 的讨论结论

### 可借鉴但不应整体搬入

mattpocock 的 issue tracker setup 体系主要解决的是“agent 如何知道 issue 在哪里、标签语义是什么、领域文档在哪里”。DevFlow 已经把 `.devflow/tasks/` 作为本地一等任务系统，因此不应把外部 issue tracker setup 变成核心前置条件。

更适合吸收的是其中的任务入口和 readiness 思路：

- 在创建或拆分任务前，对任务进行 intake：这是 bug、enhancement、research 还是 workflow change。
- 区分任务是否 `needs-info`、是否 `ready-for-agent`、是否需要人工判断。
- 将这些分流信息放入 `task.json.meta`，而不是扩展 `task.json.status`。原因是 `status` 已经驱动 DevFlow breadcrumb，随意增加状态会影响工作流路由。
- 借鉴 ready-for-agent brief 的结构，强化 DevFlow 子任务产物：目标、验收标准、范围外、依赖顺序、完成后如何回到父任务。
- 借鉴 out-of-scope 记录，避免后续重复讨论已拒绝方案。DevFlow 可把这类信息写入任务 `research/` 或 `.devflow/spec/wiki/`。

### 当前父子任务管理方式

DevFlow 当前的父子任务是“可独立验证交付物”的组织结构，不是依赖图。

- 父任务用于一个用户请求包含多个可独立验证交付物的场景。
- 父任务拥有源需求、子任务地图、跨子任务验收标准和最终集成评审。
- 子任务拥有实际交付物，并独立完成规划、实现、检查和归档。
- 如果 child B 依赖 child A，依赖关系必须写进 child B 的 `prd.md` 或 `implement.md`，不能只靠树结构表达。
- 父任务通常不应直接进入实现，除非 parent 本身也有直接交付物；应启动拥有下一个可验证交付物的 child。

代码层通过 `task.json` 双向维护关系：

- 父任务的 `children` 保存子任务目录名列表。
- 子任务的 `parent` 保存父任务目录名。
- `task.py create ... --parent <parent-dir>` 会创建子任务并建立双向关系。
- `task.py add-subtask <parent> <child>` 和 `task.py remove-subtask <parent> <child>` 可对已有任务补充或移除关系。
- `task.py list` 只从顶层任务开始展示，并递归打印 children；子任务归档后从 active tasks 消失，会被父任务进度统计为完成。

### 是否需要用户主动触发拆分

用户不必主动说“请拆父子任务”，但当前 DevFlow 也不会自动拆分。

推荐流程是：

1. AI 在 planning 阶段识别请求是否包含多个可独立验证交付物。
2. 如果适合拆分，AI 输出父子任务拆分建议，包括 parent 职责、每个 child 的验收边界和依赖顺序。
3. 用户确认拆分方案。
4. AI 执行 `task.py create ... --parent ...` 或 `task.py add-subtask ...`。
5. 后续只启动当前要执行的 child，而不是默认启动 parent。

这意味着后续开发可借鉴 mattpocock 的 readiness/brief 思路，增强 DevFlow 的“拆分建议质量”和“子任务进入实现前的规格完整度”，但不需要引入外部 issue tracker 作为核心。

## 推荐吸收方案

### 立即吸收

1. 增加由 DevFlow 脚本管理的任务内 `progress.json` 文件。
2. 增加 `task.py progress` 子命令：
   - `init <task>` 创建或刷新 `progress.json`
   - `set <task> <field> <value>` 更新白名单字段
   - `recover <task>` 输出紧凑恢复上下文
   - `status [task] --json` 报告任务状态、进度、产物和下一步动作
3. 更新 `devflow-continue`，使其在存在恢复摘要时优先运行或读取该摘要。
4. 更新 workflow 指导，使长时间阶段在完成每个有意义的工作单元后写入进度。

### 后续改造后吸收

- 参考 `grill-with-docs`，通过 `devflow-brainstorm` 与 `devflow-update-spec` 增加 glossary/ADR 捕获路径。
- 参考 `diagnose` 增加 debugging feedback-loop skill。
- 当前 DevFlow skills 如果变得过宽，应收紧 skill description，并将长参考内容拆到单层引用文件。

### 不应整体照搬

- 不导入 Comet 的 OpenSpec/Superpowers lifecycle。
- 不新增 Bash 状态脚本；DevFlow 脚本层应继续使用 Python 和标准库。
- 不用 `progress.json` 替换 `task.json.status`。`task.json.status` 仍是 workflow breadcrumb 的事实来源，`progress.json` 只负责可恢复性细节。
- 不要求所有任务都使用复杂进度状态。轻量 PRD-only 任务应继续低成本运行。
