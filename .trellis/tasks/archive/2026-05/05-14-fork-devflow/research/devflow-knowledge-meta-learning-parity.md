# DevFlow Knowledge Meta-Learning Parity

## Maestro Requirement

Maestro `wiki-connect` and `wiki-digest` persist meta-insights back into the
learning store after producing graph analysis or synthesis.

## DevFlow Adaptation

DevFlow keeps this persistence explicit:

- `devflow wiki connect --learn`
- `devflow wiki digest <topic> --learn`

The commands still write reports and issues only when their corresponding flags
are present. `--learn` appends a compact `<spec-entry type="learning">` to
`.devflow/spec/guides/learnings.md` with:

- `source="wiki-connect"` for connection-pass synthesis
- `source="wiki-digest"` for digest synthesis
- `category="technique"`
- focused keywords for search and filtering

## Loop Prevention

Generated `source="wiki-digest"` learning entries remain searchable through
`devflow learn search/list`, but they are excluded from future digest input.
This prevents digest synthesis from recursively summarizing its own summaries.

## Validation

- Unit regression verifies generated digest learnings are searchable but do not
  count as digest entries.
- Compiled CLI smoke verifies:
  - `wiki digest auth --learn --json` returns a learning id
  - a follow-up `wiki digest auth --json` still counts only source entries
  - `wiki connect --learn --json` returns a learning id
  - `learn list --keywords wiki-digest --json` finds the generated learning
