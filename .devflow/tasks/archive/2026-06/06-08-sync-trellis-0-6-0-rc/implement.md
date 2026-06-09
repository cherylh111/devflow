# Implementation Plan

## Pre-Implementation Context

Load project coding guidance before editing via `devflow-before-dev` in Phase 2. At minimum, read specs for:

- backend configurator/platform registry behavior
- migrations and release manifests
- CLI init/update behavior
- unit/integration test conventions

Also read:

- `.devflow/tasks/06-08-sync-trellis-0-6-0-rc/research/upstream-rc0-diff.md`

Inline mode is active for this task: do not dispatch implement/check sub-agents, and do not curate JSONL context files.

## Steps

1. Reconfirm local upstream evidence:
   - `git -C C:\Users\Admin\Desktop\AiWorker\Trellis log --oneline v0.6.0-beta.22..v0.6.0-rc.0`
   - `git -C C:\Users\Admin\Desktop\AiWorker\Trellis diff --name-status v0.6.0-beta.22..v0.6.0-rc.0`
2. Port the bundled skill rename:
   - rename source directories from `devflow-spec-bootstarp` to `devflow-spec-bootstrap`;
   - update source skill metadata and tests;
   - keep migration-only references to legacy typoed installed paths.
3. Add `0.6.0-beta.23.json` manifest with DevFlow wording and `rename-dir` migrations for all relevant platform skill roots.
4. Port channel runtime agent dispatch:
   - add translated `.devflow/agents/{check,implement}.md` templates;
   - update init/update template collection;
   - add tests for generated runtime agent files.
5. Port registry-backed spec template refresh:
   - add translated `registry-config.ts`;
   - update init to persist registry source/template config;
   - update update path to refresh registry-backed `.devflow/spec` through existing hash/conflict flow;
   - add/update unit and integration tests.
6. Port workflow missing-agent warning:
   - add translated `agent-refs.ts`;
   - wire warning into workflow/init flows where upstream does;
   - test referenced-agent extraction and missing-agent warning.
7. Add Reasonix support:
   - update `types/ai-tools.ts`;
   - add configurator registry entry;
   - add Reasonix templates;
   - add tests.
8. Apply agent tool cleanup:
   - remove explicit `mcp__exa__*` from bundled Claude-style implement/check agents;
   - preserve research-agent search through supported wildcard semantics;
   - update regression tests.
9. Add translated bundled `devflow-session-insight` and tests for auto-dispatch/installation behavior.
10. Add `0.6.0-rc.0.json` manifest with DevFlow wording.
11. Bump `packages/cli/package.json` and `packages/core/package.json` to `0.6.0-rc.0`.
12. Review docs/spec impact and update `.devflow/spec/` only if implementation reveals a reusable convention or contract change.

## Validation Commands

Run focused checks first:

- `pnpm --filter @enpd/devflow test -- test/utils/registry-config.test.ts`
- `pnpm --filter @enpd/devflow test -- test/utils/agent-refs.test.ts`
- `pnpm --filter @enpd/devflow test -- test/templates/reasonix.test.ts`
- `pnpm --filter @enpd/devflow test -- test/configurators/platforms.test.ts`
- `pnpm --filter @enpd/devflow test -- test/commands/init.integration.test.ts`
- `pnpm --filter @enpd/devflow test -- test/commands/update.integration.test.ts`
- `pnpm --filter @enpd/devflow test -- regression.test.ts`
- `node packages/cli/scripts/release-preflight.js check-versions`

Run broad checks before completion:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`

## Risky Files And Rollback Points

- `packages/cli/src/commands/update.ts`: user-data protection and conflict flow; inspect diffs carefully after registry refresh changes.
- `packages/cli/src/commands/init.ts`: platform selection and registry persistence; verify interactive and flag-driven paths.
- `packages/cli/src/types/ai-tools.ts` and `packages/cli/src/configurators/index.ts`: platform registry consistency.
- `packages/cli/src/migrations/manifests/0.6.0-beta.23.json`: migration paths must use DevFlow installed roots and legacy typoed path as source.
- Bundled skill rename: use git diff after rename to ensure content changed only where expected.
- Agent tool cleanup: verify generated agent registration behavior is covered by regression tests.

## Start Review Checklist

- PRD has no placeholder bullets.
- `design.md` and `implement.md` exist because task is complex.
- The session insight bundled skill is in scope.
- User approves moving from planning to implementation before `task.py start`.
