# Add devflow-prototype Bundled Skill Implementation Plan

## Checklist

1. Load current specs before editing:
   - [x] `.devflow/spec/devflow/backend/skill-authoring.md`
   - [x] `.devflow/spec/devflow/backend/platform-integration.md`
   - [x] relevant configurator tests that enumerate bundled skills
2. Add English bundled skill:
   - [x] `packages/cli/src/templates/common/bundled-skills/devflow-prototype/SKILL.md`
   - [x] `packages/cli/src/templates/common/bundled-skills/devflow-prototype/LOGIC.md`
   - [x] `packages/cli/src/templates/common/bundled-skills/devflow-prototype/UI.md`
   - [x] `packages/cli/src/templates/common/bundled-skills/devflow-prototype/prototype-findings-template.md`
3. Add Chinese parity:
   - [x] `packages/cli/src/templates/zh/common/bundled-skills/devflow-prototype/SKILL.md`
   - [x] matching reference files under the same directory
4. Add local dogfood copy:
   - [x] `.agents/skills/devflow-prototype/SKILL.md`
   - [x] local reference files if the skill needs them immediately
5. Integrate brainstorm guidance:
   - [x] English common brainstorm template
   - [x] Chinese common brainstorm template
   - [x] local `.agents/skills/devflow-brainstorm/SKILL.md`
6. Update tests:
   - [x] Add `devflow-prototype` to bundled-skill platform/configurator expectations.
   - [x] Add assertions for at least one reference file if current tests support multi-file bundled-skill checks.
7. Validate:
   - [x] `pnpm --filter @enpd/devflow test test/configurators/platforms.test.ts`
   - [x] `pnpm --filter @enpd/devflow test test/configurators/index.test.ts`
   - [x] `pnpm --filter @enpd/devflow test test/commands/init.integration.test.ts`
   - [x] `pnpm --filter @enpd/devflow test test/templates/language-parity.test.ts`
   - [x] `pnpm --filter @enpd/devflow lint`
   - [x] `pnpm --filter @enpd/devflow typecheck`

## Review Gate

Before running `task.py start`, review that this child excludes automated `devflow-check` warnings for stale prototype markers. That warning belongs in a later hardening task.

## Risky Files

- `packages/cli/src/templates/common/skills/brainstorm.md`
- `packages/cli/src/templates/zh/common/skills/brainstorm.md`
- `.agents/skills/devflow-brainstorm/SKILL.md`
- `packages/cli/test/configurators/platforms.test.ts`
- `packages/cli/test/configurators/index.test.ts`

## Rollback

Remove newly added `devflow-prototype` files and revert brainstorm/test edits. No migration or task-state rollback should be required if implementation has not shipped.
