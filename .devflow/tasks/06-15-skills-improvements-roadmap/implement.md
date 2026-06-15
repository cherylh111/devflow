# Skills Improvements Roadmap Implementation Plan

## Checklist

1. Plan and complete P0 child tasks:
   - [ ] `06-15-sync-evidence-first-brainstorm-template`
   - [ ] `06-15-strengthen-devflow-diagnose-feedback-loop`
   - [ ] `06-15-add-deletion-test-code-reuse-guide`
2. After each child is completed:
   - [ ] Check whether its result changes P1/P2 ordering.
   - [ ] Update the parent PRD backlog if any recommendation is obsolete or already resolved.
3. After P0 batch completion:
   - [ ] Decide whether to create the P1 documentation-system child task next.
   - [ ] Decide whether to split P1 skills/guides into separate child tasks or one batch.
4. Final parent review:
   - [ ] Compare completed/deferred work against the 06-13 research report.
   - [ ] Record intentional deferrals.
   - [ ] Archive parent only after child links and final notes are coherent.

## Validation

Use child-specific validation commands. Parent validation is primarily structural:

```bash
python ./.devflow/scripts/task.py list
Get-Content -LiteralPath .devflow/tasks/06-15-skills-improvements-roadmap/task.json
```

## Rollback

If a child split is wrong, use `task.py remove-subtask` to unlink it and create a better-scoped child. Do not delete task directories unless the user explicitly requests cleanup.
