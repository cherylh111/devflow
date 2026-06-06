# Add PRD convergence gate

## Goal

Add a planning-stage PRD convergence gate so brainstorm output is deduplicated and normalized before task activation. The gate should prevent working-state brainstorm notes from entering implementation as a fragmented or repetitive PRD.

## Confirmed Facts

- GitHub issue https://github.com/mindfold-ai/Trellis/issues/320 reports that brainstorm-produced PRDs can accumulate duplicated facts across temporary sections, requirements, acceptance criteria, and implementation notes.
- The likely root cause is a missing convergence step after brainstorm discovery and before implementation activation.
- The local DevFlow workflow currently says `task.py start` enforces only that `prd.md` exists and is not the generated `TBD` placeholder.
- `.devflow/scripts/task.py` currently validates `prd.md` presence, non-empty content, and the default placeholder, but does not validate PRD structure, temporary sections, or duplicated brainstorm output.
- `.agents/skills/devflow-brainstorm/SKILL.md` requires immediate PRD updates during discovery and defines artifact quality expectations, but does not currently define a hard final convergence checkpoint before start.
- The user wants script-level validation in addition to workflow and skill guidance.

## Requirements

- Add an explicit PRD convergence requirement after brainstorm requirement exploration and before `task.py start`.
- Extend `task.py start` gate with deterministic PRD convergence validation.
- Define the minimum PRD convergence contract:
  - Temporary discovery sections must be removed or folded into final sections.
  - Requirements and acceptance criteria must avoid obvious unresolved placeholders.
  - Final PRD content must keep requirements, constraints, and acceptance criteria as the source of truth.
  - Design or execution details should move to `design.md` or `implement.md` for complex tasks.
- Keep script validation deterministic and conservative to avoid false positives on valid lightweight PRDs.
- Make the workflow guidance clear enough that supported AI platforms know the next action during planning.
- Preserve the existing lightweight-task path where `prd.md` alone can be enough.
- Preserve the existing complex-task path where `prd.md`, `design.md`, and `implement.md` are required before start.
- Avoid changing unrelated task lifecycle behavior.

## Acceptance Criteria

- [ ] The planning workflow describes a required PRD convergence step before task activation.
- [ ] The planning breadcrumb tells agents to converge PRD content before asking for start review.
- [ ] The brainstorm skill tells agents to normalize the final PRD before implementation starts.
- [ ] The start gate catches unresolved default placeholders as it does today.
- [ ] Script-level PRD convergence validation produces actionable errors without blocking valid lightweight PRDs.
- [ ] Script validation rejects unresolved temporary brainstorm sections in final PRDs.
- [ ] Script validation rejects obvious placeholder bullets or unchecked placeholder acceptance criteria outside generated seed content.
- [ ] Tests or focused validation cover the changed workflow and any script-level start gate behavior.

## Out of Scope

- Rewriting the entire brainstorm process.
- Changing task archive, finish, or session identity behavior.
- Requiring all tasks to have `design.md` and `implement.md`.
- Building semantic duplicate detection with an LLM or external service.
- Blocking PRDs based on fuzzy similarity or subjective duplicate scoring.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
