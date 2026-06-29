# Sync Trellis v0.6.5 Changes Design

## Architecture And Boundaries

This sync treats Trellis as an upstream source and DevFlow as a branded downstream fork. The implementation must port behavior, tests, templates, and specs while preserving DevFlow identity and package boundaries.

Source range:

- Base: Trellis `v0.6.0-rc.0`
- Target: Trellis `v0.6.5` / commit `01ec8d6`
- Evidence: GitHub release/tag and compare pages; local Trellis has the base tag but not the target tag.

Primary DevFlow package boundaries:

- CLI: `packages/cli`, package `@enpd/devflow`
- Core SDK: `packages/core`, package `@enpd/devflow-core`
- Local generated workflow assets: `.devflow`, `.agents`, `.codex`, `.claude`, `.cursor`, `.opencode`, `.pi`
- Docs site: `docs-site` submodule, not a primary sync target unless package metadata requires pointer alignment.

## Data Flow And Contracts

The implementation should first obtain a clean Trellis target source tree, preferably by fetching `v0.6.5`; if git transport remains unavailable, use a clean GitHub source archive for `v0.6.5`. The dirty `C:\Users\Admin\Desktop\AiWorker\Trellis` worktree must not be copied from.

Porting should be done by category, with each category rebranded as it lands:

- Package metadata and workspace contracts: preserve `@enpd/*`, `devflow`, `dvf`, repository URL, author, and DevFlow descriptions.
- TypeScript source: port functional changes while keeping imports on `@enpd/devflow-core`.
- Python scripts and hooks: port behavior while preserving `.devflow` paths, `devflow-*` skill/command names, and platform naming.
- Templates and generated assets: port upstream structure, then apply DevFlow placeholder/name transformations consistently.
- Tests: port or adapt upstream tests so they assert DevFlow output and command names.
- Specs: update DevFlow specs with the upstream contracts that now apply to this fork, in English.

## Compatibility And Migration Notes

Migration manifests from Trellis `0.6.0` through `0.6.5` are likely part of the functional sync and must be reviewed. DevFlow manifests must remain internally consistent with DevFlow package names, template hashes, and command names.

Generated or local runtime state is excluded unless a specific file is required as a template source. Excluded by default:

- Trellis `.trellis/tasks/**`
- Trellis `.trellis/workspace/**`
- Trellis local dirty worktree changes
- Trellis branding-only package metadata

## Trade-Offs

Using clean upstream tags improves reproducibility but requires an additional acquisition step because local git cannot currently fetch GitHub refs. Downloading archives is acceptable for evidence and diffing, but implementation should keep a recorded source path and checks so the sync can be audited.

The change set is too large for a single blind merge. The safer shape is a staged port with validation after each major category, followed by full lint, typecheck, build, and tests.

## Rollback

Rollback is file-level through git because DevFlow starts clean except for this task. Each staged port should be reviewed with `git diff --name-only` before moving to the next category.
