# Update Skill Authoring Guidance

## Goal

Strengthen DevFlow's built-in skill authoring spec with practical guidance for SKILL.md length targets, deterministic utility scripts, and description routing quality.

## Background

The archived `06-13-research-skills-improvements` report identifies write-a-skill patterns as a P1 improvement. DevFlow already has `.devflow/spec/devflow/backend/skill-authoring.md`; this task should update that spec instead of adding a new meta-skill.

## Requirements

- Update `.devflow/spec/devflow/backend/skill-authoring.md`.
- Add a SKILL.md length target that encourages router-focused files and references for detail.
- Clarify exceptions for workflow checklists when a longer SKILL.md is justified.
- Add guidance for when bundled skills should include utility scripts.
- Reinforce that frontmatter descriptions are routing text and should include concrete triggers.
- Avoid changing runtime template loading or bundled skill directory mechanics.

## Acceptance Criteria

- [x] Skill authoring spec includes a SKILL.md length target.
- [x] Skill authoring spec includes utility script guidance.
- [x] Description guidance explains routing impact and trigger specificity.
- [x] Existing bundled-skill checklist remains consistent with the new guidance.
- [x] No production code changes are made unless needed for docs link integrity.

## Out Of Scope

- Creating a `devflow-write-a-skill` bundled skill.
- Enforcing length limits with automated tests.
- Rewriting existing skills solely to meet the new target.
