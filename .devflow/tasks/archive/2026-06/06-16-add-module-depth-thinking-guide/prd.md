# Add Module Depth Thinking Guide

## Goal

Add a DevFlow thinking guide that helps agents evaluate module depth, abstraction boundaries, and whether code organization reduces real complexity.

## Background

The archived `06-13-research-skills-improvements` report identifies Deep Modules as a P1 improvement. The P0 deletion-test heuristic is already captured in the code reuse guide; this child task owns the remaining module-depth guidance.

The guide should adapt the external skills project's deep module thinking without changing DevFlow's workflow phases or task statuses.

## Requirements

- Add a module-depth thinking guide under `.devflow/spec/guides/`.
- Register the guide in `.devflow/spec/guides/index.md`.
- Keep the guide as a checklist/thinking aid, not a code-spec with implementation contracts.
- Connect it to existing code reuse and cross-layer guidance without duplicating those guides.
- Cover when to deepen a module, when to avoid abstraction, and how to evaluate interface size versus implementation complexity.
- Include practical prompts for DevFlow work such as CLI commands, template systems, task scripts, and shared helpers.
- Preserve existing guide style and language conventions.

## Acceptance Criteria

- [ ] A new module-depth guide exists in `.devflow/spec/guides/`.
- [ ] `.devflow/spec/guides/index.md` references the new guide.
- [ ] The guide explicitly points to the existing code reuse guide for deletion-test decisions.
- [ ] The guide includes concrete checks for shallow wrappers, over-general utilities, leaky abstractions, and stable interfaces.
- [ ] No workflow phase, task status, or template installation behavior is changed.

## Out Of Scope

- Rewriting existing modules.
- Adding an automated linter for module depth.
- Moving code between packages.
- Reopening the completed deletion-test P0 task.
