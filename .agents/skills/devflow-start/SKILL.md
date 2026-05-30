---
name: devflow-start
description: "Initializes an AI development session by reading workflow guides, developer identity, git status, active tasks, and project guidelines from .devflow/. Classifies incoming tasks and routes to brainstorm, direct edit, or task workflow. Use when beginning a new coding session, resuming work, starting a new task, or re-establishing project context."
---

# Start Session

Initialize a DevFlow-managed development session. This platform has no session-start hook, so manually load the equivalent compact context by following these steps.

---

## Step 1: Current state
Identity, git status, current task, active tasks, journal location.

```bash
python ./.devflow/scripts/get_context.py
```

If this output includes a line beginning `DevFlow update available:`, copy the full line verbatim when summarizing session context. Do not shorten operational command hints.

## Step 2: Workflow overview
Compact Phase Index, request triage rules, planning artifact contract, and the step-detail command.

```bash
python ./.devflow/scripts/get_context.py --mode phase
```

Full guide in `.devflow/workflow.md` (read on demand).

## Step 3: Guideline indexes
Discover packages + spec layers, then read each relevant index file.

```bash
python ./.devflow/scripts/get_context.py --mode packages
cat .devflow/spec/guides/index.md
cat .devflow/spec/<package>/<layer>/index.md   # for each relevant layer
```

Index files list the specific guideline docs to read when you actually start coding.

## Step 4: Decide next action
From Step 1 you know the current task and status. Check the task directory:

- **Active task status `planning` + no `prd.md`** → Phase 1.1. Load the `devflow-brainstorm` skill.
- **Active task status `planning` + `prd.md` exists** → stay in Phase 1. Lightweight tasks can be PRD-only; complex tasks need `design.md` + `implement.md`. Load the relevant Phase 1 step detail before `task.py start`.
- **Active task status `in_progress`** → Phase 2 step 2.1. Load the step detail:
  ```bash
  python ./.devflow/scripts/get_context.py --mode phase --step 2.1 --platform codex
  ```
- **No active task** → classify first. For simple conversation / small task, ask only whether this turn should create a DevFlow task. For complex work, ask whether you may create a DevFlow task and enter planning. If the user says no, skip DevFlow for this session.

---

## Skill routing (quick reference)

| User intent | Skill |
|---|---|
| New feature / unclear requirements | `devflow-brainstorm` |
| About to write code | `devflow-before-dev` |
| Done coding / quality check | `devflow-check` |
| Stuck / fixed same bug multiple times | `devflow-break-loop` |
| Learned something worth capturing | `devflow-update-spec` |

Full rules + anti-rationalization table in `.devflow/workflow.md`.
