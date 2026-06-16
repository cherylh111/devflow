<spec-entry
  id="insight-20260616-095725-06-15-add-devflow-prototype-skill"
  type="session-insight"
  category="session"
  keywords="session-insight,finish-work,06-15-add-devflow-prototype-skill,devflow,diff"
  source="finish-work"
  date="2026-06-16"
  task="06-15-add-devflow-prototype-skill"
  package="devflow"
  branch="main"
  commits="b5a45ee,6e5e050"
  derived_from=".devflow/tasks/archive/2026-06/06-15-add-devflow-prototype-skill"
>

### Add devflow prototype skill

#### Summary

Added the bundled devflow-prototype skill with English and Chinese templates, local dogfood copy, brainstorm routing guidance, and configurator/init test coverage. Validation passed with focused tests, lint, typecheck, diff check, and the full CLI suite.

#### Task

- Path: `.devflow/tasks/archive/2026-06/06-15-add-devflow-prototype-skill`
- Title: Add devflow-prototype bundled skill
- Why: Create a bundled `devflow-prototype` skill that lets DevFlow agents build throwaway prototypes during planning or research to answer high-risk design questions before committing to production implementation.

#### Commits

- `b5a45ee`
- `6e5e050`

#### Changed Files

- `.agents/skills/devflow-brainstorm/SKILL.md`
- `.agents/skills/devflow-prototype/LOGIC.md`
- `.agents/skills/devflow-prototype/SKILL.md`
- `.agents/skills/devflow-prototype/UI.md`
- `.agents/skills/devflow-prototype/prototype-findings-template.md`
- `.devflow/tasks/06-15-add-devflow-prototype-skill/check.jsonl`
- `.devflow/tasks/06-15-add-devflow-prototype-skill/design.md`
- `.devflow/tasks/06-15-add-devflow-prototype-skill/implement.jsonl`
- `.devflow/tasks/06-15-add-devflow-prototype-skill/implement.md`
- `.devflow/tasks/06-15-add-devflow-prototype-skill/prd.md`
- `.devflow/tasks/06-15-add-devflow-prototype-skill/progress.json`
- `.devflow/tasks/06-15-add-devflow-prototype-skill/task.json`
- `.devflow/tasks/06-15-skills-improvements-roadmap/design.md`
- `.devflow/tasks/06-15-skills-improvements-roadmap/implement.md`
- `.devflow/tasks/06-15-skills-improvements-roadmap/prd.md`
- `.devflow/tasks/06-15-skills-improvements-roadmap/task.json`
- `packages/cli/src/templates/common/bundled-skills/devflow-prototype/LOGIC.md`
- `packages/cli/src/templates/common/bundled-skills/devflow-prototype/SKILL.md`
- `packages/cli/src/templates/common/bundled-skills/devflow-prototype/UI.md`
- `packages/cli/src/templates/common/bundled-skills/devflow-prototype/prototype-findings-template.md`
- `packages/cli/src/templates/common/skills/brainstorm.md`
- `packages/cli/src/templates/zh/common/bundled-skills/devflow-prototype/LOGIC.md`
- `packages/cli/src/templates/zh/common/bundled-skills/devflow-prototype/SKILL.md`
- `packages/cli/src/templates/zh/common/bundled-skills/devflow-prototype/UI.md`
- `packages/cli/src/templates/zh/common/bundled-skills/devflow-prototype/prototype-findings-template.md`
- `packages/cli/src/templates/zh/common/skills/brainstorm.md`
- `packages/cli/test/commands/init.integration.test.ts`
- `packages/cli/test/configurators/index.test.ts`
- `packages/cli/test/configurators/platforms.test.ts`

#### Referenced Specs

- (No task spec references found.)

#### Review

- Reviewed by: (not recorded)

#### Key Decisions

- decision;
- the decision for real implementation;
- ## Cleanup Decision
- Before ending the session, make one explicit decision:
- Do not polish visual details that are unrelated to the decision.
- ## Decision

#### Pitfalls

- ## What To Avoid
- what worked, what failed, and why;
- Human review: recommended before implementation because wording affects debugging workflow.

#### Invariants

- The prototype must produce findings in the task `research/` directory before implementation starts.
- Never let prototype code silently become production.
- Which interaction model best exposes the required state?
- Remove newly added `devflow-prototype` files and revert brainstorm/test edits. No migration or task-state rollback should be required if implementation has not shipped.
</spec-entry>
