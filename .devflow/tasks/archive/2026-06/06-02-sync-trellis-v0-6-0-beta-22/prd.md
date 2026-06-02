# Sync upstream Trellis v0.6.0-beta.22

## Goal

Bring the DevFlow fork up to date with the functional changes shipped in upstream Trellis `v0.6.0-beta.22`, translating Trellis branding and package names to DevFlow equivalents while preserving DevFlow-specific repository state.

## Confirmed Facts

- Requested upstream path `C:\Users\Admin\Desktop\AiWork\Trellis2\Trellis v0.6.0-beta.22` does not exist locally.
- Actual local upstream clone exists at `C:\Users\Admin\Desktop\AiWork\Trellis2\Trellis`.
- That clone was initially detached at `v0.6.0-beta.21`; remote `origin` has tag `v0.6.0-beta.22`.
- Fetched tag `v0.6.0-beta.22` from `https://github.com/mindfold-ai/Trellis.git` for diff analysis without switching the upstream worktree.
- Upstream `v0.6.0-beta.21..v0.6.0-beta.22` contains three commits:
  - `aeeeeabb fix(codex): remove duplicated pull-based prelude in agent toml templates`
  - `87bb047e fix(migrations): restore 0.5.19 manifest lost on beta branch`
  - `079b5c40 chore(release): prepare v0.6.0-beta.22 manifest + docs-site changelog pointer`
- Current DevFlow packages are at `0.6.0-beta.21`.
- Current DevFlow still contains `Required: Load DevFlow Context First` inline blocks in Codex agent TOML source templates and generated root `.codex/agents/` files.
- Current DevFlow is missing `packages/cli/src/migrations/manifests/0.5.19.json` and `0.6.0-beta.22.json`.
- Current DevFlow checkout has no `docs-site` directory, so upstream's docs-site submodule pointer change cannot be applied directly without a separate docs-site decision.

## Requirements

- Remove duplicated Codex pull-based prelude source from DevFlow Codex implement/check agent TOML templates so the shared injector remains the single source of the prelude.
- Apply the same prelude-source cleanup to the root `.codex/agents/devflow-implement.toml` and `.codex/agents/devflow-check.toml` files if they are tracked/generated assets in this repository.
- Restore the missing `0.5.19` migration manifest using DevFlow naming and package text.
- Add the `0.6.0-beta.22` migration manifest using DevFlow naming and package text.
- Bump DevFlow package versions from `0.6.0-beta.21` to `0.6.0-beta.22` for both CLI and core packages if this task is intended to prepare the release-equivalent state.
- Add or update regression coverage so generated Codex agent TOML contains the pull-based prelude exactly once.
- Preserve DevFlow branding and package names:
  - `trellis` command references become `devflow`.
  - `.trellis/` paths become `.devflow/`.
  - `@mindfoldhq/trellis*` package references remain `@enpd/devflow*`.
  - Trellis prose is translated to DevFlow prose.
- Do not publish packages locally.
- Do not overwrite unrelated dirty files.
- Exclude the upstream `docs-site` submodule pointer change from this task because the current DevFlow checkout has no `docs-site` directory/submodule state.

## Acceptance Criteria

- [x] Codex implement/check TOML source templates no longer contain inline `Required: Load DevFlow Context First` blocks before generated injection.
- [x] Generated/installed Codex implement/check TOML output still contains exactly one pull-based prelude.
- [x] `packages/cli/src/migrations/manifests/0.5.19.json` exists and describes the DevFlow `0.5.19` Codex config fix.
- [x] `packages/cli/src/migrations/manifests/0.6.0-beta.22.json` exists and describes the duplicated Codex prelude fix plus restored manifest.
- [x] `packages/cli/package.json` and `packages/core/package.json` versions match the intended target version.
- [x] Regression tests cover the duplicated-prelude fix.
- [x] Validation commands pass, or any blocker is recorded with exact failure output.
- [x] Scope decision for `docs-site` is recorded before implementation starts: excluded from this task.

## Notes

- Relevant upstream diff is recorded in `research/upstream-beta-22-diff.md`.
- This is a complex task because it touches release manifests, package versions, generated platform assets, and regression tests.
- `docs-site` release docs/changelog work can be handled as a separate task if needed.

## Validation

- `node packages/cli/scripts/release-preflight.js check-versions` - pass
- `pnpm --filter @enpd/devflow test -- regression.test.ts` - pass
- `pnpm --filter @enpd/devflow test -- test/templates/language-parity.test.ts` - pass
- `pnpm lint` - pass
- `pnpm typecheck` - pass
- `pnpm test` - pass
