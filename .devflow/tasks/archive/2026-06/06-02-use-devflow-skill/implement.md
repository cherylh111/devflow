# Implementation Plan

## Checklist

- [x] Add English `devflow-use` bundled skill template.
- [x] Add Chinese localized `devflow-use` bundled skill template.
- [x] Update bundled skill tests/constants so `devflow-use` is expected.
- [x] Add or update init integration assertions for installation and hash tracking.
- [x] Run focused tests:
  - `pnpm --filter @enpd/devflow test test/configurators/platforms.test.ts`
  - `pnpm --filter @enpd/devflow test test/commands/init.integration.test.ts`
- [x] Run quality gate as needed:
  - `pnpm lint`
  - `pnpm typecheck`

## Files

- `packages/cli/src/templates/common/bundled-skills/devflow-use/SKILL.md`
- `packages/cli/src/templates/zh/common/bundled-skills/devflow-use/SKILL.md`
- `packages/cli/test/configurators/platforms.test.ts`
- `packages/cli/test/commands/init.integration.test.ts`

## Rollback

Remove the new bundled skill directories and revert the test expectation updates. No generated runtime state or migration state is required for rollback.
