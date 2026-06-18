# Improve Vertical Slice Readiness Guidance

## Goal

Refine DevFlow planning guidance so child tasks are not just vertical slices, but implementation-ready slices with clear AFK/HITL expectations and no unresolved planning blockers.

## Background

The archived `06-13-research-skills-improvements` report recommends improving vertical-slice guidance with readiness language. DevFlow already has vertical slice decomposition in `devflow-brainstorm`; this task should extend that guidance rather than replace it.

## Requirements

- Update brainstorm guidance with an implementation-readiness checklist.
- Clarify AFK-ready versus HITL-required work without adding new task statuses.
- Keep parent/child task rules intact.
- Sync English templates, Chinese templates, and local dogfood surfaces where corresponding files exist.
- Keep the guidance focused on planning quality before `task.py start`.
- Avoid adding issue-tracker triage state or full triage workflow.

## Acceptance Criteria

- [ ] `devflow-brainstorm` includes implementation-readiness checks before task activation.
- [ ] Guidance distinguishes AFK-ready and HITL-required slices.
- [ ] English common template, Chinese common template, and local dogfood skill are synchronized.
- [ ] The change does not add task statuses, workflow phases, or issue-tracker state.
- [ ] Parent roadmap notes that vertical slice readiness has been planned as a child task.

## Out Of Scope

- Full triage state machine.
- GitHub/Linear/Jira issue integration.
- Creating new task status values.
- Replacing existing parent/child task mechanics.
