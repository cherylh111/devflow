# Sync Trellis v0.6.5 Changes

## Goal

Bring DevFlow forward from its current Trellis-derived `0.6.0-rc.0` baseline to the Trellis changes represented by `C:\Users\Admin\Desktop\AiWorker\Trellis`, while preserving DevFlow branding, package names, binary names, repository metadata, and local workflow conventions.

## Confirmed Facts

- Current DevFlow workspace is on `main`, clean except for this planning task.
- Current DevFlow CLI package is `@enpd/devflow` version `0.6.0-rc.0`.
- Trellis workspace path is `C:\Users\Admin\Desktop\AiWorker\Trellis`.
- Trellis CLI package is `@mindfoldhq/trellis` version `0.6.5`.
- Trellis local tags include `v0.6.0-rc.0`; no local `v0.6.5` tag was found.
- GitHub release/tag page confirms `v0.6.5` exists at commit `01ec8d6` and was tagged on 2026-06-25.
- GitHub compare page for `v0.6.0-rc.0...v0.6.5` reports 107 commits and 1,330 changed files.
- Local `git ls-remote` attempts to GitHub failed due network/server connection errors, so implementation may need to fetch later or download clean source archives.
- Trellis working tree is not clean and contains a large set of modified, deleted, and untracked files across source, templates, tests, specs, platform integrations, and local `.trellis` artifacts.
- Trellis `.trellis/.version` currently reports `0.6.2`, which does not match the CLI package version `0.6.5`.

## Requirements

- Use a clean Trellis tag or committed revision as the source of truth for the sync; do not sync from Trellis's dirty working tree.
- Use `v0.6.0-rc.0` as the clean Trellis base and `v0.6.5` / commit `01ec8d6` as the clean Trellis target.
- Port functional changes from Trellis to DevFlow without blindly replacing DevFlow-specific names, package scopes, binary names, repository URLs, author metadata, or generated local task/workspace state.
- Treat Trellis local task archives, workspace journals, and source repository operational state as evidence unless explicitly selected for porting.
- Preserve DevFlow's package identity:
  - npm scope: `@enpd`
  - CLI package: `@enpd/devflow`
  - core package: `@enpd/devflow-core`
  - command names: `devflow` and `dvf`
  - repository: `https://github.com/enpd/DevFlow.git`
- Produce a concrete implementation plan before starting code changes because this is a broad cross-repository sync.

## Acceptance Criteria

- [ ] Planning identifies `v0.6.0-rc.0...v0.6.5` as the exact clean Trellis source range.
- [ ] Planning classifies the sync scope into independently verifiable slices when appropriate.
- [ ] DevFlow-specific branding and package identity are preserved.
- [ ] Ported source/template/spec/test changes compile and pass the agreed validation commands.
- [ ] Version metadata is updated consistently according to the selected release target.
- [ ] Local task/workspace state from Trellis is not copied into DevFlow unless explicitly approved.

## Out Of Scope

- Publishing a DevFlow release.
- Rebranding DevFlow back to Trellis.
- Copying Trellis user workspace journals, active tasks, or archive history by default.
- Syncing uncommitted Trellis working tree changes.
