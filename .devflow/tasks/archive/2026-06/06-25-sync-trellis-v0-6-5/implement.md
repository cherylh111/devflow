# Sync Trellis v0.6.5 Changes Implementation Plan

## Checklist

1. Acquire clean upstream sources.
   - Try fetching Trellis `v0.6.5` into `C:\Users\Admin\Desktop\AiWorker\Trellis`.
   - If git transport still fails, download clean source archives for `v0.6.0-rc.0` and `v0.6.5`.
   - Record the final local source paths and commit/tag identifiers before editing DevFlow code.

2. Build a sync inventory.
   - Generate name/status and stat diffs for `v0.6.0-rc.0...v0.6.5`.
   - Exclude Trellis runtime state: `.trellis/tasks/**`, `.trellis/workspace/**`, dirty worktree-only files.
   - Classify changed files into package metadata, CLI source, core source, scripts/hooks, templates/platform integrations, specs/docs, tests, and release/migration metadata.

3. Port shared package and build-system changes.
   - Update root workspace/config files where functional.
   - Preserve DevFlow npm scope, package names, binaries, repository URL, and author.
   - Update lockfile only through package manager commands when dependency metadata changes.

4. Port core and CLI behavior.
   - Apply upstream changes to `packages/core/**` and `packages/cli/src/**`.
   - Keep DevFlow imports and command strings consistent with `@enpd/devflow-core`, `devflow`, and `dvf`.
   - Avoid carrying Trellis-only branding strings unless they are in upstream-facing evidence comments that must remain historical.

5. Port templates, platform integrations, and local workflow assets.
   - Update template sources under `packages/cli/src/templates/**`.
   - Update dogfood copies only when they are generated/template-owned equivalents required by this repository.
   - Keep `.devflow` local task/workspace state intact.

6. Port tests and specs.
   - Adapt upstream tests to DevFlow names and expected output.
   - Update relevant `.devflow/spec/**` docs when upstream contracts introduce or change behavior.

7. Validate and review.
   - Run targeted tests for changed commands/utilities first.
   - Run full validation once the sync compiles.
   - Inspect `git diff` for accidental Trellis branding, package scope drift, or copied runtime state.

## Validation Commands

```bash
pnpm --filter @enpd/devflow-core test
pnpm --filter @enpd/devflow-core build
pnpm --filter @enpd/devflow typecheck
pnpm --filter @enpd/devflow test
pnpm lint
pnpm build
```

## Risky Files And Rollback Points

- `package.json`, `packages/*/package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`
- `packages/cli/src/templates/**`
- `packages/cli/src/migrations/**`
- `.devflow/**`, `.agents/**`, `.codex/**`, `.claude/**`, `.cursor/**`, `.opencode/**`, `.pi/**`
- Python hooks/scripts under template and local workflow directories

Before each category, run `git diff --name-only`; after each category, inspect changed files for accidental Trellis identity replacement.
