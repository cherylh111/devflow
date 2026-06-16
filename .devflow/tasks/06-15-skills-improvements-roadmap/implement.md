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
   - [ ] Complete `06-15-add-devflow-prototype-skill`.
4. Final parent review:
   - [ ] Compare completed/deferred work against the 06-13 research report.
   - [ ] Record intentional deferrals.
   - [ ] Archive parent only after child links and final notes are coherent.

## Current Resume Point

The P0 batch and the documentation-system child have been completed and archived. The next P1 skill-expansion child is:

1. `06-15-add-devflow-prototype-skill` - planning.

After that child is resolved, choose one of:

1. Create the next P1 child for one of the remaining skill/guide expansion items.
2. Defer remaining P1/P2 items with notes and run the final parent review.
3. Keep the parent active as a roadmap tracker without starting direct implementation.

## Validation

Use child-specific validation commands. Parent validation is primarily structural:

```bash
python ./.devflow/scripts/task.py list
Get-Content -LiteralPath .devflow/tasks/06-15-skills-improvements-roadmap/task.json
```

## Rollback

If a child split is wrong, use `task.py remove-subtask` to unlink it and create a better-scoped child. Do not delete task directories unless the user explicitly requests cleanup.
