# Implementation Plan: Skills 项目研究与改进提取

## Pre-flight

- [ ] 确认 skills 项目路径可访问：`C:\Users\Admin\Desktop\AiWorker\skills`
- [ ] 确认 06-09 研究归档可读：`.devflow/tasks/archive/2026-06/06-09-research-skill-design-lessons/research/`
- [ ] 创建 `research/` 目录

## Phase 1: 准备基线和上下文

### 1.1 读取 06-09 研究结论

- 读取 `adoption-matrix.md` 提取已落地和推迟项
- 读取 `initial-comparison.md` 提取初始对比框架
- 读取 `devflow-framework-inventory.md` 提取 DevFlow 现有能力清单
- 读取 `mattpocock-skills-inventory.md` 提取 skills 全量清单

产出：报告 Part 1 基线部分的初稿

### 1.2 读取尚未分析的 skills 源文件

需要读取但 brainstorm 阶段未读的文件：
- `prototype/LOGIC.md`, `prototype/UI.md`
- `tdd/deep-modules.md`, `tdd/interface-design.md`, `tdd/refactoring.md`
- `teach/MISSION-FORMAT.md`, `teach/RESOURCES-FORMAT.md`, `teach/LEARNING-RECORD-FORMAT.md`
- `triage/AGENT-BRIEF.md`, `triage/OUT-OF-SCOPE.md`
- `improve-codebase-architecture/INTERFACE-DESIGN.md`
- `improve-codebase-architecture/HTML-REPORT.md`

## Phase 2: 并行深度分析（Sub-agent）

RPM 限制：≤ 5 个 sub-agent 同时运行。

### 批次 1（3 个 sub-agent）

**Sub-agent 1A: CONTEXT.md + ADR 体系**
- 输入：skills 的 CONTEXT-FORMAT.md, ADR-FORMAT.md, grill-with-docs/SKILL.md, CONTEXT.md
- 对比：DevFlow 的 .devflow/spec/ 结构, wiki/ 机制
- 产出：`research/analysis-context-adr.md`

**Sub-agent 1B: Deep Modules 方法论**
- 输入：LANGUAGE.md, DEEPENING.md, INTERFACE-DESIGN.md
- 对比：DevFlow 的 guides/index.md, cross-layer-thinking-guide.md, code-reuse-thinking-guide.md
- 产出：`research/analysis-deep-modules.md`

**Sub-agent 1C: Feedback Loop + Evidence-first + Vertical Slices**
- 输入：diagnose/SKILL.md, grill-with-docs/SKILL.md, to-issues/SKILL.md
- 对比：DevFlow 的 devflow-diagnose, devflow-brainstorm, devflow-check
- 产出：`research/analysis-methodology-patterns.md`

### 批次 2（4 个 sub-agent）

**Sub-agent 2A: Prototype 技能分析**
- 输入：prototype/SKILL.md, LOGIC.md, UI.md
- 对比：DevFlow 无对应技能
- 产出：`research/analysis-prototype.md`

**Sub-agent 2B: Zoom-out 技能分析**
- 输入：zoom-out/SKILL.md
- 对比：DevFlow 的 thinking guides
- 产出：`research/analysis-zoom-out.md`

**Sub-agent 2C: TDD 循环分析**
- 输入：tdd/SKILL.md, tests.md, mocking.md, deep-modules.md, interface-design.md, refactoring.md
- 对比：DevFlow 的 unit-test/conventions.md
- 产出：`research/analysis-tdd.md`

**Sub-agent 2D: Caveman 模式分析**
- 输入：caveman/SKILL.md
- 对比：DevFlow 无对应机制
- 产出：`research/analysis-caveman.md`

### 批次 3（4 个 sub-agent）

**Sub-agent 3A: Handoff 分析**
- 输入：handoff/SKILL.md
- 对比：DevFlow 的 progress.json, task artifacts
- 产出：`research/analysis-handoff.md`

**Sub-agent 3B: Teach 分析**
- 输入：teach/SKILL.md 及所有 FORMAT 文件
- 对比：DevFlow 的 devflow-learn
- 产出：`research/analysis-teach.md`

**Sub-agent 3C: Triage 分析**
- 输入：triage/SKILL.md, AGENT-BRIEF.md, OUT-OF-SCOPE.md
- 对比：DevFlow 的 task status workflow
- 产出：`research/analysis-triage.md`

**Sub-agent 3D: Write-a-skill 分析**
- 输入：write-a-skill/SKILL.md
- 对比：DevFlow 的 skill-authoring.md, devflow-meta
- 产出：`research/analysis-write-skill.md`

## Phase 3: 整合与输出

### 3.1 整合所有子报告

- 读取所有 `research/analysis-*.md`
- 合并到 `research/skills-analysis.md` 的统一框架
- 编写 Executive Summary
- 去重和交叉引用

### 3.2 优先级排序

- 汇总所有改进建议
- 按 P0/P1/P2 标准排序
- P0 项补充实施方案（文件路径、变更范围、工作量估算）

### 3.3 框架影响评估

- 评估对 workflow.md 的影响
- 评估对 .devflow/spec/ 的影响
- 评估对现有 skill 的影响
- 给出建议实施顺序

### 3.4 质量检查

- [ ] 至少 15 个模式/思想的深度分析
- [ ] 每个分析包含统一四部分：skills 实现、DevFlow 现状、改进建议、权衡
- [ ] 至少 5 个 P0 改进项
- [ ] P0 项有具体实施方案
- [ ] 引用 06-09 研究结论
- [ ] CONTEXT.md 体系设计完整
- [ ] 无遗漏的 skills 源文件

## Validation

```bash
# 确认报告存在
ls -la .devflow/tasks/06-13-research-skills-improvements/research/skills-analysis.md

# 确认报告字数（预期 3000+ 行）
wc -l .devflow/tasks/06-13-research-skills-improvements/research/skills-analysis.md

# 确认 P0 项数量
grep -c "^.*优先级.*P0\|^\*\*优先级\*\*: P0" .devflow/tasks/06-13-research-skills-improvements/research/skills-analysis.md
```
