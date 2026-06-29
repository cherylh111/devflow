# Add Project-Local Conventions

Often the user does not need to change DevFlow mechanics; they need local AI to understand their team's conventions. In that case, prefer `.devflow/spec/` or a project-local skill instead of editing `devflow-meta`.

## Where To Put Things

| Content type | Location |
| --- | --- |
| Rules code must follow | `.devflow/spec/<layer>/` |
| Cross-layer thinking methods | `.devflow/spec/guides/` |
| AI capability for a project-specific flow | Platform-local skill |
| One-off task material | `.devflow/tasks/<task>/` |
| Session summary | `.devflow/workspace/<developer>/journal-N.md` |

## Create A Project-Local Skill

If the user wants AI to know "how this project customizes DevFlow," create a local skill:

```text
.claude/skills/devflow-local/
└── SKILL.md
```

Example:

```md
---
name: devflow-local
description: "Project-local DevFlow customizations for this repository. Use when changing this project's DevFlow workflow, hooks, local agents, or team-specific conventions."
---

# DevFlow Local

## Local Scope

This skill documents this repository's DevFlow customizations only.

## Custom Workflow Rules

- ...

## Local Hook Changes

- ...

## Local Agent Changes

- ...
```

For multi-platform projects, place equivalent versions in other platform skill directories, or use `.agents/skills/` for platforms that support the shared layer.

## Write To `.devflow/spec/`

If the content is a coding convention, write it to spec. Examples:

```text
.devflow/spec/backend/error-handling.md
.devflow/spec/frontend/components.md
.devflow/spec/guides/cross-platform-thinking-guide.md
```

After writing it, update the corresponding `index.md` so AI can find the new rule from the entry point.

## Make The Current Task Use New Conventions

After writing a spec, add it to the current task context:

```bash
python3 ./.devflow/scripts/task.py add-context <task> implement ".devflow/spec/backend/error-handling.md" "Error handling conventions"
python3 ./.devflow/scripts/task.py add-context <task> check ".devflow/spec/backend/error-handling.md" "Review error handling"
```

## Do Not Store Project-Private Rules In `devflow-meta`

`devflow-meta` is a public skill for understanding DevFlow architecture and local customization entry points. Put project-private content in:

- `.devflow/spec/`
- a project-local skill
- the current task
- workspace journal

This prevents future updates to DevFlow's built-in `devflow-meta` from overwriting the team's own conventions.
