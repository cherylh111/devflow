# DevFlow tool-spec parity

Date: 2026-05-26

## Maestro source

- `workflows/tools-spec.md`
- `src/commands/knowhow.ts`
- `src/commands/spec.ts`
- `src/commands/wiki.ts`

Maestro treats tool specs as knowhow documents with `tool: true` metadata. The
consumer category is stored separately from the knowhow subtype, and tool
discovery flows through `spec load --category <category>`.

## DevFlow adaptation

DevFlow stores knowhow as structured `<spec-entry type="knowhow">` entries under
`.devflow/spec/wiki/knowhow/`. Tool specs are represented by:

- `tool="true"`
- `spec_category="<consumer category>"`
- optional `code_paths`

The command surface now supports the Maestro discovery path:

```bash
devflow knowhow add --type recipe --title "Tool" --body "..." --tool --category coding
devflow spec --category coding --keyword auth
devflow wiki list --tool --category coding
```

`devflow spec --category <category>` includes matching tool knowhow entries by
`spec_category`, while normal knowhow list/search still treats `category` as the
knowhow subtype unless `--tool` is used.

## Implementation notes

- `spec` loading now includes `knowhow` entries where `tool=true` and
  `spec_category` matches the requested category.
- `wiki list/search --tool` filters to tool knowhow entries and matches
  `--category` against `spec_category`.
- The writer omits empty optional list attrs such as `related` so generated
  knowhow entries do not serialize `related=""`.

## Validation

- `pnpm --filter @enpd/devflow test -- test/commands/knowledge.test.ts test/templates/devflow.test.ts`
- `pnpm --filter @enpd/devflow typecheck`
- `pnpm --filter @enpd/devflow lint`
- `pnpm --filter @enpd/devflow build`
- Compiled CLI smoke:
  - `devflow knowhow add --type recipe --slug auth-tool --title ... --body ... --tool --category coding --json`
  - `devflow spec --category coding --keyword auth --json`
  - `devflow wiki list --tool --category coding --json`

