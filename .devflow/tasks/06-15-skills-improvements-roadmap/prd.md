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
- Keep completed child work visible from the parent even after child tasks are archived.
- Keep each child task scoped enough to plan, implement, check, and archive independently.
- Preserve DevFlow's existing workflow shape; the research report explicitly says these improvements should not change the core Planning -> Execute -> Finish lifecycle.
- Keep English templates, Chinese templates, local dogfood files, specs, and tests in sync when a child task touches templated DevFlow behavior.

## Child Task Map

### Completed Children

1. **Evidence-first template sync** (`06-15-sync-evidence-first-brainstorm-template`)
   - Outcome: bundled/common brainstorm templates include the same mandatory evidence-first rule as the local dogfood `devflow-brainstorm` skill.
   - Status: completed and archived.

2. **Feedback loop strengthening** (`06-15-strengthen-devflow-diagnose-feedback-loop`)
   - Outcome: `devflow-diagnose` guidance includes loop optimization, non-deterministic bug handling, and a hard stop when no useful feedback loop exists.
   - Status: completed and archived.

3. **Deletion test integration** (`06-15-add-deletion-test-code-reuse-guide`)
   - Outcome: the code reuse thinking guide includes a concise deletion-test heuristic for evaluating whether an abstraction is justified.
   - Status: completed and archived.

4. **CONTEXT.md/domain vocabulary and ADR system** (`06-15-06-15-add-context-adr-system`)
   - Outcome: reusable context and ADR documentation guidance is available for future DevFlow work.
   - Status: completed and archived.

5. **Prototype bundled skill** (`06-15-add-devflow-prototype-skill`)
   - Outcome: create `devflow-prototype` as a bundled skill with logic/UI prototype guidance, findings capture, brainstorm integration, template parity, and tests.
   - Status: completed and archived.

### Planned P1 Skill/Guide Expansion Children

1. **Module depth thinking guide** (`06-16-add-module-depth-thinking-guide`)
   - Outcome: add a guide for evaluating module depth, interface shape, shallow wrappers, and abstraction value.
   - Status: planned.

2. **TDD path in before-dev** (`06-16-add-tdd-before-dev-guidance`)
   - Outcome: add optional red-green-refactor guidance to `devflow-before-dev` for behavior-changing work.
   - Status: planned.

3. **Vertical slice readiness guidance** (`06-16-improve-vertical-slice-readiness-guidance`)
   - Outcome: refine `devflow-brainstorm` vertical-slice guidance with implementation-readiness and AFK/HITL terminology.
   - Status: planned.

4. **Seam/adapter cross-layer guidance** (`06-16-add-seam-adapter-cross-layer-guidance`)
   - Outcome: extend the cross-layer thinking guide with seam and adapter decision checks.
   - Status: planned.

5. **Skill authoring guidance update** (`06-16-update-skill-authoring-guidance`)
   - Outcome: strengthen skill authoring guidance with SKILL.md length targets, utility script rules, and description-routing clarity.
   - Status: planned.

### P1 Backlog

- All currently selected P1 skill/guide expansion items have planning child tasks.
- Remaining P1 scope should be added here only if a later review finds a missed recommendation from the 06-13 report.

### P2 Backlog

- Caveman token compression mode.
- Zoom-out architecture review skill.
- Handoff mechanism.
- Triage partial absorption.
- Teach framework evaluation.

## Acceptance Criteria

- [x] Parent task links the first P0 child tasks.
- [x] Each P0 child task has a PRD with concrete requirements and acceptance criteria.
- [x] P1 and P2 items remain captured in this parent task for later expansion.
- [x] The parent task is not used for direct production edits unless a cross-child integration review requires it.
- [ ] Final roadmap completion includes a cross-child review against the archived 06-13 research report.

## Out Of Scope

- Implementing all 15 recommendations in one task.
- Starting P1 or P2 work before the P0 batch is planned.
- Changing DevFlow's core lifecycle or task status model.
