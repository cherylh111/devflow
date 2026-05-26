# DevFlow Knowledge Connect Implementation

Date: 2026-05-26

Implemented the read-only DevFlow equivalent of Maestro `wiki-connect` link
discovery. This keeps the migration aligned with Maestro's knowledge graph
management workflow while avoiding automatic file mutation until DevFlow has a
separate write policy for `related` metadata.

## Delivered

- Added `devflow knowledge connect` / `devflow wiki connect`.
- The command supports `--dry-run`, `--scope`, `--min-similarity`, `--max`, and
  `--json`.
- `--fix` is intentionally rejected with exit code 2.
- Suggestions cover Maestro's main candidate classes:
  - orphan rescue
  - missing reverse links
  - two-hop transitive links
  - type bridges
- Scoring uses keyword overlap, title similarity, same-category bonus, type
  bridge bonus, and deterministic strategy bonuses.
- Projected graph health is computed by applying suggestions in memory only.
- Generated workflow and `devflow-learn` skill text mention
  `devflow wiki connect --dry-run`.

## Validation

- `pnpm --filter @enpd/devflow test -- test/commands/knowledge.test.ts test/templates/devflow.test.ts test/configurators/shared.test.ts`
- `pnpm --filter @enpd/devflow lint`
- `pnpm --filter @enpd/devflow typecheck`
- `pnpm --filter @enpd/devflow build`
- Compiled CLI smoke test for `wiki connect --dry-run --json`.
- Compiled CLI smoke test verifies `wiki connect --fix` exits with code 2.

## Deferred

- Auto-applying suggestions to `<spec-entry related="...">`.
- Report persistence into `.devflow/knowhow/` or task research artifacts.
- Full `manage-wiki cleanup --fix` behavior.
