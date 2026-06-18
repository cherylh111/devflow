# Skills Improvements Roadmap Implementation Plan

## Checklist

1. Plan and complete P0 child tasks:
   - [x] `06-15-sync-evidence-first-brainstorm-template`
   - [x] `06-15-strengthen-devflow-diagnose-feedback-loop`
   - [x] `06-15-add-deletion-test-code-reuse-guide`
2. After each child is completed:
   - [x] Check whether its result changes P1/P2 ordering.
   - [x] Update the parent PRD backlog if any recommendation is obsolete or already resolved.
3. After P0 batch completion:
   - [x] Decide whether to create the P1 documentation-system child task next.
   - [x] Decide whether to split P1 skills/guides into separate child tasks or one batch.
   - [x] Complete `06-15-add-devflow-prototype-skill`.
   - [x] Plan second P1 skill/guide expansion batch:
     - [x] `06-16-add-module-depth-thinking-guide`
     - [x] `06-16-add-tdd-before-dev-guidance`
     - [x] `06-16-improve-vertical-slice-readiness-guidance`
     - [x] `06-16-add-seam-adapter-cross-layer-guidance`
     - [x] `06-16-update-skill-authoring-guidance`
   - [x] Implement `06-16-update-skill-authoring-guidance`.
4. Final parent review:
   - [ ] Compare completed/deferred work against the 06-13 research report.
   - [ ] Record intentional deferrals.
   - [ ] Archive parent only after child links and final notes are coherent.

## Current Resume Point

The P0 batch, documentation-system child, and prototype child have been completed and archived. The remaining selected P1 skill/guide expansion items have been planned as child tasks.

Next choose one of:

1. Start one P1 child task and execute it independently.
2. Defer one or more planned P1 child tasks with notes.
3. Keep the parent active as a roadmap tracker until the user selects the next child.

## Validation

Use child-specific validation commands. Parent validation is primarily structural:

```bash
python ./.devflow/scripts/task.py list
Get-Content -LiteralPath .devflow/tasks/06-15-skills-improvements-roadmap/task.json
```

## Rollback

If a child split is wrong, use `task.py remove-subtask` to unlink it and create a better-scoped child. Do not delete task directories unless the user explicitly requests cleanup.
