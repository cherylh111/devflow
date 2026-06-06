# Implementation Plan

1. Confirm source-of-truth files for local runtime and packaged templates.
2. Update workflow planning guidance:
   - Phase 1 description
   - planning and planning-inline workflow-state blocks
   - Phase 1.4 activation text
3. Update `devflow-brainstorm` skill guidance to require final PRD convergence before start review.
4. Extend `task.py` start gate with deterministic PRD convergence validation.
5. Add or update tests for:
   - valid lightweight PRD passes
   - temporary brainstorm headings fail
   - placeholder bullets fail
   - current default placeholder behavior still fails
6. Run focused tests for workflow invariants and task start gate behavior.

## Validation Commands

- `npm test -- --runInBand` or the repo-specific focused Vitest command if available.
- A direct `python ./.devflow/scripts/task.py start <fixture-task>` smoke check only if it can be done without disturbing the active task, or by using an isolated temp repo fixture.

## Risk Points

- Over-broad heading checks could block legitimate PRDs that intentionally have an `Assumptions` section.
- Updating only local `.devflow/scripts/task.py` may not update generated DevFlow templates. Confirm template source before implementation.
- Start gate changes must keep `--force` behavior intact.
