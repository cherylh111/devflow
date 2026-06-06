<spec-entry
  id="insight-20260606-115733-06-06-prd-convergence-gate"
  type="session-insight"
  category="session"
  keywords="session-insight,finish-work,06-06-prd-convergence-gate,devflow,diff"
  source="finish-work"
  date="2026-06-06"
  task="06-06-prd-convergence-gate"
  package="devflow"
  branch="main"
  commits="2fd1429"
  derived_from=".devflow/tasks/archive/2026-06/06-06-prd-convergence-gate"
>

### PRD convergence start gate

#### Summary

Added a deterministic PRD convergence check to task.py start, updated workflow and brainstorm guidance across templates, added regression coverage for unresolved brainstorm headings and placeholder bullets, and refreshed the start-gate spec contract.

#### Task

- Path: `.devflow/tasks/archive/2026-06/06-06-prd-convergence-gate`
- Title: Add PRD convergence gate
- Why: Add a planning-stage PRD convergence gate so brainstorm output is deduplicated and normalized before task activation. The gate should prevent working-state brainstorm notes from entering implementation as a fragmented or repetitive PRD.

#### Commits

- `2fd1429`

#### Changed Files

- `.agents/skills/devflow-brainstorm/SKILL.md`
- `.devflow/scripts/task.py`
- `.devflow/spec/devflow/backend/workflow-state-contract.md`
- `.devflow/tasks/06-06-prd-convergence-gate/check.jsonl`
- `.devflow/tasks/06-06-prd-convergence-gate/design.md`
- `.devflow/tasks/06-06-prd-convergence-gate/implement.jsonl`
- `.devflow/tasks/06-06-prd-convergence-gate/implement.md`
- `.devflow/tasks/06-06-prd-convergence-gate/prd.md`
- `.devflow/tasks/06-06-prd-convergence-gate/research/issue-320-root-cause.md`
- `.devflow/tasks/06-06-prd-convergence-gate/task.json`
- `.devflow/workflow.md`
- `marketplace/workflows/native/workflow.md`
- `packages/cli/src/templates/codex/skills/brainstorm/SKILL.md`
- `packages/cli/src/templates/common/skills/brainstorm.md`
- `packages/cli/src/templates/copilot/prompts/brainstorm.prompt.md`
- `packages/cli/src/templates/devflow/scripts/task.py`
- `packages/cli/src/templates/devflow/workflow.md`
- `packages/cli/src/templates/zh/codex/skills/brainstorm/SKILL.md`
- `packages/cli/src/templates/zh/common/skills/brainstorm.md`
- `packages/cli/src/templates/zh/copilot/prompts/brainstorm.prompt.md`
- `packages/cli/src/templates/zh/devflow/workflow.md`
- `packages/cli/test/regression.test.ts`

#### Referenced Specs

- (No task spec references found.)

#### Review

- Reviewed by: (not recorded)

#### Key Decisions

- (No explicit markers found.)

#### Pitfalls

- Avoid warnings initially unless there is a clear non-blocking action. The start gate already supports warnings, but warnings are easy to ignore and do not solve the issue.
- Requirements and acceptance criteria must avoid obvious unresolved placeholders.
- Keep script validation deterministic and conservative to avoid false positives on valid lightweight PRDs.
- Avoid changing unrelated task lifecycle behavior.
- Reported problem: brainstorm output can leave duplicated and fragmented content in `prd.md`.

#### Invariants

- Added a deterministic PRD convergence check to task.py start, updated workflow and brainstorm guidance across templates, added regression coverage for unresolved brainstorm head...
- `prd.md` must be converged before start. It must not contain unresolved
- `prd.md` must not contain unresolved placeholder bullets such as `- TBD`,
- This task changes the planning contract and the `task.py start` gate. It does not add a new lifecycle command and does not change task status transitions.
- Run focused tests for workflow invariants and task start gate behavior.
- Start gate changes must keep `--force` behavior intact.
</spec-entry>
