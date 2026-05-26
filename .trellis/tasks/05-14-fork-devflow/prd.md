# Fork Trellis into devflow

## Goal

Fork the Trellis monorepo (`C:\Users\Admin\Desktop\AiWork\Trellis2\Trellis`) into a standalone, rebranded CLI tool called "devflow". Users will run `devflow init` instead of `trellis init`, and the package will be published under a new identity.

## User Value

Full ownership of the AI coding harness — independent release cycle, custom branding, ability to diverge from upstream Trellis without merge conflicts.

## Confirmed Facts

- Source: pnpm monorepo with `packages/cli` (363 files) + `packages/core` (27 files)
- Current branding: "Trellis", org "mindfold-ai", npm scope `@mindfoldhq`
- CLI binary names: `trellis`, `tl`
- License: AGPL-3.0
- Templates for 10+ platforms (Claude, Cursor, Codex, Kiro, Gemini, etc.)
- Target directory: `C:\Users\Admin\Desktop\AiWork\devflow`

## Requirements

- [x] Rename CLI binary: `trellis` → `devflow`, `tl` → `dvf`
- [x] Rename npm packages: `@mindfoldhq/trellis` → `@enpd/devflow`, `@mindfoldhq/trellis-core` → `@enpd/devflow-core`
- [x] Replace all "Trellis" branding in source, templates, docs
- [x] Replace org references: author → `ENPD`, remove GitHub/Discord/docs URLs (private project, no public links)
- [x] Remove public URLs (docs.trytrellis.app, GitHub links, Discord) — no replacement needed
- [x] Rename runtime directory from `.trellis/` to `.devflow/`
- [x] Keep only Claude, Qoder, CodeBuddy platform templates; remove Cursor, Codex, Kiro, Gemini, OpenCode, Copilot, Droid, Pi
- [x] Remove LICENSE file (private project, no distribution)
- [x] Ensure build/test passes after rename

## Acceptance Criteria

- [x] New binary name works end-to-end (`devflow init` or equivalent)
- [x] All user-facing strings reference the new brand
- [x] No residual "trellis", "mindfold", or "mindfoldhq" in source (except git history)
- [x] Build and tests pass

## Out of Scope

- Feature changes beyond rebranding
- Upstream sync mechanism
- Publishing to npm (just local build verification)

## Open Questions

(All resolved)
