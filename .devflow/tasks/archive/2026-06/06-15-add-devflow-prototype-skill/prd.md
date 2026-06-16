# Add devflow-prototype Bundled Skill

## Goal

Create a bundled `devflow-prototype` skill that lets DevFlow agents build throwaway prototypes during planning or research to answer high-risk design questions before committing to production implementation.

## Background

The archived `06-13-research-skills-improvements` report identifies prototype support as a P1 gap. The current repository has no `devflow-prototype` bundled skill under `packages/cli/src/templates/common/bundled-skills/` and no local dogfood copy under `.agents/skills/`.

The research recommendation says the skill should preserve the throwaway-first principle, route between logic and UI prototype branches, require findings capture in `research/`, and force an explicit delete/keep/rewrite decision so prototype code does not silently become production code.

## Requirements

- Add a new bundled skill named `devflow-prototype`.
- Keep `SKILL.md` short and router-focused, with trigger-specific frontmatter.
- Provide separate reference files for logic prototypes and UI prototypes.
- Provide a prototype findings template that records the question, evidence, findings, decision, and cleanup status.
- Integrate the skill into brainstorm guidance so agents consider prototyping only for high-risk design questions that code inspection and existing tests cannot answer.
- Keep the skill limited to Phase 1 planning/research use unless the task explicitly rolls back from implementation to planning for a sub-question.
- Require every prototype to be clearly throwaway, runnable by one project-native command, non-persistent by default, and explicit about whether the prototype code is deleted, temporarily kept, or rewritten properly.
- Synchronize English templates, Chinese templates, and local dogfood `.agents/skills/` where corresponding surfaces exist.
- Update tests that enumerate or verify bundled skill installation paths.
- Preserve the core DevFlow lifecycle; do not add new task statuses or workflow phases.

## Acceptance Criteria

- [x] `packages/cli/src/templates/common/bundled-skills/devflow-prototype/SKILL.md` exists with valid frontmatter and concise routing guidance.
- [x] `LOGIC.md`, `UI.md`, and `prototype-findings-template.md` exist under the bundled skill directory.
- [x] Chinese template parity exists under `packages/cli/src/templates/zh/common/bundled-skills/devflow-prototype/`.
- [x] Local dogfood `.agents/skills/devflow-prototype/SKILL.md` exists so this repository can use the skill immediately.
- [x] Brainstorm guidance mentions when to use `devflow-prototype` and requires findings in `research/` before implementation.
- [x] Tests that enumerate bundled skills include `devflow-prototype` and pass.
- [x] The implementation does not require manual configurator registration if existing bundled-skill directory discovery handles the new skill.
- [x] The parent roadmap task remains linked to this child task.

## Out Of Scope

- Building an actual prototype for a product feature.
- Adding a new DevFlow workflow phase or task status.
- Automatically promoting prototype code into production.
- Adding a `devflow-check` warning for stale `PROTOTYPE-DELETE-ME.md` markers; defer this to a later hardening task.
