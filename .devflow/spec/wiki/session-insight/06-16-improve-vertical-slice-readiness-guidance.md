<spec-entry
  id="insight-20260618-153433-06-16-improve-vertical-slice-readiness-guidance"
  type="session-insight"
  category="session"
  keywords="session-insight,finish-work,06-16-improve-vertical-slice-readiness-guidance,devflow,diff"
  source="finish-work"
  date="2026-06-18"
  task="06-16-improve-vertical-slice-readiness-guidance"
  package="devflow"
  branch="main"
  commits="7078229"
  derived_from=".devflow/tasks/archive/2026-06/06-16-improve-vertical-slice-readiness-guidance"
>

### Improve vertical slice readiness guidance

#### Summary

Updated devflow-brainstorm guidance across English template, Chinese overlay, and local dogfood skill with implementation-readiness, AFK-ready, and HITL-required planning labels. Validated with focused configurator/language parity tests, lint, typecheck, and diff check.

#### Task

- Path: `.devflow/tasks/archive/2026-06/06-16-improve-vertical-slice-readiness-guidance`
- Title: Improve vertical slice readiness guidance
- Why: Refine DevFlow planning guidance so child tasks are not just vertical slices, but implementation-ready slices with clear AFK/HITL expectations and no unresolved planning blockers.

#### Commits

- `7078229`

#### Changed Files

- `.agents/skills/devflow-brainstorm/SKILL.md`
- `.devflow/tasks/06-16-improve-vertical-slice-readiness-guidance/progress.json`
- `.devflow/tasks/06-16-improve-vertical-slice-readiness-guidance/task.json`
- `packages/cli/src/templates/common/skills/brainstorm.md`
- `packages/cli/src/templates/zh/common/skills/brainstorm.md`

#### Referenced Specs

- (No task spec references found.)

#### Review

- Reviewed by: (not recorded)

#### Key Decisions

- HITL-required: the child still depends on a human decision, manual review,

#### Pitfalls

- Avoid adding issue-tracker triage state or full triage workflow.
- Avoid turning AFK/HITL into workflow statuses. They are planning labels only.

#### Invariants

- Updated devflow-brainstorm guidance across English template, Chinese overlay, and local dogfood skill with implementation-readiness, AFK-ready, and HITL-required planning labels...
- HITL-required: the child still depends on a human decision, manual review,
- HITL dependencies are explicit, including who must act and what unblocks work;
- HITL-required：child 仍依赖人工决策、人工 review、凭据/访问步骤、
- Clarify AFK-ready versus HITL-required work without adding new task statuses.
- Guidance distinguishes AFK-ready and HITL-required slices.
</spec-entry>
