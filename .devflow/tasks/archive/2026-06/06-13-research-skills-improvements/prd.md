# 研究 skills 项目并提取可改进部分

## Goal

在 06-09 研究基础上深入分析 skills 项目中 DevFlow 尚未吸收的思想和模式，产出按优先级排序的改进建议报告。

## Background

### 上次研究（06-09）已完成的工作

06-09 研究产出了 `adoption-matrix.md`，已落地以下改进：
- **devflow-diagnose** 已引入（借鉴 diagnose 的诊断循环）
- **skill-authoring.md** 已建立（SKILL.md 作为路由器、精确 frontmatter 描述）
- **devflow-brainstorm** 已改进 vertical-slice 任务分解指导
- **workflow routing** 已更新（diagnose 路由在 workflow.md 中）

06-09 推迟或未深入的项（本次研究重心）：
- CONTEXT.md 体系（P1 Adapt，建议放 wiki/，未设计）
- prototype-first 工作流（P1 Adapt，仅列名）
- zoom-out 架构审视（P1 Adapt，仅列名）
- TDD 循环（P1 Adapt，仅提及）
- caveman token 优化（未提及）
- deep modules / deletion test 等工程方法论（未提取）
- ADR 体系（未独立设计）
- handoff / teach / write-a-skill 等 productivity 模式（未分析）

### 本次差异化重心

三个方向，均需引用上次研究结论作为基线：

1. **CONTEXT.md + ADR 文档体系** - 独立于 wiki/ 的完整设计方案
2. **未实施技能的深度分析** - prototype、zoom-out、TDD、caveman、handoff 等
3. **框架级工程方法论提取** - deep modules、seam/adapter、deletion test、feedback loop obsession 等整合到 spec/guides/

## Confirmed Facts

### skills 项目已读取的关键文件

| 文件 | 核心价值 |
|------|---------|
| grill-with-docs/SKILL.md | Evidence-first + 内联更新 CONTEXT.md/ADR |
| grill-with-docs/CONTEXT-FORMAT.md | CONTEXT.md 格式规范和膨胀控制策略 |
| grill-with-docs/ADR-FORMAT.md | 极简 ADR 模板 + 三条件准入（不可逆/反直觉/真权衡）|
| diagnose/SKILL.md | 6-phase 诊断循环，feedback loop obsession |
| tdd/SKILL.md + tests.md + mocking.md | 垂直切片 TDD，接口级测试，边界级 mock |
| improve-codebase-architecture/SKILL.md + LANGUAGE.md + DEEPENING.md | deep modules 方法论，deletion test，seam/adapter |
| prototype/SKILL.md | 逻辑原型 vs UI 原型，throwaway-first |
| zoom-out/SKILL.md | 极简指令，仅 3 行，disable-model-invocation |
| to-prd/SKILL.md | 不面试的 PRD（从现有上下文综合）|
| to-issues/SKILL.md | tracer bullet 垂直切片分解，HITL vs AFK |
| triage/SKILL.md | 5 状态机 + 2 分类，结构化分诊流程 |
| caveman/SKILL.md | 75% token 节省，Auto-Clarity Exception |
| handoff/SKILL.md | 极简 handoff，不重复已有 artifact |
| teach/SKILL.md | 有状态教学，MISSION/RESOURCES/NOTES 工作区 |
| write-a-skill/SKILL.md | 技能编写规范，100 行限制，description 触发器 |

### 已确认的 CONTEXT.md 设计决策

- CONTEXT.md 独立于 .devflow/spec/wiki/（职责分离：当前共识 vs 历史记录）
- 位置：repo root（单上下文）或 CONTEXT-MAP.md + 子目录（多上下文）
- 膨胀控制：只记录项目特定术语、1-2 句定义、_Avoid_ 字段、按 domain 拆分

## Requirements

### 层面 1：文档体系（框架影响：高）

引入 CONTEXT.md + ADR 体系，职责分离于现有 .devflow/spec/：

**CONTEXT.md**（Runtime domain glossary）
- 位置：repo root，自动加载
- 格式：借鉴 skills 的 CONTEXT-FORMAT.md
- 单/多上下文支持，膨胀控制策略
- 更新触发：brainstorm / grill-with-docs 中术语明确时

**ADR**（架构决策记录）
- .devflow/spec/adr/ - DevFlow 框架决策
- docs/adr/ - 项目架构决策
- 格式：借鉴 skills 的极简 ADR（可以只有一段话）
- 三条件准入：不可逆 + 反直觉 + 真权衡

### 层面 2：未实施技能深度分析（框架影响：低-中）

逐个深度分析以下技能的核心机制，给出 DevFlow 版设计方案：
- prototype（逻辑原型 vs UI 原型，throwaway-first）
- zoom-out（极简架构审视）
- TDD 循环（垂直切片 red-green-refactor）
- caveman（token 优化模式）
- handoff（跨 session 上下文传递）
- teach（有状态教学工作区）
- triage（结构化分诊状态机）
- write-a-skill（技能编写元技能）

### 层面 3：工程方法论模式提取（框架影响：中）

提取 skills 中的工程方法论，评估整合到 DevFlow spec/guides/ 的价值：
- deep modules / depth-as-leverage（LANGUAGE.md）
- deletion test / seam / adapter（DEEPENING.md）
- 接口级测试 vs 实现级测试（tests.md + mocking.md）
- feedback loop obsession（diagnose）
- evidence-first 探索（grill-with-docs）
- tracer bullet 垂直切片（to-issues）
- throwaway-first 原型（prototype）

### 研究产出格式

输出到 `research/skills-analysis.md`：

```
## Executive Summary
## Part 1: 上次研究基线（引用 06-09 结论）
## Part 2: 核心模式深度分析（每个模式独立 section）
## Part 3: 优先改进清单（P0/P1/P2）
## Part 4: 框架影响评估
## Appendix: 参考文档索引
```

### 实施约束

- Sub-agent 并行研究，RPM 限制不超过 5
- 引用上次研究结论作为基线，不重复已完成分析
- 每个模式的分析包含：skills 实现、DevFlow 现状、改进建议、权衡

## Acceptance Criteria

- [ ] 完成至少 15 个关键模式/思想的深度分析
- [ ] 每个分析包含：skills 实现、DevFlow 现状、改进建议、权衡
- [ ] 至少识别出 5 个 P0 优先级的改进项
- [ ] P0 改进项有具体的实施方案（涉及文件路径、变更范围）
- [ ] 报告引用 06-09 研究结论，标注差异化发现
- [ ] CONTEXT.md 体系设计有完整方案（格式、位置、加载、膨胀控制）
- [ ] 报告以 markdown 格式输出到 research/ 目录

## Out of Scope

- 不实际实施任何改进（只做研究和建议）
- 不评估 skills 项目本身的优劣（专注于可借鉴部分）
- 不涉及 DevFlow 底层架构的重构（如 task.py, workflow.md 的核心流程结构）
- 不重复 06-09 已完成的工作（diagnose 引入、skill-authoring 规范等）
