# Design: Skills 项目研究与改进提取

## Scope

本任务是纯研究任务。产出物是 `research/skills-analysis.md` 报告，不修改任何生产代码。

报告基于 06-09 研究结论（`adoption-matrix.md`）的基线，聚焦三个差异化方向：

1. CONTEXT.md + ADR 文档体系设计
2. 未实施技能的深度分析（prototype, zoom-out, TDD, caveman, handoff, teach, triage, write-a-skill）
3. 框架级工程方法论模式提取（deep modules, deletion test, seam/adapter, feedback loop）

## External Evidence

Skills 项目位于 `C:\Users\Admin\Desktop\AiWorker\skills`。

上次研究位于 `.devflow/tasks/archive/2026-06/06-09-research-skill-design-lessons/research/`。

### 需要深度分析的 skills 源文件

| 分析维度 | 源文件 |
|---------|--------|
| CONTEXT.md 体系 | `grill-with-docs/CONTEXT-FORMAT.md`, `grill-with-docs/ADR-FORMAT.md`, `grill-with-docs/SKILL.md`, `CONTEXT.md` |
| prototype | `prototype/SKILL.md`, `prototype/LOGIC.md`, `prototype/UI.md` |
| zoom-out | `zoom-out/SKILL.md` |
| TDD | `tdd/SKILL.md`, `tdd/tests.md`, `tdd/mocking.md`, `tdd/deep-modules.md`, `tdd/interface-design.md`, `tdd/refactoring.md` |
| caveman | `caveman/SKILL.md` |
| handoff | `handoff/SKILL.md` |
| teach | `teach/SKILL.md`, `teach/MISSION-FORMAT.md`, `teach/RESOURCES-FORMAT.md`, `teach/LEARNING-RECORD-FORMAT.md` |
| triage | `triage/SKILL.md`, `triage/AGENT-BRIEF.md`, `triage/OUT-OF-SCOPE.md` |
| write-a-skill | `write-a-skill/SKILL.md` |
| deep modules 方法论 | `improve-codebase-architecture/LANGUAGE.md`, `improve-codebase-architecture/DEEPENING.md`, `improve-codebase-architecture/INTERFACE-DESIGN.md` |

### DevFlow 对比文件

| 对比维度 | DevFlow 文件 |
|---------|-------------|
| 现有 skill 清单 | `.claude/skills/devflow-*` |
| skill 编写规范 | `.devflow/spec/devflow/backend/skill-authoring.md` |
| 现有 thinking guides | `.devflow/spec/guides/index.md`, `code-reuse-thinking-guide.md`, `cross-layer-thinking-guide.md` |
| workflow 核心 | `.devflow/workflow.md` |
| 上次研究 | `archive/.../research/adoption-matrix.md`, `initial-comparison.md` |

## Research Architecture

### 分析框架

每个模式/技能的分析采用统一结构：

```
### [模式名称]

**Skills 实现**
- 核心机制（引用具体文件和关键段落）
- 设计亮点

**DevFlow 现状**
- 当前有/无对应能力
- 差距分析

**改进建议**
- 具体做什么
- 涉及的 DevFlow 文件
- 框架影响（低/中/高）

**权衡**
- 引入成本 vs 收益
- 风险和缓解

**优先级**: P0/P1/P2
```

### 优先级标准

| 等级 | 标准 |
|------|------|
| P0 | 解决当前痛点、低风险、可独立实施 |
| P1 | 有价值但需要更多设计或依赖其他改进 |
| P2 | 探索性、适用面窄、或工作量大 |

### Sub-agent 分工

并行度控制在 RPM ≤ 5：

| 批次 | 分析内容 | Sub-agent 数量 |
|------|---------|---------------|
| 批次 1 | CONTEXT.md 体系 + ADR 体系 + 工程方法论（deep modules + feedback loop + evidence-first）| 3 |
| 批次 2 | prototype + zoom-out + TDD + caveman | 4 |
| 批次 3 | handoff + teach + triage + write-a-skill | 4 |
| 整合 | 主 session 整合所有发现，编写 Executive Summary 和优先改进清单 | 1（主 session）|

每个 sub-agent 的 prompt 包含：
1. Active task 路径
2. 目标 skills 源文件路径
3. DevFlow 对比文件路径
4. 分析框架模板
5. 上次研究相关结论引用

### 报告结构

```
research/skills-analysis.md

# Skills 项目深度研究报告

## Executive Summary
- 本次研究与 06-09 研究的关系
- 关键发现（3-5 点）
- P0/P1/P2 统计

## Part 1: 上次研究基线
- 06-09 已落地改进清单
- 06-09 推迟/未深入项

## Part 2: 文档体系设计

### 2.1 CONTEXT.md 体系
（格式、位置、加载、膨胀控制、大型项目组织）

### 2.2 ADR 体系
（格式、准入条件、位置选择）

### 2.3 与 .devflow/spec/ 的关系

## Part 3: 技能深度分析
（每个技能一个 section，统一分析框架）

## Part 4: 工程方法论模式
（deep modules, deletion test, seam/adapter, feedback loop, 
 evidence-first, vertical slices, throwaway-first）

## Part 5: 优先改进清单

### P0 改进项
（每项含：描述、实施方案、涉及文件、框架影响、工作量估算）

### P1 改进项
### P2 改进项

## Part 6: 框架影响评估
- 对 workflow.md 的影响
- 对 .devflow/spec/ 的影响
- 对现有 skill 的影响
- 建议的实施顺序

## Appendix
- Skills 源文件引用索引
- 06-09 研究引用
```

## Boundaries

- 不修改任何 .devflow/, .claude/, .agents/, packages/ 下的生产文件
- 不创建新技能或规范文件
- 所有产出限于 `research/skills-analysis.md`
- Sub-agent 的中间产出写入 `research/` 目录下独立文件，主 session 整合后可保留或清理
