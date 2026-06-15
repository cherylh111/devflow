# Skills Improvements Roadmap

## Goal

Implement the improvement roadmap produced by the archived `06-13-research-skills-improvements` research task in independently verifiable batches, starting with the P0 fixes that address current template/spec gaps.

## Background

The archived research report at `.devflow/tasks/archive/2026-06/06-13-research-skills-improvements/research/skills-analysis.md` analyzed 18 external skills patterns and produced 15 DevFlow improvement recommendations:

- P0: 3 items, estimated 4-6 hours total.
- P1: 7 items, estimated 4-6 days total.
- P2: 5 exploratory items.

The report recommends implementing the P0 batch first:

1. Evidence-first template sync.
2. Feedback loop strengthening for `devflow-diagnose`.
3. Deletion test integration into the code reuse guide.

## Requirements

- Track the full 06-13 roadmap as a parent task so P0, P1, and P2 follow-up work remains discoverable.
- Create child tasks only for independently verifiable vertical slices.
- Implement P0 child tasks before expanding P1/P2 work.
- Keep each child task scoped enough to plan, implement, check, and archive independently.
- Preserve DevFlow's existing workflow shape; the research report explicitly says these improvements should not change the core Planning -> Execute -> Finish lifecycle.
- Keep English templates, Chinese templates, local dogfood files, specs, and tests in sync when a child task touches templated DevFlow behavior.

## Child Task Map

### P0 Children To Create Now

1. **Evidence-first template sync**
   - Outcome: bundled/common brainstorm templates include the same mandatory evidence-first rule as the local dogfood `devflow-brainstorm` skill.
   - Human review: recommended before implementation because wording affects agent behavior.

2. **Feedback loop strengthening**
   - Outcome: `devflow-diagnose` guidance includes loop optimization, non-deterministic bug handling, and a hard stop when no useful feedback loop exists.
   - Human review: recommended before implementation because wording affects debugging workflow.

3. **Deletion test integration**
   - Outcome: the code reuse thinking guide includes a concise deletion-test heuristic for evaluating whether an abstraction is justified.
   - Human review: optional; this is a narrow spec/guidance update.

### P1 Backlog

- CONTEXT.md/domain vocabulary and ADR system.
- `devflow-prototype` bundled skill.
- Module depth thinking guide.
- TDD path in `devflow-before-dev`.
- Vertical slice HITL/AFK guidance.
- Seam/adapter guidance in cross-layer thinking.
- Skill authoring updates for 100-line targets and utility scripts.

### P2 Backlog

- Caveman token compression mode.
- Zoom-out architecture review skill.
- Handoff mechanism.
- Triage partial absorption.
- Teach framework evaluation.

## Acceptance Criteria

- [ ] Parent task links the first P0 child tasks.
- [ ] Each P0 child task has a PRD with concrete requirements and acceptance criteria.
- [ ] P1 and P2 items remain captured in this parent task for later expansion.
- [ ] The parent task is not used for direct production edits unless a cross-child integration review requires it.
- [ ] Final roadmap completion includes a cross-child review against the archived 06-13 research report.

## Out Of Scope

- Implementing all 15 recommendations in one task.
- Starting P1 or P2 work before the P0 batch is planned.
- Changing DevFlow's core lifecycle or task status model.
