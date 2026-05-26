# DevFlow Knowledge Writer Implementation

Date: 2026-05-26

## Summary

Added a safe file-based knowledge writer surface to cover the mutation commands present in Maestro `wiki.ts` without porting the dashboard/HTTP writer layer.

## CLI Surface

- `devflow wiki create --type <type> --slug <slug> --title <title> [--body|--body-file]`
- `devflow wiki update <id> [--title] [--body|--body-file] [metadata flags]`
- `devflow wiki append <container-id> --title <title> [--body|--body-file]`
- `devflow wiki remove-entry <id>`
- `devflow wiki delete <id>`

## Safety Boundaries

- `create` writes generated documents only under `.devflow/spec/wiki/<type>/<slug>.md`.
- `update`, `append`, and `remove-entry` operate on structured `<spec-entry>` blocks.
- `delete` removes generated `.devflow/spec/wiki/**` Markdown files, or removes a structured entry block by id.
- `delete` refuses arbitrary Markdown outside `.devflow/spec/wiki/**`.

This adapts Maestro's wiki mutation model to DevFlow's existing file-based knowledge store and avoids broad destructive behavior.

## Verification

- `pnpm --filter @enpd/devflow test -- test/commands/knowledge.test.ts test/templates/devflow.test.ts`
- `pnpm --filter @enpd/devflow typecheck`
- `pnpm --filter @enpd/devflow lint`
- `pnpm --filter @enpd/devflow build`
- Compiled CLI smoke:
  - `devflow wiki create ... --json`
  - `devflow wiki update ... --json`
  - `devflow wiki append ... --json`
  - `devflow wiki remove-entry ... --json`
  - `devflow wiki delete ... --json`
  - refused `devflow wiki delete file:.devflow/spec/guides/manual.md`

