# Skills Improvements Roadmap Design

## Task Structure

Use a parent/child tree:

- Parent task: owns the roadmap, batch ordering, backlog capture, and final cross-child review.
- Child tasks: own independently verifiable P0 slices and any later P1/P2 slices.

The parent should not directly modify production files unless a later integration review identifies a cross-child documentation or coordination gap.

## Source Of Truth

Primary roadmap source:

- `.devflow/tasks/archive/2026-06/06-13-research-skills-improvements/research/skills-analysis.md`

Current repository state overrides stale research findings. Each child must inspect active source files before implementation and record any divergence in its planning artifacts or final notes.

## Batch Order

1. P0 batch:
   - Evidence-first template parity. Completed.
   - Diagnose feedback-loop strengthening. Completed.
   - Deletion-test guide integration. Completed.
2. P1 documentation system:
   - Domain vocabulary / CONTEXT-style guidance. Completed.
   - ADR system. Completed.
3. P1 skill and guide expansion:
   - Prototype. Planning as `06-15-add-devflow-prototype-skill`.
   - Module depth, TDD, vertical slice, seam/adapter, skill-authoring guidance.
4. P2 exploration:
   - Caveman, zoom-out, handoff, triage, teach.

## Compatibility

The roadmap must preserve DevFlow's current workflow shape:

- Planning -> Execute -> Finish remains unchanged.
- Task status continues to be controlled by `task.json.status`.
- Existing template install/update behavior should keep English, Chinese, local dogfood, and generated surfaces aligned.

## Review Strategy

Each child task should be reviewed against:

- its own PRD acceptance criteria;
- the relevant section of the 06-13 research report;
- active repository evidence at implementation time.

The parent is complete only after the selected roadmap scope has been implemented or intentionally deferred with notes.

## Current Resume Point

The completed child set covers the original P0 batch plus the P1 documentation-system item. The active P1 skill-expansion child is `06-15-add-devflow-prototype-skill`. After that child completes, the next parent decision is whether to expand another P1 child task, defer the remaining P1/P2 backlog, or run the final cross-child review and archive the parent.
