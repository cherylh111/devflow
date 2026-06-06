# Issue 320 Root Cause Notes

## External Issue

- Source: https://github.com/mindfold-ai/Trellis/issues/320
- Reported problem: brainstorm output can leave duplicated and fragmented content in `prd.md`.
- Confirmed cause: the process updates PRD content incrementally during discovery, but lacks a required final convergence gate before implementation activation.

## Local Evidence

- `.agents/skills/devflow-brainstorm/SKILL.md` requires agents to update `prd.md` during requirement exploration and defines the artifact quality bar, but it does not describe a mandatory final PRD normalization pass before activation.
- `.devflow/workflow.md` currently says `task.py start` requires `prd.md` to exist and not be the default placeholder.
- `.devflow/scripts/task.py` implements that start gate by checking for missing, empty, or default-placeholder `prd.md` content.
- No local deterministic check currently detects temporary brainstorm sections, duplicated requirement phrasing, or unmerged discovery notes.

## Implication

The most direct fix point is after brainstorm requirement exploration and before Phase 1.4 activation. A documentation-only change can improve agent behavior, while a script-level check can make the constraint harder to skip.
