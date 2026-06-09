<spec-entry
  id="insight-20260609-201135-06-09-research-skill-design-lessons"
  type="session-insight"
  category="session"
  keywords="session-insight,finish-work,06-09-research-skill-design-lessons,devflow,diff"
  source="finish-work"
  date="2026-06-09"
  task="06-09-research-skill-design-lessons"
  package="devflow"
  branch="main"
  commits="77814f2"
  derived_from=".devflow/tasks/archive/2026-06/06-09-research-skill-design-lessons"
>

### Add DevFlow diagnose skill

#### Summary

Compared Matt Pocock's skill design with DevFlow, added devflow-diagnose as a bundled/common skill, improved brainstorm vertical-slice task guidance, surfaced diagnosis in workflow routing, and captured skill/workflow authoring specs.

#### Task

- Path: `.devflow/tasks/archive/2026-06/06-09-research-skill-design-lessons`
- Title: Research skill design lessons
- Why: Apply the highest-confidence findings from the Matt Pocock skills comparison to DevFlow's own skill system without replacing DevFlow's workflow, task, spec, or quality-gate architecture.

#### Commits

- `77814f2`

#### Changed Files

- `.agents/skills/devflow-brainstorm/SKILL.md`
- `.agents/skills/devflow-diagnose/SKILL.md`
- `.devflow/spec/devflow/backend/commands-workflow.md`
- `.devflow/spec/devflow/backend/index.md`
- `.devflow/spec/devflow/backend/skill-authoring.md`
- `.devflow/tasks/06-09-research-skill-design-lessons/check.jsonl`
- `.devflow/tasks/06-09-research-skill-design-lessons/design.md`
- `.devflow/tasks/06-09-research-skill-design-lessons/implement.jsonl`
- `.devflow/tasks/06-09-research-skill-design-lessons/implement.md`
- `.devflow/tasks/06-09-research-skill-design-lessons/prd.md`
- `.devflow/tasks/06-09-research-skill-design-lessons/progress.json`
- `.devflow/tasks/06-09-research-skill-design-lessons/research/adoption-matrix.md`
- `.devflow/tasks/06-09-research-skill-design-lessons/research/devflow-framework-inventory.md`
- `.devflow/tasks/06-09-research-skill-design-lessons/research/initial-comparison.md`
- `.devflow/tasks/06-09-research-skill-design-lessons/research/mattpocock-skills-inventory.md`
- `.devflow/tasks/06-09-research-skill-design-lessons/task.json`
- `.devflow/workflow.md`
- `marketplace/workflows/channel-driven-subagent-dispatch/workflow.md`
- `marketplace/workflows/native/workflow.md`
- `marketplace/workflows/tdd/workflow.md`
- `packages/cli/src/templates/common/bundled-skills/devflow-diagnose/SKILL.md`
- `packages/cli/src/templates/common/skills/brainstorm.md`
- `packages/cli/src/templates/devflow/workflow.md`
- `packages/cli/src/templates/zh/common/bundled-skills/devflow-diagnose/SKILL.md`
- `packages/cli/src/templates/zh/common/skills/brainstorm.md`
- `packages/cli/src/templates/zh/devflow/workflow.md`
- `packages/cli/test/commands/init.integration.test.ts`
- `packages/cli/test/configurators/index.test.ts`
- `packages/cli/test/configurators/platforms.test.ts`

#### Referenced Specs

- (No task spec references found.)

#### Review

- Reviewed by: (not recorded)

#### Key Decisions

- It deliberately does not implement every idea from the decision report.
- # Decision Report: Skill Design Lessons For DevFlow
- ## Executive Decision
- ## Decision Matrix
- | Idea | Decision | Priority | Why | DevFlow mapping |
- It must require a decision about whether prototype code is discarded, rewritten, or promoted.

#### Pitfalls

- description: "Run a disciplined pre-fix diagnosis loop for bugs, failing tests, broken behavior, errors, crashes, flaky behavior, or performance regressions in a DevFlow-managed...
- Use this skill before changing code for a bug unless the root cause and fix are already proven by existing evidence. The goal is a fast, deterministic feedback loop that lets th...
- This skill complements `devflow-break-loop`: use `devflow-diagnose` before and during the fix; use `devflow-break-loop` after repeated failed fixes or when the final lesson need...
- Read relevant `research/` notes if the task already has debugging evidence.
- If there is no active task and the bug work is more than a trivial answer, return to DevFlow planning before making code changes.
- failing unit or integration test at the real bug seam

#### Invariants

- whether human review is required before implementation
- Dependencies must be written in child artifacts. Do not rely on tree position to imply ordering.
- update `.devflow/spec/` when the fix reveals a reusable rule, contract, or prevention mechanism
- Shared lifecycle or skill-routing guidance changes must audit every
- ## Contracts
- `SKILL.md` must stay focused on:
</spec-entry>
