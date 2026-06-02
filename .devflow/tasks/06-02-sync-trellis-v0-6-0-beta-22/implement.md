# Implementation Plan

## Pre-Implementation Context

Read these specs before code changes:

- `.devflow/spec/devflow/backend/configurator-shared.md`
- `.devflow/spec/devflow/backend/migrations.md`
- `.devflow/spec/devflow/backend/release-process.md`
- `.devflow/spec/devflow/unit-test/conventions.md`

## Steps

1. Remove the inline `Required: Load DevFlow Context First` block from Codex implement/check TOML source templates.
2. Remove the same inline block from root `.codex/agents/devflow-implement.toml` and `.codex/agents/devflow-check.toml` if keeping checked-in generated assets aligned.
3. Add `packages/cli/src/migrations/manifests/0.5.19.json` with DevFlow wording.
4. Add `packages/cli/src/migrations/manifests/0.6.0-beta.22.json` with DevFlow wording.
5. Bump both package versions to `0.6.0-beta.22`.
6. Add/update regression test to assert generated Codex prelude appears exactly once.
7. Run focused tests first:
   - `pnpm --filter @enpd/devflow test -- regression.test.ts`
8. Run broader validation:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
9. Review whether `.devflow/spec/` needs updates after implementation.

## Rollback Points

- After template cleanup, `git diff` should show only the targeted block removal.
- After manifests/version bump, `node packages/cli/scripts/release-preflight.js check-versions` should pass if package versions were bumped.
- If the prelude regression fails, restore source templates and inspect `injectPullBasedPreludeToml` behavior before retrying.

## Completion Criteria

- [x] PRD acceptance criteria pass.
- [x] Validation results are recorded.
- [x] Any docs-site exclusion is explicitly documented in the task artifacts.
