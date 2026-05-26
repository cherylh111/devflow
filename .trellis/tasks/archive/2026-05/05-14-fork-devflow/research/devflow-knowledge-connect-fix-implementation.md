# DevFlow Knowledge Connect Fix Implementation

Date: 2026-05-26

Implemented guarded write support for `devflow wiki connect --fix`. This moves
the DevFlow migration closer to Maestro `wiki-connect --fix` while keeping the
write scope narrow: only structured `<spec-entry>` sources are modified, and
only their `related` metadata is updated.

## Delivered

- Parsed `<spec-entry>` entries now retain source offsets so individual blocks
  can be replaced safely.
- Added `applyRelatedLinks()` to append missing `related` targets to structured
  entries.
- `devflow knowledge connect --fix` / `devflow wiki connect --fix` now applies
  top suggestions from the deterministic connect suggester.
- JSON and text output include applied and skipped link counts.
- Skips are reported for missing targets, missing structured sources, and
  existing links.
- Generated workflow and `devflow-learn` skill text now describe the intended
  dry-run-then-fix flow.

## Validation

- `pnpm --filter @enpd/devflow test -- test/commands/knowledge.test.ts test/templates/devflow.test.ts test/configurators/shared.test.ts`
- `pnpm --filter @enpd/devflow lint`
- `pnpm --filter @enpd/devflow typecheck`
- `pnpm --filter @enpd/devflow build`
- Compiled CLI smoke test for `wiki connect --fix --max 2 --json`.
- Compiled CLI smoke test verified the target markdown file gained `related`
  attributes and `wiki graph` reflected the new bidirectional links.

## Still Deferred

- Mutating arbitrary markdown/frontmatter entries.
- Cleanup/fix behavior for broken markdown links or stale documents.
- Digest/report persistence into `.devflow/knowhow/` or task research files.
