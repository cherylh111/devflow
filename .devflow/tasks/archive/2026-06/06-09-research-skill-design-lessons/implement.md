# Implementation Plan

## Checklist

- [x] Add English `devflow-diagnose` bundled skill template.
- [x] Add Chinese `devflow-diagnose` bundled skill template.
- [x] Add local dogfood `.agents/skills/devflow-diagnose/SKILL.md`.
- [x] Update `devflow-brainstorm` English template with vertical-slice parent/child guidance.
- [x] Update local dogfood `devflow-brainstorm` skill with matching guidance.
- [x] Update Chinese `devflow-brainstorm` template with equivalent guidance.
- [x] Add backend spec for built-in skill authoring.
- [x] Link the new spec from `.devflow/spec/devflow/backend/index.md`.
- [x] Update configurator test expectations for the new bundled skill.
- [x] Run focused configurator tests.
- [x] Run lint/typecheck if focused tests pass or failures are unrelated.
- [x] Surface `devflow-diagnose` lightly in workflow routing and Phase 2 implementation guidance.

## Validation Commands

```bash
pnpm --filter @enpd/devflow test test/configurators/platforms.test.ts
pnpm --filter @enpd/devflow test test/configurators/index.test.ts
pnpm lint
pnpm typecheck
```

## Validation Results

- [x] `corepack pnpm --filter @enpd/devflow test test/configurators/platforms.test.ts`
- [x] `corepack pnpm --filter @enpd/devflow test test/configurators/index.test.ts`
- [x] `corepack pnpm --filter @enpd/devflow test test/commands/init.integration.test.ts`
- [x] `corepack pnpm --filter @enpd/devflow-core lint`
- [x] `corepack pnpm --filter @enpd/devflow lint`
- [x] `corepack pnpm --filter @enpd/devflow-core exec tsc`
- [x] `corepack pnpm --filter @enpd/devflow-core typecheck`
- [x] `corepack pnpm --filter @enpd/devflow typecheck`
- [x] `corepack pnpm --filter @enpd/devflow test test/templates/devflow.test.ts`
- [x] `corepack pnpm --filter @enpd/devflow test test/regression.test.ts`
- [x] `corepack pnpm --filter @enpd/devflow test test/commands/workflow.integration.test.ts`
- [x] `corepack pnpm --filter @enpd/devflow lint`
- [x] `corepack pnpm --filter @enpd/devflow typecheck`

Note: top-level `corepack pnpm lint` and `corepack pnpm typecheck` failed because those package scripts invoke a bare `pnpm` command internally, and this shell does not have bare `pnpm` on PATH. The equivalent package-level Corepack commands above passed.

## Rollback

Remove the new `devflow-diagnose` bundled skill directories, remove the local dogfood skill, revert the brainstorm guidance changes, remove the new spec link/file, and restore the test bundled-skill expectation list.
