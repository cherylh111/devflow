# DevFlow Knowledge Cleanup Implementation

Date: 2026-05-26

Implemented the DevFlow equivalent of Maestro `manage-wiki cleanup` for the
local knowledge graph. The behavior follows Maestro's safety split: cleanup
detects several issue classes, but `--fix` only mutates structured metadata
that DevFlow owns.

## Delivered

- Added `devflow knowledge cleanup` / `devflow wiki cleanup`.
- Cleanup detects:
  - broken structured `related` metadata
  - unresolved body wikilinks
  - orphan graph nodes
  - empty structured entry bodies
  - stale draft entries
- `cleanup --fix` removes only broken structured `related` targets from
  `<spec-entry>` blocks.
- Body wikilinks, empty entries, stale drafts, and orphans are reported but not
  auto-mutated or deleted.
- Generated `devflow-learn` skill and workflow text document cleanup commands
  and the narrow write scope.

## Validation

- `pnpm --filter @enpd/devflow test -- test/commands/knowledge.test.ts test/templates/devflow.test.ts test/configurators/shared.test.ts`
- `pnpm --filter @enpd/devflow lint`
- `pnpm --filter @enpd/devflow typecheck`
- `pnpm --filter @enpd/devflow build`
- Compiled CLI smoke test for `wiki cleanup --json`.
- Compiled CLI smoke test for `wiki cleanup --fix --json`, verifying broken
  `related` metadata is removed while unresolved body wikilinks remain reported.

## Deferred

- Deleting or rewriting arbitrary markdown files.
- Automatically fixing body wikilinks.
- Persisting cleanup reports to `.devflow/knowhow/` or task research files.
