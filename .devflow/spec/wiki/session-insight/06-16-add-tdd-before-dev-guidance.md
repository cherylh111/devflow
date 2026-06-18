<spec-entry
  id="insight-20260618-225105-06-16-add-tdd-before-dev-guidance"
  type="session-insight"
  category="session"
  keywords="session-insight,finish-work,06-16-add-tdd-before-dev-guidance,devflow,diff"
  source="finish-work"
  date="2026-06-18"
  task="06-16-add-tdd-before-dev-guidance"
  package="devflow"
  branch="main"
  commits="0cb6294"
  derived_from=".devflow/tasks/archive/2026-06/06-16-add-tdd-before-dev-guidance"
>

### Add TDD guidance to before-dev

#### Summary

Added optional test-first guidance to devflow-before-dev across English template, Chinese overlay, and local dogfood skill. Guidance points to unit-test specs, uses a vertical red-green-refactor loop, and explicitly skips unsuitable work. Validated with focused template/language parity tests, lint, typecheck, and diff check.

#### Task

- Path: `.devflow/tasks/archive/2026-06/06-16-add-tdd-before-dev-guidance`
- Title: Add TDD guidance to before-dev
- Why: Add optional test-first guidance to `devflow-before-dev` so agents consider a red-green-refactor loop for behavior changes, while avoiding TDD pressure for tasks that are exploratory, documentation-only, or unsuitable for test-first work.

#### Commits

- `0cb6294`

#### Changed Files

- `.agents/skills/devflow-before-dev/SKILL.md`
- `.devflow/tasks/06-16-add-tdd-before-dev-guidance/progress.json`
- `.devflow/tasks/06-16-add-tdd-before-dev-guidance/task.json`
- `packages/cli/src/templates/common/skills/before-dev.md`
- `packages/cli/src/templates/zh/common/skills/before-dev.md`

#### Referenced Specs

- (No task spec references found.)

#### Review

- Reviewed by: (not recorded)

#### Key Decisions

- (No explicit markers found.)

#### Pitfalls

- Add optional test-first guidance to `devflow-before-dev` so agents consider a red-green-refactor loop for behavior changes, while avoiding TDD pressure for tasks that are explor...
- Avoid adding a new workflow phase or mandatory `devflow-tdd` skill.

#### Invariants

- If a loaded knowledge entry is required for this task and sub-agents will run later, add it to the task context manifest:
- parser/validator behavior, complex business logic, or refactors that must
- No new required workflow phase or task status is introduced.
</spec-entry>
