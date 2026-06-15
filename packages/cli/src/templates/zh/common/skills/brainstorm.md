# DevFlow 需求澄清

## 不可协商的访谈约定

围绕此计划的每个方面持续追问我，直到我们达成共同理解。沿着设计树的每个分支推进，逐一解决决策之间的依赖。每个问题都要给出你的推荐答案。

一次只问一个问题。

## 不可协商的证据规则

如果某个问题可以通过探索代码库回答，就去探索代码库。

这是强制要求。向用户提问前，先检查答案是否已经存在于代码、测试、配置、文档、现有 spec 或任务历史中。

不要要求用户确认仓库本身能回答的事实。只询问产品意图、偏好、范围、风险容忍度，或检查后仍然模糊的决策。

---

在 Phase 1 规划期间使用此 skill，将用户请求转化为清晰的需求和规划产物。

## 前置条件

仅在用户已同意创建任务，并准备进入 DevFlow 规划后使用此 skill。

如果还没有任务，创建一个：

```bash
TASK_DIR=$({{PYTHON_CMD}} ./.devflow/scripts/task.py create "<short task title>" --slug <slug>)
```

使用来自用户请求的简洁标题。slug 不要带日期前缀。`task.py create` 会自动添加 `MM-DD-` 目录前缀。

`task.py create` 会创建默认 `prd.md`。在提出后续问题前，先用当前理解更新该文件。

## 规划流程

1. 如果存在领域词汇表，先加载：
   ```bash
   cat .devflow/spec/wiki/domain-vocabulary.md 2>/dev/null || echo "尚无词汇表文件"
   ```
   在需求探索期间使用它保持术语一致性。
2. 在 `prd.md` 中记录用户请求和初始已知事实。
2. 提问前检查可用证据：
   - code、tests、fixtures 和 configs
   - README 文件、docs、现有 specs 和领域 notes
   - 如存在，相关 DevFlow tasks、research files 和 session history
3. 将发现的信息分为：
   - 已确认事实
   - 仍需用户提供的产品意图
   - 仍需用户决策的范围或风险事项
   - 可能不在范围内的事项
4. 提出剩余问题中价值最高的单个问题。
5. 随问题附上你的推荐答案。
6. 每次用户回答后，先更新 `prd.md` 再继续。
7. 对复杂任务，在实现开始前创建或更新 `design.md` 和 `implement.md`。

不要虚构项目特定的 product/spec 层级。如果仓库已有 product、domain 或 spec docs，就使用它们。如果没有，就基于现有证据继续。

## 垂直切片拆分

当一个请求包含多个可以独立验收的交付物时，考虑拆成 parent/child task。

使用这个映射：

- Parent task：承载原始需求、共享 research、任务地图、跨 child 的验收标准和最终集成 review。
- Child task：承载一个薄的端到端 vertical slice，可以独立规划、实现、检查和归档。

优先使用 tracer-bullet 式切片，而不是水平分层切片：

- 好：一个狭窄行为路径贯穿 schema/config、command/API、用户可见输出和 tests。
- 坏：把 "types"、"backend"、"tests" 分别作为 child，但没有任何一个能独立验收。

创建 children 前，先在 parent 的 `prd.md` 或 `design.md` 中草拟切片列表：

- 标题
- 可独立验收的结果
- blocked-by 关系，如有
- 实现前是否需要人工 review

依赖关系必须写入 child artifacts。不要依赖任务树位置来暗示顺序。

## 提问规则

每条消息只问一个问题。

每个问题都必须包含：

- 需要做出的决策
- 为什么答案重要
- 你的推荐答案
- 如果用户选择不同方案的权衡

不要询问是否要搜索、检查文件或继续 brainstorm 这类流程问题。直接做证据工作。只有当剩余问题是产品决策、偏好、范围边界或风险容忍度选择时，才询问用户。

## 产物规则

`prd.md` 记录需求和验收：

- 目标和用户价值
- 已确认事实
- 需求
- 验收标准
- 不在范围内
- 仍阻塞规划的开放问题

`design.md` 记录复杂任务的技术设计：

- 架构和边界
- 数据流和契约
- 兼容性和迁移说明
- 重要权衡
- 运维或回滚考虑

`implement.md` 记录复杂任务的执行规划：

- 有序实现 checklist
- 验证命令
- 风险文件或回滚点
- `task.py start` 前的后续检查

轻量任务可以只有 `prd.md`。复杂任务在 `task.py start` 前必须具备 `prd.md`、`design.md` 和 `implement.md`。

`implement.md` 不能替代 `implement.jsonl`。仅当任务需要 manifest 风格的 spec 和 research 引用时，才使用 JSONL 文件。

在 start review 前，把 `prd.md` 收敛为最终形态：

- 移除临时 brainstorm 章节，例如 `我已知道的`、`假设`、`开放问题`、`Brainstorm Notes` 和 `Raw Notes`。
- 将发现的 notes 和已解决的问题折叠到最终 requirements、constraints、acceptance criteria 或 out-of-scope 章节中。
- 清除占位符 bullets，例如 `- TBD`、`- [ ] TBD`、`- TODO` 和 `- [ ] TODO`。
- 将技术设计或执行细节移至 `design.md` 或 `implement.md`（复杂任务）。

## 决策捕获

在 brainstorming 期间做出设计决策时，用 3-condition 过滤器检查是否值得创建 ADR：

1. **难以逆转？** - 改变此决策需要显著努力（> 1 周）
2. **缺乏上下文会令人惊讶？** - 未来读者会疑惑"为什么这样做？"
3. **真实权衡的结果？** - 存在真实的替代方案

如果**三个条件都满足**，在 `docs/adr/NNNN-slug.md` 中创建 ADR，使用极简格式：

```markdown
# {简短标题}

{1-3 句话：背景、决策、原因。}
```

值得创建 ADR 的决策示例：
- 数据库选择（PostgreSQL vs MongoDB）
- API 架构（REST vs GraphQL vs gRPC）
- Monorepo vs 多仓库结构
- 审计追踪的事件溯源

不值得创建 ADR：
- 标准语言特性（async/await）
- 显而易见的做法（错误处理）
- 容易逆转的选择（文件命名）

## 质量标准

宣布规划就绪前：

- `prd.md` 包含可测试的验收标准。
- `prd.md` 已收敛，不再包含临时 brainstorm 章节或占位 bullet。
- 仓库可回答的问题已经通过检查得到答案。
- 剩余开放问题确实关于用户意图或范围。
- 复杂任务具备 `design.md` 和 `implement.md`。
- 用户已 review 最终规划产物，或明确批准继续。

在用户批准或要求实现前，不要开始实现。
