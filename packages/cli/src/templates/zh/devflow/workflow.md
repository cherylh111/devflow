# DevFlow 工作流

## 核心原则

1. **先计划，再编码**：先弄清楚要做什么，再开始实现。
2. **规范由系统注入，不靠记忆**：通过 hook、skill 和 `.devflow/spec/` 加载项目规则。
3. **重要信息写入文件**：research、决策和经验应进入任务目录或 spec；对话可能压缩，文件会保留。
4. **增量开发**：一次处理一个可验证任务。
5. **沉淀学习**：任务结束时判断是否需要更新 spec 或 knowledge。

## DevFlow 系统

`.devflow/` 是项目工作流目录：

- `.devflow/workflow.md`：当前文件，工作流源头
- `.devflow/config.yaml`：项目级配置
- `.devflow/spec/`：项目编码规范
- `.devflow/tasks/`：任务 PRD、设计、计划、研究和 jsonl context
- `.devflow/workspace/`：开发者 journal 和跨会话记忆

常用命令：

```bash
python3 ./.devflow/scripts/get_context.py
python3 ./.devflow/scripts/get_context.py --mode packages
python3 ./.devflow/scripts/get_context.py --mode phase --step <X.Y>
python3 ./.devflow/scripts/task.py current --source
```

## Phase Index

```
Phase 1: Plan    -> 分类请求，获得创建任务许可，写规划产物
Phase 2: Execute -> 只有任务进入 in_progress 后才实现
Phase 3: Finish  -> 验证，更新 spec，提交，并收尾
```

### Request Triage

- 简单对话或小任务：只询问本轮是否需要创建 DevFlow task。用户拒绝则本轮跳过 DevFlow。
- 复杂任务：询问是否可以创建 DevFlow task 并进入规划。用户拒绝则不要做大范围 inline 实现；澄清范围或建议拆小。
- 用户同意创建任务不等于同意开始实现；实现必须等待规划产物 review 和 `task.py start`。

### Planning Artifacts

- `prd.md`：需求、约束和验收标准。
- `design.md`：复杂任务的技术设计。
- `implement.md`：复杂任务的执行计划和验证计划。
- `implement.jsonl` / `check.jsonl`：sub-agent context 清单，不替代 `implement.md`。

### Parent / Child Task Trees

一个请求包含多个可独立验证交付物时，使用 parent task 持有总需求和集成验收；使用 child task 承载具体交付物。child 之间的依赖必须写入 child 的 `prd.md` / `implement.md`，不要只靠树结构表达。

[workflow-state:no_task]
当前没有活动任务。先判断本轮请求类型，并在创建任何 DevFlow task 前征求创建任务许可。
简单对话或小任务：只问本轮是否创建 DevFlow task；用户拒绝则跳过 DevFlow。
复杂任务：询问是否可以创建 DevFlow task 并进入规划；用户拒绝则澄清范围或建议拆小。
[/workflow-state:no_task]

### Phase 1: Plan

#### 1.0 Create task `[required · once]`

只在用户同意创建任务后运行：

```bash
python3 ./.devflow/scripts/task.py create "<task title>" --slug <name>
```

不要在本步骤运行 `start`。

#### 1.1 Requirement exploration `[required · repeatable]`

加载 `devflow-brainstorm`。一次问一个高价值问题，把需求写入 `prd.md`。复杂任务还要产出 `design.md` 和 `implement.md`。

#### 1.2 Research `[optional · repeatable]`

研究结论必须写入 `{TASK_DIR}/research/`，不能只留在对话里。

#### 1.3 Configure context `[conditional · once]`

需要 sub-agent 上下文时，整理 `implement.jsonl` 和 `check.jsonl`。条目可以是 repo-relative file、directory 或 `knowledge:<id>`。

#### 1.4 Activate task `[required · once]`

规划产物 review 通过后运行：

```bash
python3 ./.devflow/scripts/task.py start <task-dir>
```

状态变为 `in_progress` 后才能开始实现。

#### 1.5 Completion criteria

规划完成条件：任务产物存在、验收标准清楚、实现路径和验证命令明确。

