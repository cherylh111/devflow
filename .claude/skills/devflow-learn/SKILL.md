---
name: devflow-learn
description: "Capture reusable project knowledge discovered during a task. Use when an implementation, debug session, review, or discussion produces a lesson, caveat, recipe, decision, or searchable reference that should survive context compaction."
---

Use this skill when a task produces reusable knowledge that should remain available after the conversation is compacted.

DevFlow stores lightweight learnings as `<spec-entry>` blocks in `.devflow/spec/guides/learnings.md`. Installed projects use the local Python script for routine knowledge capture, search, and load; the global `devflow` CLI is only needed for advanced maintenance commands not listed here.

## Capture

Use the installed Python script for observations that are useful later but are not yet stable enough to become a mandatory coding rule.

```bash
python ./.devflow/scripts/knowledge.py learn "<insight>" --category learning --keywords keyword1,keyword2 --task current
python ./.devflow/scripts/knowledge.py learn "<small useful note>" --category tip --keywords keyword1,keyword2
python ./.devflow/scripts/knowledge.py list --keyword keyword1
python ./.devflow/scripts/knowledge.py search "<query>"
python ./.devflow/scripts/knowledge.py show <id>
```

Good candidates:

- A gotcha discovered during implementation or debugging
- A recurring workflow decision
- A project-specific caveat that should be searchable later
- A compact lesson that does not belong in a stricter package/layer spec yet
- A hard implementation or review rule that belongs in a specific `.devflow/spec/` markdown file
- A longer recipe, reference, decision, template, asset, or session handoff that belongs in structured knowledge

If the learning is a hard convention agents must obey during implementation, use `devflow-update-spec` or edit the relevant `.devflow/spec/` guide directly. The local script is for reusable knowledge entries, not broad spec rewrites.

## Query

Use these commands before relying on memory:

```bash
python ./.devflow/scripts/knowledge.py list --keyword <word>
python ./.devflow/scripts/knowledge.py search "<query>"
python ./.devflow/scripts/knowledge.py show <id>
python ./.devflow/scripts/knowledge.py load <id>
python ./.devflow/scripts/knowledge.py health
python ./.devflow/scripts/knowledge.py stats
python ./.devflow/scripts/knowledge.py list --type knowhow
python ./.devflow/scripts/knowledge.py search "<query>" --type knowhow
```

Prefer focused searches over loading whole files into context. Use `health` when malformed entries or duplicate IDs could explain missing search results. Advanced wiki CRUD, graph connection, cleanup, digest, and spec-add operations are CLI-only maintenance surfaces; use them deliberately only when the installed Python script is insufficient.

## Inject Into Tasks

When a search result is required context for an implementation or check sub-agent, add the entry id to the task JSONL manifest instead of copying the whole markdown file:

```bash
python ./.devflow/scripts/knowledge.py search "<query>"
python ./.devflow/scripts/knowledge.py load <id>
python ./.devflow/scripts/task.py add-context "$TASK_DIR" implement "knowledge:<id>" "<reason>"
python ./.devflow/scripts/task.py add-context "$TASK_DIR" check "knowledge:<id>" "<reason>"
```

Use `wiki:<id>` as an equivalent shorthand when the selected entry came from wiki knowledge. Hook-based platforms inject these entries automatically; pull-based platforms must run `python ./.devflow/scripts/knowledge.py load <id>` for each JSONL knowledge entry before continuing.
