# DevFlow Knowledge Graph Implementation

Date: 2026-05-26

Implemented an additional read-only wiki graph projection on top of the local
DevFlow knowledge scanner. This ports the low-risk Maestro wiki graph surface
without adopting Maestro dashboard, HTTP live mode, or mutating wiki CRUD.

## Delivered

- `devflow knowledge` / `devflow wiki` now expose `graph`, `orphans`, `hubs`,
  `backlinks`, `forward`, and `graph-health`.
- Graph links are derived from `<spec-entry related="...">`, optional
  `parent="..."`, and body wikilinks like `[[Entry Title]]`.
- Structured entries preserve both document shape (`spec-entry`) and declared
  entry type (`learning`), so `--type learning --category gotcha` works.
- Markdown container files that only wrap `<spec-entry>` blocks are excluded
  from orphan/health node counts to avoid duplicate graph edges.
- The generated `devflow-learn` skill now documents graph inspection commands.

## Validation

- `pnpm --filter @enpd/devflow lint`
- `pnpm --filter @enpd/devflow typecheck`
- `pnpm --filter @enpd/devflow test -- test/commands/knowledge.test.ts test/templates/devflow.test.ts test/configurators/shared.test.ts`
- `pnpm --filter @enpd/devflow build`
- Compiled CLI smoke test for `wiki graph`, `wiki backlinks`, `wiki hubs`, and
  `wiki graph-health` against a temporary `.devflow/spec/guides/graph.md`.

## Deferred

- `knowledge connect --dry-run` link suggestions.
- `cleanup --fix` or any destructive wiki mutation path.
- Dashboard/MCP/wiki server migration.
