# Auto Run Task Queue

Run the trusted-team fast path: process ready DevFlow tasks one after another without asking the user to manually invoke `{{CMD_REF:continue}}` between phases.

This command is an AI-driven runner, not a background daemon. You still perform the actual implementation, checks, knowledge review, commit, archive, and journal steps in the current session. Stop immediately when a task needs new product decisions, a check cannot be made green, the commit plan is rejected, or the user says to stop.

---

## Step 1: Load Runner Context

```bash
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode phase
{{PYTHON_CMD}} ./.devflow/scripts/task.py list --mine
```

If `--mine` fails because no developer is configured, run:

```bash
{{PYTHON_CMD}} ./.devflow/scripts/task.py list
```

## Step 2: Establish One-Time Run Approval

Before starting the first task, summarize the queue you found:

- current active task, if any
- ready `planning` tasks you intend to start
- `in_progress` tasks you intend to resume
- any skipped tasks and why

Ask once for approval to auto-run that queue. After approval, do not ask for another `/devflow:continue` between phases. Keep the existing Phase 3.4 commit-plan confirmation unless the user explicitly approved a concrete commit plan in advance.

Treat a task as ready only when:

- `prd.md` exists
- lightweight task: PRD is enough and does not contain unresolved `TBD`
- complex task: `prd.md`, `design.md`, and `implement.md` exist
- requirements are already discussed; no open product decision is visible

Skip tasks that are not ready. Report them in the final summary.

## Step 3: Process One Task

For each approved task, run the normal workflow without waiting for manual phase commands.

### A. Activate Or Resume

If there is no active task and the next task is still `planning`, start it:

```bash
{{PYTHON_CMD}} ./.devflow/scripts/task.py start <task-dir-or-name>
```

If a task is already active and `in_progress`, resume it.

Then load the step detail for implementation:

```bash
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode phase --step 2.1 --platform {{CLI_FLAG}}
```

### B. Implement

{{#AGENT_CAPABLE}}
Use the platform's normal Phase 2 route:

- sub-agent mode: dispatch `devflow-implement` with `Active task: <task path>` first in the prompt
- inline mode: load `devflow-before-dev` and edit directly

{{/AGENT_CAPABLE}}
{{^AGENT_CAPABLE}}
Load `devflow-before-dev` and edit directly.

{{/AGENT_CAPABLE}}
Read `prd.md`, then `design.md` if present, then `implement.md` if present. Consult `research/` when it exists.

### C. Check And Fix

Run Phase 2.2 and Phase 3.1 checks without waiting for a manual command:

```bash
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode phase --step 2.2 --platform {{CLI_FLAG}}
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode phase --step 3.1 --platform {{CLI_FLAG}}
```

Use `devflow-check`; fix any findings directly and rerun the relevant project checks until green. If checks reveal a requirements defect, stop the runner and return to planning for that task.

### D. Knowledge Review

Run the Phase 3.3 judgment:

```bash
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode phase --step 3.3 --platform {{CLI_FLAG}}
```

Capture reusable knowledge with `devflow-update-spec`, `devflow learn`, or wiki/knowhow commands when warranted. If there is nothing to record, state that conclusion briefly.

### E. Commit Work

Run Phase 3.4 exactly as written in `.devflow/workflow.md`:

```bash
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode phase --step 3.4 --platform {{CLI_FLAG}}
```

Do not skip the dirty-file classification. Do not commit unrecognized user changes. Present the batched commit plan and get the required one-shot confirmation before running `git add` / `git commit`.

### F. Finish Work

Run the finish-work flow immediately after the work commit is complete:

```bash
{{PYTHON_CMD}} ./.devflow/scripts/get_context.py --mode record
```

Then follow `{{CMD_REF:finish-work}}`:

1. classify dirty paths
2. archive the completed task with `task.py archive`
3. record the session journal with `add_session.py`

When finished, clear or refresh current context before selecting the next task:

```bash
{{PYTHON_CMD}} ./.devflow/scripts/task.py current --source
{{PYTHON_CMD}} ./.devflow/scripts/task.py list --mine
```

## Step 4: Continue Or Stop

Move to the next approved ready task and repeat Step 3.

Stop the runner when:

- the approved queue is empty
- the next task is not ready
- implementation or checks are blocked
- Phase 3.4 commit confirmation is rejected
- dirty files cannot be safely classified
- the user interrupts or redirects

## Final Report

Report:

- tasks completed and archived
- commits created for each task
- tasks skipped and why
- any checks that could not be run
