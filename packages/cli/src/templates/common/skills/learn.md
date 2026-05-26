Use this skill when a task produces reusable knowledge that should remain available after the conversation is compacted.

DevFlow stores lightweight learnings as `<spec-entry>` blocks in `.devflow/spec/guides/learnings.md`. The CLI owns the file format and search behavior; this skill is only the workflow wrapper.

## Capture

Use `devflow learn` for observations that are useful later but are not yet stable enough to become a mandatory coding rule. `devflow knowledge learn` is the equivalent grouped form.

```bash
devflow learn "<insight>" --category learning --keywords keyword1,keyword2 --task current
devflow learn tip "<small useful note>" --keywords keyword1,keyword2
devflow learn list --keywords keyword1
devflow learn search "<query>"
devflow learn show <id>
devflow spec add --layer <layer> --file <file.md> --title "<title>" --body "<rule>" --keywords keyword1,keyword2
devflow knowhow add --type recipe --title "<title>" --body "<markdown>" --keywords keyword1,keyword2
devflow knowhow list --type recipe
devflow knowhow search "<query>"
devflow knowhow get <id>
```

Good candidates:

- A gotcha discovered during implementation or debugging
- A recurring workflow decision
- A project-specific caveat that should be searchable later
- A compact lesson that does not belong in a stricter package/layer spec yet
- A hard implementation or review rule that belongs in a specific `.devflow/spec/` markdown file
- A longer recipe, reference, decision, template, asset, or session handoff that belongs in `devflow knowhow`

If the learning is a hard convention agents must obey during implementation, use `devflow-update-spec` or `devflow spec add` to write it into the relevant `.devflow/spec/` guide.

## Query

Use these commands before relying on memory:

```bash
devflow knowledge list --keyword <word>
devflow knowledge search "<query>"
devflow knowledge show <id>
devflow knowledge health
devflow knowledge stats
devflow spec init
devflow spec list
devflow spec status
devflow spec --category <name> --keyword <word>
devflow knowledge list --type knowhow
devflow knowledge search "<query>" --type knowhow
devflow wiki create --type note --slug <slug> --title "<title>" --body "<body>"
devflow wiki update <id> --title "<title>" --body "<body>"
devflow wiki append <container-id> --title "<title>" --body "<body>"
devflow wiki remove-entry <id>
devflow wiki delete <id>
devflow wiki graph
devflow wiki backlinks <id>
devflow wiki forward <id>
devflow wiki hubs
devflow wiki graph-health
devflow wiki connect --dry-run --report
devflow wiki connect --fix --report --learn
devflow wiki cleanup
devflow wiki cleanup --fix --report
devflow wiki digest <topic> --report --learn
devflow wiki digest <topic> --create-issues --report --learn
```

Prefer focused searches over loading whole files into context. Use `health` when malformed entries or duplicate IDs could explain missing search results, use `devflow knowhow add` for longer reusable recipes/references/decisions/templates, use `wiki create/update/append/remove-entry/delete` for deliberate structured knowledge edits, use the `wiki` graph commands when you need to inspect relationships between entries, run `wiki connect --dry-run` before `wiki connect --fix` applies `related` links to structured entries, run `wiki cleanup --fix` only to remove broken structured `related` metadata, use `wiki digest --report` when a task needs a persisted synthesis under its `research/` directory, add `--create-issues` when digest gaps should become searchable `issue` entries under `.devflow/spec/wiki/issue/`, and add `--learn` when connect or digest synthesis should be recorded as a reusable learning.
