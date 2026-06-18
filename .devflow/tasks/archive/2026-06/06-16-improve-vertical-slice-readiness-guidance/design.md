# Improve Vertical Slice Readiness Guidance Design

## Boundaries

This task updates `devflow-brainstorm` planning text only. It should not change `task.py`, workflow status transitions, or validation gates.

## Template Surfaces

- `packages/cli/src/templates/common/skills/brainstorm.md`
- `packages/cli/src/templates/zh/common/skills/brainstorm.md`
- `.agents/skills/devflow-brainstorm/SKILL.md`

## Content Shape

Extend the existing vertical-slice section with:

- implementation-readiness checklist;
- AFK-ready definition: enough context for autonomous implementation;
- HITL-required definition: user/manual/external step remains;
- instruction to record HITL dependency in child PRD/design/implement.

## Compatibility

This is a common workflow skill update, so localized and dogfood surfaces must stay aligned. No configurator code changes should be needed.

## Rollback

Remove the added readiness subsection from brainstorm surfaces.
