# DevFlow Knowledge Report Persistence Implementation

Date: 2026-05-26

## Summary

Added Maestro-style persisted reports for DevFlow knowledge graph maintenance commands.

The commands remain read-only unless the existing `--fix` flag is used. Report writing is separately opt-in through `--report [path]`, matching the new digest command behavior.

## CLI Surface

- `devflow wiki connect --report [path]`
- `devflow wiki connect --fix --report [path]`
- `devflow wiki cleanup --report [path]`
- `devflow wiki cleanup --fix --report [path]`

If `--report` is passed without a path, DevFlow resolves the active task and writes:

- `.devflow/tasks/<task>/research/knowledge-connections-<scope>-<date>.md`
- `.devflow/tasks/<task>/research/knowledge-cleanup-<scope>-<date>.md`

## Design Notes

- Shared report file writing and default task research paths live in `packages/cli/src/commands/knowledge/reports.ts`.
- Connection reports include baseline/projected health, all suggestions, dry-run/apply status, and skipped writes.
- Cleanup reports include before/after issue counts, issue tables, dry-run/fix status, removed links, and skipped removals.
- JSON output now includes a `report` field when a report is written.
- Text output prints `Report: <relative-path>` after the normal command summary.

## Verification

- `pnpm --filter @enpd/devflow test -- test/commands/knowledge.test.ts test/templates/devflow.test.ts`
- `pnpm --filter @enpd/devflow typecheck`
- `pnpm --filter @enpd/devflow lint`
- `pnpm --filter @enpd/devflow build`
- Compiled CLI smoke:
  - `devflow wiki connect --report connect-report.md`
  - `devflow wiki cleanup --report cleanup-report.md`
  - `devflow wiki cleanup --fix --report cleanup-fix-report.md`

