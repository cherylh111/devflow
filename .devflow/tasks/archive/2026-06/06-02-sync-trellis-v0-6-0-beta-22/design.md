# Design: Sync Upstream Trellis v0.6.0-beta.22

## Scope

Port the upstream Trellis beta.22 functional changes into DevFlow with branding and package-name translation. The sync is not a blind copy because DevFlow has renamed commands, paths, package names, and prose.

## Boundaries

In scope:

- Codex agent TOML source-template cleanup for implement/check agents.
- Root `.codex/agents/` cleanup if those files are part of the current repository's generated platform assets.
- Migration manifest restoration/addition.
- Package version bump to `0.6.0-beta.22`, if approved as part of this task.
- Regression coverage for the prelude duplication bug.

Out of scope unless explicitly approved:

- Publishing packages.
- Moving git tags.
- Force-updating the Trellis local worktree.
- Restoring or changing the `docs-site` submodule pointer. User accepted excluding `docs-site` from this task.
- Importing Trellis branding, package names, or `.trellis/` paths.

## Mapping Rules

| Trellis upstream | DevFlow target |
| --- | --- |
| `trellis` command | `devflow` command |
| `tl` bin | `dvf` bin |
| `.trellis/` | `.devflow/` |
| `@mindfoldhq/trellis` | `@enpd/devflow` |
| `@mindfoldhq/trellis-core` | `@enpd/devflow-core` |
| `Trellis` prose | `DevFlow` prose |
| `trellis-implement/check` | `devflow-implement/check` |

## Technical Approach

### Codex prelude cleanup

The source of truth for class-2 sub-agent context loading is `packages/cli/src/configurators/shared.ts` through `buildPullBasedPrelude` and `injectPullBasedPreludeToml`. Codex implement/check TOML templates should not carry their own static prelude block.

Remove the static block beginning with `## Required: Load DevFlow Context First` through the following separator from:

- `packages/cli/src/templates/codex/agents/devflow-implement.toml`
- `packages/cli/src/templates/codex/agents/devflow-check.toml`

If root `.codex/agents/devflow-implement.toml` and `.codex/agents/devflow-check.toml` represent generated repository platform files, apply the same cleanup there so the checked-in workspace state mirrors the template source.

### Manifests

Create manifest JSON files under `packages/cli/src/migrations/manifests/`.

- `0.5.19.json`: DevFlow wording for the Codex `config.toml` `[features.multi_agent_v2]` removal fix.
- `0.6.0-beta.22.json`: DevFlow wording for duplicate Codex prelude fix and restored `0.5.19` manifest.

Both are non-breaking and have no migration operations.

### Versioning

If this task is intended to mirror the release state, update both package versions together:

- `packages/cli/package.json`
- `packages/core/package.json`

Do not publish locally.

### Tests

Add regression coverage in the existing class-2 prelude test group. The assertion should inspect generated agent files and require exactly one occurrence of `Required: Load DevFlow Context First`.

The test should prove behavior after the injector runs, not merely inspect raw source templates.

## Compatibility

Removing the static prelude from templates relies on existing injector behavior. The generated/installed Codex agents must still contain the prelude once. This is why regression coverage is mandatory.

## Risks

- Removing the wrong block could remove the recursion guard or reviewer/implementer instructions. Limit deletion to the `Required: Load DevFlow Context First` block only.
- Root `.codex/agents/` files may be user-facing generated files; if they are intentionally checked in, keep them consistent with templates.
- Version bump without docs-site handling may leave release docs incomplete. This is accepted for this task; docs-site work should be split out if release documentation is required.
