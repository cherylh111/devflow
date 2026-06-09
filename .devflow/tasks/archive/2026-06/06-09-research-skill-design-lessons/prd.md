# Research skill design lessons

## Goal

Apply the highest-confidence findings from the Matt Pocock skills comparison to DevFlow's own skill system without replacing DevFlow's workflow, task, spec, or quality-gate architecture.

## User Value

- DevFlow gains small, triggerable cognitive skills while preserving durable lifecycle control.
- Bug-fix work gets a pre-fix diagnosis loop before repeated failed fixes accumulate.
- Planning gets sharper parent/child vertical-slice guidance.
- Future bundled skills have a written authoring contract instead of relying on style memory.

## Requirements

- Use the local Matt Pocock skills checkout at `C:\Users\Admin\Desktop\AiWorker\skills` as evidence for the implementation shape.
- Add a DevFlow-native diagnosis capability based on the external `diagnose` loop, adapted to DevFlow task artifacts and spec update rules.
- Improve DevFlow planning guidance so `devflow-brainstorm` explicitly maps vertical-slice decomposition to parent/child tasks.
- Codify bundled skill authoring rules in DevFlow's backend specs:
  - concise `SKILL.md` as router
  - precise frontmatter descriptions
  - long detail in `references/`
  - no duplicated workflow truth inside skills
  - durable conventions belong in `.devflow/spec/`
- Update English and Chinese template surfaces when adding or changing bundled/common skills.
- Keep `.devflow/workflow.md` as the lifecycle source of truth.
- Keep implementation scoped to DevFlow templates, local dogfood skills/specs, tests, and task artifacts.

## Constraints

- Do not import Matt Pocock's skills verbatim; adapt ideas to DevFlow naming, lifecycle, task artifacts, and quality gates.
- Do not add external issue-tracker integration in this task.
- Do not replace `.devflow/tasks/` with issue tracker semantics.
- Do not introduce a second workflow state machine.
- Do not start broad refactors outside the touched skill/template/spec surfaces.

## Acceptance Criteria

- [x] A `devflow-diagnose` bundled skill exists in English and Chinese template trees.
- [x] The local dogfood `.agents/skills/devflow-diagnose/SKILL.md` exists for this repository's Codex/shared skill layer.
- [x] `devflow-diagnose` frontmatter has a specific trigger description and does not duplicate DevFlow's full lifecycle.
- [x] `devflow-brainstorm` planning guidance includes vertical-slice and parent/child task decomposition rules.
- [x] DevFlow backend specs include a bundled skill authoring contract.
- [x] Relevant configurator tests expect the new bundled skill and pass.
- [x] Validation includes focused template/configurator tests plus lint/typecheck if feasible.

## Out Of Scope

- TDD, prototype, zoom-out, or grill-with-docs bundled skills as separate new skills.
- External issue tracker label setup or publishing issues.
- Changing task lifecycle states or workflow-state parser behavior.
- Archiving this task before user review.
