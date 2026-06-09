# Sync Upstream Trellis 0.6.0-rc.0

## Goal

Bring the DevFlow fork from the Trellis-equivalent `0.6.0-beta.22` state to the functional and release-equivalent `0.6.0-rc.0` state, translating Trellis names, paths, package identifiers, and prose to DevFlow while preserving DevFlow-specific repository state.

## Confirmed Facts

- Target local DevFlow checkout is `C:\Users\Admin\Desktop\AiWorker\devflow`.
- Source local Trellis checkout exists at `C:\Users\Admin\Desktop\AiWorker\Trellis`.
- DevFlow CLI and core packages are currently versioned `0.6.0-beta.22`.
- Local Trellis has tags `v0.6.0-beta.22`, `v0.6.0-beta.23`, and `v0.6.0-rc.0`.
- `git fetch --tags origin` against Trellis failed on 2026-06-08 because the machine could not connect to GitHub, so planning uses the local tags already present.
- Trellis `v0.6.0-beta.22..v0.6.0-rc.0` includes `v0.6.0-beta.23` plus `v0.6.0-rc.0`.
- Upstream commits in this range include:
  - `7eabe64c fix(skills): correct spelling of bundled trellis-spec-bootstrap skill (#296)`
  - `1d50a01b feat: add Reasonix (DeepSeek-Reasonix) platform support (#301)`
  - `fix(cli): dispatch channel runtime agent definitions at init/update (#323)`
  - `47882b13 feat(cli): refresh registry-backed spec templates (#324)`
  - `3ac3cc14 feat(skills): bundle trellis-session-insight skill (auto-dispatched)`
  - `f9ab7001 fix(agents): drop explicit mcp__exa__* tools from bundled agent defs (#302)`
  - `4498dacf chore(release): add 0.6.0-beta.23 migration manifest`
  - `b9916981 chore(release): add 0.6.0-rc.0 migration manifest`
  - `6869bc6f 0.6.0-rc.0`
- DevFlow is missing the upstream-added `0.6.0-beta.23.json` and `0.6.0-rc.0.json` manifests.
- DevFlow currently still contains the typoed bundled skill directory `devflow-spec-bootstarp` in source templates and tests.
- DevFlow currently lacks the new Reasonix platform templates/configurator/tests.
- DevFlow currently lacks upstream `agent-refs.ts` and `registry-config.ts`.
- DevFlow already has internal session insight support, but not the upstream bundled `trellis-session-insight` skill translated as a bundled DevFlow skill.
- User approved including upstream `trellis-session-insight` as translated bundled `devflow-session-insight`.
- Upstream diff includes `docs-site` submodule pointer changes and Trellis `.trellis/tasks` archival artifacts, which do not map directly to this DevFlow checkout.

## Requirements

- Port upstream functional CLI changes from Trellis `v0.6.0-beta.22..v0.6.0-rc.0` into DevFlow:
  - dispatch channel runtime agent definitions during `devflow init` and `devflow update`;
  - refresh registry-backed `.devflow/spec` templates through normal update hash/conflict handling;
  - persist spec registry source/template config from `devflow init --template <id>`;
  - warn when workflow templates reference missing `.devflow/agents/<name>.md` runtime agents;
  - add Reasonix platform support using DevFlow naming and path conventions;
  - add the bundled `devflow-session-insight` skill;
  - remove explicit `mcp__exa__*` tool names from bundled Claude-style agent definitions while preserving research-agent external search behavior via supported wildcard semantics;
  - rename bundled `devflow-spec-bootstarp` source templates and installed migration targets to `devflow-spec-bootstrap`.
- Add DevFlow-translated migration manifests for `0.6.0-beta.23` and `0.6.0-rc.0`.
- Bump DevFlow CLI and core package versions to `0.6.0-rc.0`.
- Preserve DevFlow branding and package names:
  - `trellis` command references become `devflow`.
  - `tl` bin references become `dvf` where applicable.
  - `.trellis/` paths become `.devflow/`.
  - `@mindfoldhq/trellis*` package references remain `@enpd/devflow*`.
  - Trellis prose is translated to DevFlow prose.
- Preserve existing DevFlow-specific conventions, specs, and task history.
- Do not publish packages, create tags, or push commits.
- Do not overwrite unrelated dirty files.

## Acceptance Criteria

- [ ] `packages/cli/package.json` and `packages/core/package.json` versions are `0.6.0-rc.0`.
- [ ] `packages/cli/src/migrations/manifests/0.6.0-beta.23.json` exists with DevFlow wording and correct migration operations.
- [ ] `packages/cli/src/migrations/manifests/0.6.0-rc.0.json` exists with DevFlow wording.
- [ ] Bundled skill source directories, generated platform paths, manifests, and tests use `devflow-spec-bootstrap`; legacy installed `devflow-spec-bootstarp` paths are handled by migration only.
- [ ] `devflow init`/`devflow update` include `.devflow/agents/{check,implement}.md` channel runtime agents where upstream expects them.
- [ ] Registry-backed spec template refresh and persisted registry config are implemented and covered by tests.
- [ ] Workflow template missing-agent warnings are implemented and covered by tests.
- [ ] Reasonix support is implemented in platform registry, configurator registry, templates, CLI flag handling, and tests.
- [ ] Bundled agent definitions no longer require explicit `mcp__exa__*` tools in implement/check agents; relevant regression coverage passes.
- [ ] DevFlow-translated bundled `devflow-session-insight` skill is included and auto-dispatched consistently with upstream behavior.
- [ ] `node packages/cli/scripts/release-preflight.js check-versions` passes.
- [ ] Focused tests for changed CLI/configurator/template behavior pass.
- [ ] Broader `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass, or exact blockers are recorded.

## Out Of Scope

- Publishing npm packages.
- Creating or moving git tags.
- Pushing to remotes.
- Blindly copying Trellis `.trellis/tasks` archives into DevFlow task history.
- Applying the Trellis `docs-site` submodule pointer unless docs-site scope is separately approved.
- Importing Trellis branding, package names, `.trellis/` paths, or community QR/marketing asset updates without DevFlow-specific review.
