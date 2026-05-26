# DevFlow Knowledge Spec Loader Integration Audit

Date: 2026-05-26

## Maestro Reference

Maestro `workflows/specs-load.md` defines a filtered spec loading workflow:

- Load specs by category, keyword, and scope.
- Treat `learnings.md` as the `learning` category.
- Prefer CLI loading and fall back to direct file reads.

## DevFlow Mapping

DevFlow already covers the equivalent behavior through:

- `devflow spec` / `devflow specs`
- `devflow knowledge search "<query>" --type learning`
- `devflow knowledge load <id>`
- `devflow-learn` skill for capture/query/health/graph/report workflows.
- `devflow-before-dev` skill step 7, which queries lightweight learnings only when relevant.

The conservative integration decision is to keep learning lookup explicit rather than injecting `learnings.md` automatically into every `get_context.py` run. This avoids growing every prompt with low-signal historical notes while preserving the Maestro workflow's filtered loading capability.

## Compatibility Fix

During the audit, one Maestro-style metadata gap was closed:

- `KnowledgeDocument` now exposes optional `status` from structured `<spec-entry>` attributes.
- `wiki cleanup` stale draft detection now treats `status="draft"` as equivalent to `type="draft"` or `category="draft"`.

This keeps cleanup compatible with entries that model draft state as metadata instead of as type/category.

## Verification

- `pnpm --filter @enpd/devflow test -- test/commands/knowledge.test.ts test/templates/devflow.test.ts`
- `pnpm --filter @enpd/devflow typecheck`
- `pnpm --filter @enpd/devflow lint`
- `pnpm --filter @enpd/devflow build`

