---
name: devflow-use
description: "Guide developers and AI coding agents in using DevFlow as the development workflow. Use when a user asks how to use DevFlow, wants DevFlow best practices, is starting or resuming DevFlow-managed work, needs help choosing the right DevFlow phase/skill/command, or wants to keep tasks, specs, checks, commits, archives, and journals aligned."
---

# Use DevFlow

Use this skill to operate inside a DevFlow-managed project. Treat local project files as authoritative; this skill gives the operating model, not a replacement for `.devflow/workflow.md` or task artifacts.

## Core Model

DevFlow keeps development state in project files:

- `.devflow/workflow.md` defines the phase rules.
- `.devflow/tasks/` stores PRDs, designs, implementation plans, and active task state.
- `.devflow/spec/` stores coding conventions that must be read before edits.
- `.devflow/workspace/` stores session journals and reusable memory.
- Platform directories and `.agents/skills/` provide the AI-facing commands, skills, agents, hooks, and prompts.

Do not improvise a parallel workflow when these files exist. Read them, follow their current instructions, and update them when the work changes.

## Start Or Resume

1. Load current context with `python ./.devflow/scripts/get_context.py`.
2. Load the phase index with `python ./.devflow/scripts/get_context.py --mode phase`.
3. If there is an active task, continue from its status and artifacts.
4. If there is no active task, classify the request before creating one:
   - Simple conversation or small work: ask whether to create a DevFlow task.
   - Complex implementation: ask whether to create a DevFlow task and enter planning.
5. Prefer the project-provided `devflow-start` or `devflow-continue` skill/command when available; otherwise run the scripts directly.

## Plan Work

Use planning to remove ambiguity before code changes:

- Create a task only after user consent: `python ./.devflow/scripts/task.py create "<title>" --slug <slug>`.
- Keep `prd.md` focused on goals, requirements, constraints, acceptance criteria, and out-of-scope items.
- For complex tasks, add `design.md` for architecture and `implement.md` for the execution checklist.
- Inspect the repository before asking questions. Ask only for product intent, risk tolerance, or scope decisions the codebase cannot answer.
- Ask one high-value question at a time, with a recommended answer and trade-off.
- Start the task only after planning artifacts are ready: `python ./.devflow/scripts/task.py start <task-dir>`.

## Implement

Before editing, load the implementation context:

1. Read `prd.md`, then `design.md` and `implement.md` if present.
2. Run `python ./.devflow/scripts/get_context.py --mode packages`.
3. Read the relevant `.devflow/spec/<package>/<layer>/index.md` files.
4. Follow each relevant pre-development checklist and read the referenced specs.
5. Apply the smallest change that satisfies the task. Prefer existing project patterns over new abstractions.

Use `devflow-before-dev` when available. In inline modes, the main agent edits directly. In agent-dispatch modes, implementation and check agents must receive the active task path and load task context first.

## Check

Do not report completion until quality checks match the risk of the change:

- Re-read the changed files against the PRD, design, implementation plan, and relevant specs.
- Run focused tests for the touched behavior.
- Run lint, typecheck, and broader tests when the change affects shared behavior or user-facing workflows.
- Verify init/update template parity when changing generated files.
- Fix failures before moving to finish work.

Use `devflow-check` when available. Treat check output as evidence to verify, not as a substitute for reading the code.

## Preserve Knowledge

Update persistent knowledge when the work teaches a reusable rule:

- Put executable coding conventions in `.devflow/spec/`.
- Put task-specific decisions in the task artifacts.
- Put session outcomes in the journal during finish work.
- Use `devflow-update-spec` or `devflow-learn` when available.

Do not bury important project rules only in chat history.

## Finish

Finish work in order:

1. Confirm checks passed and the working tree only contains current-task changes.
2. Create logical work commits before archiving.
3. Archive the completed task with `python ./.devflow/scripts/task.py archive <task-name>`.
4. Record the session with `python ./.devflow/scripts/add_session.py --title "<title>" --commit "<hashes>" --summary "<summary>"`.

Use `devflow-finish-work` when available. Do not archive unrelated active tasks unless the user explicitly asks.

## Best Practices

- Keep PRD, design, implementation, checks, commits, archive, and journal in sync.
- Prefer lightweight PRD-only tasks for small scoped work; use design and implementation plans for complex work.
- Read specs before edits, not after.
- Use exact dates and concrete file paths in task notes when context matters.
- Keep unrelated user changes out of your commits.
- Do not bypass DevFlow just because the task feels familiar.
