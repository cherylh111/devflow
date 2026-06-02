# Upstream Trellis v0.6.0-beta.22 Diff

## Source

- Requested local path: `C:\Users\Admin\Desktop\AiWork\Trellis2\Trellis v0.6.0-beta.22`
- Requested path status: missing
- Actual local clone used for research: `C:\Users\Admin\Desktop\AiWork\Trellis2\Trellis`
- Remote: `https://github.com/mindfold-ai/Trellis.git`
- Fetched tag: `v0.6.0-beta.22`
- Tag commit: `714eab1b38d9e386b0e2179692494ef7481c29d9`
- Tag date: `2026-06-01 10:24:49 +0800`

## Commit Range

Compared `v0.6.0-beta.21..v0.6.0-beta.22`:

- `aeeeeabb fix(codex): remove duplicated pull-based prelude in agent toml templates`
- `87bb047e fix(migrations): restore 0.5.19 manifest lost on beta branch`
- `079b5c40 chore(release): prepare v0.6.0-beta.22 manifest + docs-site changelog pointer`

## Changed Files Upstream

```text
M .codex/agents/trellis-check.toml
M .codex/agents/trellis-implement.toml
M docs-site
M packages/cli/package.json
A packages/cli/src/migrations/manifests/0.5.19.json
A packages/cli/src/migrations/manifests/0.6.0-beta.22.json
M packages/cli/src/templates/codex/agents/trellis-check.toml
M packages/cli/src/templates/codex/agents/trellis-implement.toml
M packages/cli/test/regression.test.ts
M packages/core/package.json
```

## Functional Changes To Port

### Codex agent TOML duplicate prelude fix

Upstream removed the inline `Required: Load Trellis Context First` block from:

- `.codex/agents/trellis-check.toml`
- `.codex/agents/trellis-implement.toml`
- `packages/cli/src/templates/codex/agents/trellis-check.toml`
- `packages/cli/src/templates/codex/agents/trellis-implement.toml`

Reason: source templates already receive the pull-based prelude from `injectPullBasedPreludeToml`; carrying an inline copy made generated Codex implement/check TOML contain the block twice.

DevFlow mapping:

- `trellis-check.toml` -> `devflow-check.toml`
- `trellis-implement.toml` -> `devflow-implement.toml`
- `Required: Load Trellis Context First` -> `Required: Load DevFlow Context First`
- `.trellis/scripts/...` -> `.devflow/scripts/...`

### Regression test

Upstream added a regression test under `packages/cli/test/regression.test.ts` in the class-2 platform prelude group. It asserts each generated prelude agent contains `Required: Load Trellis Context First` exactly once.

DevFlow mapping: assert `Required: Load DevFlow Context First` appears exactly once in generated class-2 prelude agents.

### Migration manifests

Upstream added:

- `packages/cli/src/migrations/manifests/0.5.19.json`
- `packages/cli/src/migrations/manifests/0.6.0-beta.22.json`

DevFlow needs equivalent manifests with DevFlow command/package naming.

### Version bump

Upstream changed:

- `packages/cli/package.json`: `0.6.0-beta.21` -> `0.6.0-beta.22`
- `packages/core/package.json`: `0.6.0-beta.21` -> `0.6.0-beta.22`

DevFlow package versions should be kept version-locked if this task prepares the same release state.

### docs-site pointer

Upstream changed the `docs-site` submodule pointer from `b7cba116...` to `22cc20cb...`.

Current DevFlow checkout has no `docs-site` directory and `git submodule status` returned no entries. This cannot be directly ported without deciding whether docs-site should be restored/initialized in this repository.

## Current DevFlow Evidence

- Current CLI package version: `0.6.0-beta.21`
- Current core package version: `0.6.0-beta.21`
- Missing DevFlow manifests:
  - `packages/cli/src/migrations/manifests/0.5.19.json`
  - `packages/cli/src/migrations/manifests/0.6.0-beta.22.json`
- Current DevFlow files containing inline prelude blocks:
  - `.codex/agents/devflow-check.toml`
  - `.codex/agents/devflow-implement.toml`
  - `packages/cli/src/templates/codex/agents/devflow-check.toml`
  - `packages/cli/src/templates/codex/agents/devflow-implement.toml`

