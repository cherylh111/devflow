# DevFlow Learn Workflow Parity

Date: 2026-05-26

## Summary

Adapted Maestro `manage-learn` modes into DevFlow's existing knowledge store and CLI.

## CLI Surface

- `devflow learn "<insight>"`
- `devflow learn tip "<insight>"`
- `devflow learn list [--keywords <word>] [--category <name>]`
- `devflow learn search <query>`
- `devflow learn show <id>`
- Grouped equivalents under `devflow knowledge learn ...`

## Behavior

- Captures still append structured `<spec-entry>` blocks to `.devflow/spec/guides/learnings.md`.
- Plain capture infers category with Maestro-style keyword heuristics and defaults confidence to `medium`.
- `tip` capture uses `category="tip"`, `source="tip"`, implicit `tip` keyword, and confidence `low`.
- `list`, `search`, and `show` route to learning-only views instead of capturing the words as new insights.
- Search no longer returns unrelated structured entries only because they are `<spec-entry>` blocks; the structured-entry score bonus is now applied only after an actual query match.

## Verification

- `pnpm --filter @enpd/devflow test -- test/commands/knowledge.test.ts test/templates/devflow.test.ts`
- `pnpm --filter @enpd/devflow typecheck`
- `pnpm --filter @enpd/devflow lint`
- `pnpm --filter @enpd/devflow build`
- Compiled CLI smoke:
  - `devflow learn "Always prefer ..."`
  - `devflow learn tip "Use digest reports ..."`
  - `devflow learn list --keywords parser --json`
  - `devflow learn search digest --json`
  - `devflow learn show <id> --json`

