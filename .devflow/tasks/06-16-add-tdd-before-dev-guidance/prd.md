# Add TDD Guidance To Before-Dev

## Goal

Add optional test-first guidance to `devflow-before-dev` so agents consider a red-green-refactor loop for behavior changes, while avoiding TDD pressure for tasks that are exploratory, documentation-only, or unsuitable for test-first work.

## Background

The archived `06-13-research-skills-improvements` report identifies TDD as a P1 improvement. The recommendation is not to create a mandatory workflow phase. Instead, DevFlow should surface a TDD path when a task involves public behavior, API/interface design, complex business logic, or refactoring with preserved behavior.

## Requirements

- Add TDD suitability guidance to common `devflow-before-dev`.
- Sync the same guidance to localized templates and local dogfood skill files where corresponding surfaces exist.
- Point agents to package-specific unit-test specs for concrete test conventions.
- Emphasize vertical slices: one behavior test, minimal implementation, then repeat.
- Require behavior through public interfaces rather than implementation details.
- Clearly state when not to use TDD.
- Avoid adding a new workflow phase or mandatory `devflow-tdd` skill.

## Acceptance Criteria

- [ ] English common before-dev template includes a concise "When To Use TDD" section.
- [ ] Chinese common before-dev template has parity if the corresponding template exists.
- [ ] Local dogfood `.agents/skills/devflow-before-dev/SKILL.md` is updated.
- [ ] Unit-test spec references remain the source of concrete test conventions.
- [ ] No new required workflow phase or task status is introduced.

## Out Of Scope

- Creating a bundled `devflow-tdd` skill.
- Rewriting unit test conventions.
- Requiring all implementation tasks to be test-first.
