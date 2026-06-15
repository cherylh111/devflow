# Sync Evidence-First Brainstorm Template

## Goal

Ensure the evidence-first requirement for DevFlow brainstorming is consistently shipped across source templates, localized templates, and local dogfood skills.

## Background

The archived `06-13-research-skills-improvements` report marked evidence-first template sync as a P0 item because it found the local dogfood brainstorm skill had a mandatory evidence rule while the shipped brainstorm template did not.

Current repository inspection shows the finding has at least partially changed:

- `.agents/skills/devflow-brainstorm/SKILL.md` contains `## Non-Negotiable Evidence Rule`.
- `packages/cli/src/templates/common/skills/brainstorm.md` contains `## Non-Negotiable Evidence Rule`.
- `packages/cli/src/templates/zh/common/skills/brainstorm.md` contains `## 不可协商的证据规则`.

This task should verify and close the parity gap against the current repository state, rather than assuming the original report is still fully accurate.

## Requirements

- Verify every shipped DevFlow brainstorm surface that users can receive from `devflow init` / `devflow update` includes the evidence-first rule.
- Verify English and Chinese templates express the same behavioral contract:
  - inspect codebase evidence before asking user questions;
  - do not ask users to confirm repository-answerable facts;
  - ask only for product intent, preferences, scope, risk tolerance, or ambiguous decisions after inspection.
- Verify local dogfood `.agents/skills/devflow-brainstorm/SKILL.md` remains aligned with the source templates except for platform-specific placeholders such as `{{PYTHON_CMD}}`.
- If a generated/platform-specific surface is still missing the rule, update it and add or adjust tests that would catch future drift.
- If no source or generated surface is missing the rule, record that the P0 finding has already been resolved and archive the child task with validation evidence.

## Acceptance Criteria

- [x] A repository search identifies all active brainstorm template/skill surfaces.
- [x] English source template, Chinese source template, and local dogfood skill all include evidence-first guidance.
- [x] Any missing generated/platform-specific brainstorm surface is updated, or the task documents that none are missing.
- [x] Validation includes at least a targeted repository search and the relevant template/configurator test command if code changes are made.
- [x] The task notes the divergence between the 06-13 research finding and the current code state.

## Out Of Scope

- Rewriting the broader brainstorm workflow.
- Adding new planning phases.
- Changing task creation or activation rules.
