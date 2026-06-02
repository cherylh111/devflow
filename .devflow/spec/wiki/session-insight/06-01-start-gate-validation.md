<spec-entry
  id="insight-20260602-103716-06-01-start-gate-validation"
  type="session-insight"
  category="session"
  keywords="session-insight,finish-work,06-01-start-gate-validation,devflow,diff"
  source="finish-work"
  date="2026-06-02"
  task="06-01-start-gate-validation"
  package="devflow"
  branch="main"
  commits="5bc36bc"
  derived_from=".devflow/tasks/archive/2026-06/06-01-start-gate-validation"
>

### Start gate validation

#### Summary

Implemented and validated task start gate checks, including PRD placeholder rejection, complex-task artifact requirements, force bypass, and sub-agent manifest handling while keeping Codex inline JSONL optional.

#### Task

- Path: `.devflow/tasks/archive/2026-06/06-01-start-gate-validation`
- Title: Start gate validation

#### Commits

- `5bc36bc`

#### Changed Files

- `.devflow/scripts/task.py`
- `.devflow/spec/devflow/backend/workflow-state-contract.md`
- `.devflow/tasks/06-01-start-gate-validation/check.jsonl`
- `.devflow/tasks/06-01-start-gate-validation/design.md`
- `.devflow/tasks/06-01-start-gate-validation/implement.jsonl`
- `.devflow/tasks/06-01-start-gate-validation/implement.md`
- `.devflow/tasks/06-01-start-gate-validation/prd.md`
- `.devflow/tasks/06-01-start-gate-validation/task.json`
- `.devflow/workflow.md`
- `marketplace/workflows/native/workflow.md`
- `packages/cli/src/templates/devflow/scripts/task.py`
- `packages/cli/src/templates/devflow/workflow.md`
- `packages/cli/src/templates/zh/devflow/workflow.md`
- `packages/cli/test/regression.test.ts`
- `packages/cli/test/templates/language-parity.test.ts`

#### Referenced Specs

- (No task spec references found.)

#### Review

- Reviewed by: (not recorded)

#### Key Decisions

- (No explicit markers found.)

#### Pitfalls

- print(colored("Error: Start gate validation failed", Colors.RED), file=sys.stderr)
- | Any validation failure with `--force` | Print warning + errors, then continue |
- expect(result.stderr).toContain("Start gate validation failed");

#### Invariants

- Reason: `cmd_start` is a status writer. It must not silently advance an
- under-planned task, but it must preserve inline workflows that do not use
- ### 3. Contracts
- `prd.md` is always required and must not be the untouched generated template
- `requires_subagent_context` unset. Missing or seed-only JSONL must not block
- | Condition | Required behavior |
</spec-entry>
