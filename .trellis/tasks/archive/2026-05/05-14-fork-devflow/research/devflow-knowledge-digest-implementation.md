# DevFlow Knowledge Digest Implementation

Date: 2026-05-26

## Summary

Implemented a DevFlow-native equivalent of Maestro `wiki-digest` as `devflow wiki digest [topic]`.

The command synthesizes the existing file-based knowledge index rather than introducing Maestro's dashboard or HTTP wiki layer. It scans `.devflow/spec`, `.devflow/tasks`, and `.devflow/workspace`, filters by topic/type/recentness, clusters entries into themes, reports graph health/gaps, and can persist a Markdown digest report.

## CLI Surface

- `devflow wiki digest [topic]`
- `--type <type>` filters by collection, entry type, category, or document shape.
- `--recent <days>` limits entries by spec-entry date or file mtime.
- `--format brief|full` optionally includes per-entry snippets.
- `--max-themes <n>` controls primary theme count before overflow grouping.
- `--report [path]` writes Markdown. With no explicit path, it resolves the active task and writes to `.devflow/tasks/<task>/research/knowledge-digest-<scope>-<date>.md`.
- `--json` returns structured digest plus optional report metadata.

## Design Notes

- Digest logic lives in `packages/cli/src/commands/knowledge/digest.ts`.
- Topic matching filters actual digest nodes before search ranking. This avoids unrelated entries entering only because `searchDocuments` gives every structured `<spec-entry>` a small base score.
- Markdown wrapper files are de-duplicated by using `bodyForKnowledgeGraphLinks()` so `<spec-entry>` bodies embedded in `learnings.md` do not count twice.
- Report persistence is opt-in. Plain digest runs remain read-only.
- Active-task report resolution reuses the knowledge command's session resolver and now tolerates a leading UTF-8 BOM in session JSON, which can appear on Windows when files are written by PowerShell.

## Verification

- `pnpm --filter @enpd/devflow test -- test/commands/knowledge.test.ts test/templates/devflow.test.ts`
- `pnpm --filter @enpd/devflow typecheck`
- `pnpm --filter @enpd/devflow lint`
- `pnpm --filter @enpd/devflow build`
- Compiled CLI smoke:
  - `devflow learn ... --json`
  - `devflow wiki digest digest --json`
  - `devflow wiki digest digest --report digest-report.md`
  - `devflow wiki digest digest --report` with an active task session