[workflow-state:planning]
加载 `devflow-brainstorm`；保持在规划阶段。
轻量任务：`prd.md` 可以足够。复杂任务：完成 `prd.md`、`design.md` 和 `implement.md`；`task.py start` 前必须请求 review。
多交付范围：考虑 parent task + 可独立验证的 child tasks；依赖写入 child artifacts。
Sub-agent 模式：需要额外上下文时，在开始前整理 `implement.jsonl` 和 `check.jsonl`。
[/workflow-state:planning]

[workflow-state:planning-inline]
加载 `devflow-brainstorm`；保持在规划阶段。
轻量任务：`prd.md` 可以足够。复杂任务：完成 `prd.md`、`design.md` 和 `implement.md`；`task.py start` 前必须请求 review。
Inline 模式：跳过 jsonl 整理；Phase 2 通过 `devflow-before-dev` 读取产物和 spec。
[/workflow-state:planning-inline]

### Phase 2: Execute

#### 2.1 Implement `[required · repeatable]`

Sub-agent 模式分派 `devflow-implement`；inline 模式先加载 `devflow-before-dev`，读取任务产物和相关 spec 后直接实现。

#### 2.2 Quality check `[required · repeatable]`

分派或加载 `devflow-check`，按 spec、任务产物、lint/typecheck/tests 验证。发现问题先修复再复查。

#### 2.3 Rollback `[on demand]`

如果 check 暴露 PRD 缺陷，回到 Phase 1 修正；如果实现方向错误，回滚代码并重新执行。

Sub-agent dispatch protocol applies to all platforms: every dispatch prompt starts with `Active task: <task path from task.py current>`.

[workflow-state:in_progress]
工具：`devflow-implement` / `devflow-research` 仅是 sub-agent 类型；`devflow-update-spec` 是 skill；`devflow-check` 可能同时存在 agent 和 skill，代码变更后优先使用 Agent 形式。
流程：`devflow-implement` -> `devflow-check` -> `devflow-update-spec` -> commit（Phase 3.4）-> `/devflow:finish-work`。
主会话默认分派 implement/check sub-agent。Sub-agent 自豁免：如果已经在 `devflow-implement` 或 `devflow-check` 中运行，不要再启动另一个 DevFlow implement/check agent。
分派提示以 `Active task: <task path from task.py current>` 开头。读取上下文：jsonl 条目 -> `prd.md` -> `design.md（如有）` -> `implement.md（如有）`。
[/workflow-state:in_progress]

[workflow-state:in_progress-inline]
流程：`devflow-before-dev` -> edit -> `devflow-check` -> validation -> `devflow-update-spec` -> commit（Phase 3.4）-> `/devflow:finish-work`。
Inline 模式不要分派 implement/check sub-agent。
读取上下文：`prd.md` -> `design.md（如有）` -> `implement.md（如有）`，以及 skill 加载的相关 spec/research。
[/workflow-state:in_progress-inline]

### Phase 3: Finish

#### 3.1 Quality verification `[required · repeatable]`

再次执行 `devflow-check`，确认验证通过。

#### 3.2 Debug retrospective `[on demand]`

同类问题反复出现时加载 `devflow-break-loop`。

#### 3.3 Spec update `[required · once]`

加载 `devflow-update-spec`，判断是否需要更新 `.devflow/spec/`。

#### 3.4 Commit changes `[required · once]`

为本任务代码变更制定 commit 计划，向用户一次性确认后按批次提交。不要 amend，不要 push，不要把无关脏文件静默加入提交。

#### 3.5 Wrap-up reminder

提醒用户运行 `/devflow:finish-work` 完成归档和 journal 记录。

[workflow-state:completed]
代码已提交。运行 `/devflow:finish-work`；如果工作区有未提交变更，先回到 Phase 3.4。
[/workflow-state:completed]

### Rules

1. 先识别当前 Phase，再继续该 Phase 的下一步。
2. 每个 Phase 内按顺序执行；`[required]` 不能跳过。
3. 发现需求缺陷时可以回退到 Plan。
4. `[once]` 步骤已有产物则不重复执行。
