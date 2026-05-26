# DevFlow Knowhow Command Parity

## Maestro Requirement

Maestro has a first-class `knowhow` command for reusable long-form knowledge:

- `maestro knowhow add`
- `maestro knowhow list`
- `maestro knowhow search`
- `maestro knowhow get`

Its workflow stores recipes, references, decisions, templates, assets,
blueprints, tips, and session handoffs under `.workflow/knowhow/`, then exposes
them through the unified wiki index.

## DevFlow Adaptation

DevFlow now provides:

- `devflow knowhow add`
- `devflow knowhow list`
- `devflow knowhow search`
- `devflow knowhow get`
- alias: `devflow kh`

The command reuses DevFlow's existing structured knowledge store instead of
adding a parallel `.devflow/knowhow` parser:

- storage path: `.devflow/spec/wiki/knowhow/<slug>.md`
- entry type: `<spec-entry type="knowhow">`
- subtype: `category="recipe|reference|decision|..."`
- source: `source="knowhow"`

This keeps knowhow visible to `devflow wiki list/search/show/load`,
`wiki graph`, `wiki connect`, `wiki cleanup`, `wiki digest`, and `wiki stats`.

## Metadata

Knowhow-specific metadata is preserved as structured entry attributes:

- `lang`
- `source_ref`
- `asset_type`
- `code_paths`
- `tool`
- `spec_category`

`code_paths` is parsed as a list attribute so JSON reads preserve the original
array instead of collapsing it into an opaque comma-separated string.

## Validation

- Unit regression covers structured knowhow storage, extended attrs,
  `type=knowhow` filtering, and search.
- Template regression confirms the workflow mentions `devflow knowhow add`.
- Compiled CLI smoke verifies:
  - `devflow knowhow add --json`
  - `devflow knowhow list --type recipe --json`
  - `devflow knowhow search middleware --json`
  - `devflow knowhow get <id> --json`
  - `devflow wiki search middleware --type knowhow --json`
