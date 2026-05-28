<!-- DEVFLOW:START -->
# DevFlow 使用说明

These instructions are for AI assistants working in this project.

This project is managed by DevFlow. The working knowledge you need lives under `.devflow/`:

- `.devflow/workflow.md` — development phases, when to create tasks, skill routing
- `.devflow/spec/` — package- and layer-scoped coding guidelines (read before writing code in a given layer)
- `.devflow/workspace/` — per-developer journals and session traces
- `.devflow/tasks/` — active and archived tasks (PRDs, research, jsonl context)

If a DevFlow command is available on your platform (e.g. `/devflow:finish-work`, `/devflow:continue`), prefer it over manual steps. Not every platform exposes every command.

If you're using Codex or another agent-capable tool, additional project-scoped helpers may live in:
- `.agents/skills/` — reusable DevFlow skills
- `.codex/agents/` — optional custom subagents

Managed by DevFlow. Edits outside this block are preserved; edits inside may be overwritten by a future `devflow update`.

<!-- DEVFLOW:END -->
