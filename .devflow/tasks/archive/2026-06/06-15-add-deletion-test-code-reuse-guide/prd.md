# Add Deletion Test Code Reuse Guide

## Goal

Add the deletion-test heuristic to DevFlow's code reuse thinking guide so agents can quickly challenge whether a new abstraction is justified.

## Background

The archived `06-13-research-skills-improvements` report marked deletion test integration as P0. Current repository inspection shows:

- The active local guide is `.devflow/spec/guides/code-reuse-thinking-guide.md`.
- Template sources exist at:
  - `packages/cli/src/templates/markdown/spec/guides/code-reuse-thinking-guide.md.txt`
  - `packages/cli/src/templates/zh/markdown/spec/guides/code-reuse-thinking-guide.md.txt`
- The current guide already explains when to abstract and when not to abstract, but does not include an explicit deletion-test heuristic.

## Requirements

- Add a concise deletion-test section to the code reuse thinking guide:
  - "If deleting the proposed abstraction would make the code clearer or only duplicate a small amount of simple logic, the abstraction is probably premature."
  - Prefer concrete wording and a fast checklist over abstract theory.
- Update both English and Chinese template sources.
- Update the local `.devflow/spec/guides/code-reuse-thinking-guide.md` dogfood copy if generated files are maintained in this repository.
- Keep the guidance aligned with the existing "When to Abstract" section rather than creating a separate competing framework.
- Preserve existing project-specific lessons already present in the local guide.

## Acceptance Criteria

- [ ] English markdown template includes the deletion-test heuristic.
- [ ] Chinese markdown template includes equivalent guidance.
- [ ] Local `.devflow/spec/guides/code-reuse-thinking-guide.md` includes the heuristic or the task documents why local dogfood specs are not updated directly.
- [ ] The new guidance fits near the existing abstraction/reuse decision sections.
- [ ] Validation includes targeted searches for the deletion-test wording and relevant template/spec tests if code changes are made.

## Out Of Scope

- Creating a new module-depth guide.
- Changing cross-layer thinking guidance.
- Refactoring the entire code reuse guide.
