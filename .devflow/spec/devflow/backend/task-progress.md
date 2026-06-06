# Task Progress Recovery

## Scope

`task.py progress` manages advisory recovery state for a DevFlow task. It does
not replace `task.json.status`, lifecycle hooks, planning artifacts, JSONL
manifests, or validation evidence.

The task progress file lives at:

```text
.devflow/tasks/<task>/progress.json
```

Existing tasks without `progress.json` must remain valid. Recovery commands
must synthesize context from `task.json`, task artifacts, JSONL manifests, git
status, and workflow routing when the file is missing.

## Schema

The current schema is:

```json
{
  "schema_version": 1,
  "phase": "implement",
  "step": "2.1",
  "summary": "",
  "resume_hint": "",
  "current_item": null,
  "completed_items": [],
  "pending_items": [],
  "last_validation": null,
  "updated_at": "2026-06-06T00:00:00Z",
  "updated_by": "agent"
}
```

`phase` is progress-specific and uses `planning`, `implement`, `check`,
`finish`, or `blocked`. Do not add these values to `task.json.status`.

`step` is a workflow step id such as `1.4`, `2.1`, `2.2`, `3.1`, `3.3`, or
`3.4`.

`summary`, `resume_hint`, `current_item`, `completed_items`, `pending_items`,
and `last_validation` are compact recovery hints. They must not duplicate full
PRD, design, implementation, or test output.

## Commands

```bash
python ./.devflow/scripts/task.py progress init <task>
python ./.devflow/scripts/task.py progress set <task> <field> <value>
python ./.devflow/scripts/task.py progress recover [task]
python ./.devflow/scripts/task.py progress status [task] [--json]
```

`init` creates or refreshes `progress.json`. If the file already exists, it
keeps known progress fields, refreshes `schema_version`, `updated_at`, and
`updated_by`, and fills any missing fields from defaults.

`set` accepts only whitelisted fields. Unknown fields fail before writing. List
fields (`completed_items`, `pending_items`) must be JSON arrays of strings.
`phase` and `step` are validated against their enum / step-id contracts.

`recover` prints a human-readable recovery summary. `status --json` prints the
same data as JSON for tools.

When no task argument is supplied, recovery commands resolve the active task
through `common.active_task.resolve_active_task()`. If no active task exists,
they fail with a clear stderr message instead of guessing.

## Validation & Error Matrix

| Condition | Required behavior |
|---|---|
| Task argument resolves to no directory | Exit 1 and print `task directory not found` to stderr |
| Resolved task has no `task.json` | Exit 1 and print `task.json not found` to stderr |
| No task argument and no active task | Exit 1 and print `no active task; pass a task directory` to stderr |
| `progress.json` is missing during `recover` | Exit 0, synthesize context, and print an init hint |
| `progress.json` exists but is invalid JSON | Exit 1 for mutating commands; recovery output reports the progress error |
| `progress set` receives an unknown field | Exit 1 before writing |
| `progress set phase <value>` receives a value outside the enum | Exit 1 before writing |
| `progress set step <value>` receives a non-step id | Exit 1 before writing |
| `progress set completed_items/pending_items <value>` receives non-JSON or a non-string array | Exit 1 before writing |
| `progress status --json` succeeds | Print the same recovery context as structured JSON |

## Good / Base / Bad Cases

Good: a long-running implementation updates `step`, `current_item`, and
`last_validation` after implementation and check boundaries. A later
`/devflow:continue` reads `task.py progress recover`, sees the last verified
command, and resumes at the correct workflow step.

Base: a short or legacy task has no `progress.json`. `recover` still reports
`task.json.status`, artifact presence, JSONL curated-entry counts, git dirty
state, and a conservative next action.

Bad: `task.py start` refuses to run because `progress.json` is absent, or a
breadcrumb chooses the current workflow phase from `progress.phase` instead of
`task.json.status`. Both break lightweight compatibility and the existing
workflow-state contract.

## Workflow Integration

`/devflow:continue` should attempt `task.py progress recover` before falling
back to status/artifact routing. Missing `progress.json` is not a failure; it
is a hint to initialize progress state if the task is long-running.

Long implementation, check, and finish phases should update progress at
meaningful boundaries, for example:

```bash
python ./.devflow/scripts/task.py progress set <task> step 2.2
python ./.devflow/scripts/task.py progress set <task> current_item "Run focused regression tests."
python ./.devflow/scripts/task.py progress set <task> last_validation "{\"command\":\"pnpm test\",\"status\":\"passed\"}"
```

Do not make `task.py start`, `task.py archive`, or workflow breadcrumbs depend
on `progress.json`. The file is advisory and must preserve lightweight task
compatibility.

## Wrong vs Correct

### Wrong

```python
# Wrong: progress becomes a second status writer and can drift from breadcrumbs.
progress = read_json(task_dir / "progress.json")
if progress.get("phase") == "finish":
    task_json["status"] = "completed"
```

### Correct

```python
# Correct: task.json.status owns lifecycle; progress only adds resume hints.
task_json = read_json(task_dir / "task.json") or {}
progress = read_json(task_dir / "progress.json")
status = task_json.get("status", "unknown")
```

## Template Registration

`common/task_progress.py` is a generated script template. It must be present in
both:

- `.devflow/scripts/common/task_progress.py`
- `packages/cli/src/templates/devflow/scripts/common/task_progress.py`

It must also be registered in `packages/cli/src/templates/devflow/index.ts`
`SCRIPT_PATHS` so `devflow init` and `devflow update` install it.

## Tests Required

Changing task progress behavior requires focused coverage for:

- `progress init` creates valid JSON.
- Unknown fields fail and do not create or modify `progress.json`.
- Invalid `phase` or `step` values fail.
- `recover` works when `progress.json` is missing.
- `recover` reports artifact and JSONL context status.
- `archive` preserves `progress.json` as part of the task directory.
- Template registration includes `common/task_progress.py`.

## Do / Don't

Do:

- Keep the module standard-library Python.
- Use `pathlib.Path` and shared JSON helpers.
- Preserve legacy tasks with no `progress.json`.
- Keep recovery summaries compact and safe for repeated `/devflow:continue`
  use.

Don't:

- Use `progress.json` as a status writer.
- Add a lifecycle hook that mutates `task.json.status` for progress changes.
- Parse `implement.md` checkboxes as the source of truth unless the
  implementation-plan format is first standardized.
- Treat seed-only JSONL manifests as curated context entries.
