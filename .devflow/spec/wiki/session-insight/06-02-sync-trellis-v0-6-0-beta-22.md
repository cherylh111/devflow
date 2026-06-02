<spec-entry
  id="insight-20260602-155646-06-02-sync-trellis-v0-6-0-beta-22"
  type="session-insight"
  category="session"
  keywords="session-insight,finish-work,06-02-sync-trellis-v0-6-0-beta-22,devflow,diff"
  source="finish-work"
  date="2026-06-02"
  task="06-02-sync-trellis-v0-6-0-beta-22"
  package="devflow"
  branch="main"
  commits="9e02e79,4f07709,6b48ef1"
  derived_from=".devflow/tasks/archive/2026-06/06-02-sync-trellis-v0-6-0-beta-22"
>

### Sync upstream Trellis v0.6.0-beta.22

#### Summary

Synced upstream beta22 manifests and package versions, removed duplicated Codex pull-based prelude blocks, added regression coverage and recorded beta22 sync artifacts.

#### Task

- Path: `.devflow/tasks/archive/2026-06/06-02-sync-trellis-v0-6-0-beta-22`
- Title: Sync upstream Trellis v0.6.0-beta.22
- Why: Bring the DevFlow fork up to date with the functional changes shipped in upstream Trellis `v0.6.0-beta.22`, translating Trellis branding and package names to DevFlow equivalents while preserving DevFlow-specific repository state.

#### Commits

- `9e02e79`
- `4f07709`
- `6b48ef1`

#### Changed Files

- `.codex/agents/devflow-check.toml`
- `.codex/agents/devflow-implement.toml`
- `.devflow/spec/devflow/backend/configurator-shared.md`
- `.devflow/tasks/06-02-sync-trellis-v0-6-0-beta-22/check.jsonl`
- `.devflow/tasks/06-02-sync-trellis-v0-6-0-beta-22/design.md`
- `.devflow/tasks/06-02-sync-trellis-v0-6-0-beta-22/implement.jsonl`
- `.devflow/tasks/06-02-sync-trellis-v0-6-0-beta-22/implement.md`
- `.devflow/tasks/06-02-sync-trellis-v0-6-0-beta-22/prd.md`
- `.devflow/tasks/06-02-sync-trellis-v0-6-0-beta-22/research/upstream-beta-22-diff.md`
- `.devflow/tasks/06-02-sync-trellis-v0-6-0-beta-22/task.json`
- `packages/cli/package.json`
- `packages/cli/src/migrations/manifests/0.5.19.json`
- `packages/cli/src/migrations/manifests/0.6.0-beta.22.json`
- `packages/cli/src/templates/codex/agents/devflow-check.toml`
- `packages/cli/src/templates/codex/agents/devflow-implement.toml`
- `packages/cli/src/templates/zh/codex/agents/devflow-check.toml`
- `packages/cli/src/templates/zh/codex/agents/devflow-implement.toml`
- `packages/cli/test/regression.test.ts`
- `packages/core/package.json`

#### Referenced Specs

- (No task spec references found.)

#### Review

- Reviewed by: (not recorded)

#### Key Decisions

- Current DevFlow checkout has no `docs-site` directory, so upstream's docs-site submodule pointer change cannot be applied directly without a separate docs-site decision.
- Scope decision for `docs-site` is recorded before implementation starts: excluded from this task.

#### Pitfalls

- "changelog": "**Bug Fixes:**\n- fix(codex): `devflow init` / `devflow update` no longer write a `[features.multi_agent_v2]` block to `.codex/config.toml`. Codex CLI changed `fea...
- "changelog": "**Bug Fixes:**\n- fix(codex): the generated `.codex/agents/devflow-check.toml` and `devflow-implement.toml` no longer contain the \"Required: Load DevFlow Context ...
- Regression coverage for the prelude duplication bug.
- Validation commands pass, or any blocker is recorded with exact failure output.

#### Invariants

- ## Required: Load DevFlow Context First
- This platform does NOT auto-inject task context via hook. Before doing anything else, you MUST load context yourself.
- Look at the dispatch prompt** you received from the main agent. If its first line is `Active task: <path>` (e.g. `Active task: .devflow/tasks/04-17-foo`), use that path. The mai...
- If it has `"file"`, Read that file path or markdown directory. These are the specs and research notes you must follow.
- If it has `"knowledge"`, `"wiki"`, or `{"type":"knowledge","id":"..."}`, run `python ./.devflow/scripts/knowledge.py load <id>` and treat the loaded entry as required context.
- If it has `"knowledge"`, `"wiki"`, or `{"type":"knowledge","id":"..."}`, run `python3 ./.devflow/scripts/knowledge.py load <id>` and treat the loaded entry as required context.
</spec-entry>
