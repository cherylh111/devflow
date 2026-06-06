# Design

## Boundary

This task changes the planning contract and the `task.py start` gate. It does not add a new lifecycle command and does not change task status transitions.

## Validation Strategy

The script-level validation should be deterministic and conservative. It should catch PRDs that are clearly still in brainstorm working state, without attempting semantic duplicate detection.

### Errors

`task.py start` should fail when `prd.md` contains any of these unresolved artifacts:

- Default placeholder content already covered today.
- Temporary brainstorm headings that should not survive final convergence, matched as Markdown H2/H3 headings:
  - `What I already know`
  - `What we know`
  - `Assumptions`
  - `Open Questions`
  - `Questions`
  - `Brainstorm Notes`
  - `Discovery Notes`
  - `Scratchpad`
  - `Raw Notes`
- Placeholder list items that indicate unfinished requirements or acceptance criteria:
  - `- TBD`
  - `- [ ] TBD`
  - `- TODO`
  - `- [ ] TODO`
  - equivalent `TBD.` or `TODO` bullets with whitespace/case variation.

### Warnings

Avoid warnings initially unless there is a clear non-blocking action. The start gate already supports warnings, but warnings are easy to ignore and do not solve the issue.

### Not Validated

- Fuzzy duplicate sentences.
- Whether every acceptance criterion maps to a requirement.
- Whether design details are perfectly separated from requirements.
- Team-specific section names beyond the known temporary brainstorm artifacts.

Those are better handled by workflow guidance and review.

## Implementation Shape

- Add a helper near `_is_placeholder_prd()` in `.devflow/scripts/task.py`.
- Call the helper from `_validate_start_gate()` after reading non-empty `prd.md`.
- Return clear errors that name the offending heading or placeholder.
- Mirror the same change in the source template if this repository's packaged template is the source of generated `.devflow/scripts/task.py`.
- Update workflow and brainstorm guidance so agents know to converge PRDs before invoking `task.py start`.

## Compatibility

Valid lightweight PRDs remain allowed. A PRD with only `Goal`, `Requirements`, `Acceptance Criteria`, and `Notes` should pass as long as it has no unresolved temporary headings or placeholder bullets.

`--force` continues to bypass start gate validation intentionally.
