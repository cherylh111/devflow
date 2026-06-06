<spec-entry
  id="insight-20260606-154151-06-06-research-external-skills-patterns"
  type="session-insight"
  category="session"
  keywords="session-insight,finish-work,06-06-research-external-skills-patterns,devflow,diff"
  source="finish-work"
  date="2026-06-06"
  task="06-06-research-external-skills-patterns"
  package="devflow"
  branch="main"
  commits="0eeb102"
  derived_from=".devflow/tasks/archive/2026-06/06-06-research-external-skills-patterns"
>

### Task progress recovery state

#### Summary

Added task progress recovery state via progress.json and task.py progress commands; updated continue/workflow templates, specs, and regression tests.

#### Task

- Path: `.devflow/tasks/archive/2026-06/06-06-research-external-skills-patterns`
- Title: Research external skills patterns

#### Commits

- `0eeb102`

#### Changed Files

- `.agents/skills/devflow-continue/SKILL.md`
- `.devflow/scripts/common/task_progress.py`
- `.devflow/scripts/task.py`
- `.devflow/spec/devflow/backend/index.md`
- `.devflow/spec/devflow/backend/task-progress.md`
- `.devflow/tasks/06-06-research-external-skills-patterns/check.jsonl`
- `.devflow/tasks/06-06-research-external-skills-patterns/design.md`
- `.devflow/tasks/06-06-research-external-skills-patterns/implement.jsonl`
- `.devflow/tasks/06-06-research-external-skills-patterns/implement.md`
- `.devflow/tasks/06-06-research-external-skills-patterns/prd.md`
- `.devflow/tasks/06-06-research-external-skills-patterns/progress.json`
- `.devflow/tasks/06-06-research-external-skills-patterns/research/external-skills-and-progress-state.md`
- `.devflow/tasks/06-06-research-external-skills-patterns/task.json`
- `.devflow/workflow.md`
- `marketplace/workflows/native/workflow.md`
- `packages/cli/src/templates/common/commands/continue.md`
- `packages/cli/src/templates/devflow/index.ts`
- `packages/cli/src/templates/devflow/scripts/common/task_progress.py`
- `packages/cli/src/templates/devflow/scripts/task.py`
- `packages/cli/src/templates/devflow/workflow.md`
- `packages/cli/src/templates/zh/common/commands/continue.md`
- `packages/cli/src/templates/zh/devflow/workflow.md`
- `packages/cli/test/regression.test.ts`

#### Referenced Specs

- (No task spec references found.)

#### Review

- Reviewed by: (not recorded)

#### Key Decisions

- (No explicit markers found.)

#### Pitfalls

- return {"available": False, "summary": stderr.strip() or "git status failed"}
- print(f"Error: failed to write {PROGRESS_FILE}", file=sys.stderr)
- back to status/artifact routing. Missing `progress.json` is not a failure; it
- debugging 与 TDD skills 强调反馈循环、通过公共接口验证行为，以及一次只推进一个垂直切片。
- `diagnose` 的反馈循环纪律可以在未来成为 `devflow-diagnose` skill，也可以被并入 `devflow-break-loop`，用于 bug fix 前的诊断。它有价值，但不是 Trellis #326 的最直接答案。
- 在创建或拆分任务前，对任务进行 intake：这是 bug、enhancement、research 还是 workflow change。

#### Invariants

- return f"{field} must be a string"
- return f"{field} must be a JSON array of strings"
- return None, f"{field} must be valid JSON"
- return None, f"{field} must be valid JSON or a plain string"
- print("Error: progress subcommand required", file=sys.stderr)
- Existing tasks without `progress.json` must remain valid. Recovery commands
</spec-entry>
