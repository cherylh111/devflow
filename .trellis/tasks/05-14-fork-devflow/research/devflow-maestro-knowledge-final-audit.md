# Maestro knowledge migration final audit

Date: 2026-05-26

## Scope audited

Dedicated Maestro knowledge-management sources:

- `src/commands/spec.ts`
- `src/commands/wiki.ts`
- `src/commands/knowhow.ts`
- `workflows/learn.md`
- `workflows/knowhow.md`
- `workflows/specs-add.md`
- `workflows/specs-load.md`
- `workflows/specs-setup.md`
- `workflows/wiki-manage.md`
- `workflows/wiki-connect.md`
- `workflows/wiki-digest.md`
- `workflows/tools-spec.md`
- `workflows/harvest.md`
- `workflows/knowledge-audit.md`
- `workflows/ui-codify-knowhow.md`

## Requirement matrix

| Maestro surface | DevFlow status | Evidence |
|---|---|---|
| `learn` capture/list/search/show/tip | Implemented | `devflow learn`, grouped `devflow knowledge learn`; see `devflow-learn-workflow-parity.md` |
| Structured closed `<spec-entry>` parsing | Implemented | `spec-entry.ts`, `store.ts`; health reports malformed/duplicate entries |
| Unified wiki list/search/show/load | Implemented | `devflow knowledge` alias `devflow wiki`; list/search/show/load commands |
| Wiki create/update/delete/append/remove-entry | Implemented with scoped safety | `writer.ts` writes generated entries under `.devflow/spec/wiki/**`; arbitrary spec markdown deletion is rejected |
| Wiki graph/orphans/hubs/backlinks/forward/health | Implemented | `graph.ts` plus CLI graph commands; see graph implementation notes |
| Wiki connect suggestions/fix/report/learn | Implemented | `connect.ts`, `reports.ts`, `appendLearning`; see connect notes |
| Wiki cleanup report/fix | Implemented | `cleanup.ts`; fix only removes broken structured `related` metadata |
| Wiki digest themes/gaps/heatmap/report/issues/learn | Implemented | `digest.ts`; generated issue recursion guard covered by tests |
| Wiki stats | Implemented | `getKnowledgeStats`; see stats parity note |
| Knowhow add/list/search/get | Implemented | `devflow knowhow`, alias `devflow kh`; see knowhow parity note |
| Knowhow metadata: lang/source/status/asset/code paths | Implemented | Extra attrs in `writer.ts`; `code_paths` parsed as a list attr |
| Tool specs as knowhow with category discovery | Implemented | `tool=true`, `spec_category`; discoverable via `devflow spec --category` and `wiki list --tool`; see tool-spec parity note |
| Spec load by category/keyword/package/layer | Implemented | `devflow spec`, `devflow specs`, `devflow knowledge specs` |
| Spec add | Implemented with DevFlow targeting | `devflow spec add --layer/--file` or `--path`; see spec command parity note |
| Spec list/init/status | Implemented as file-based commands | `devflow spec init/list/status`; local `.devflow/spec` only |
| Spec global/team/personal scopes | Intentionally not ported | DevFlow has no collab/personal spec-root architecture; local `.devflow/spec` is the canonical store |
| Spec injection config/analytics/TUI | Intentionally not ported | DevFlow uses explicit skills/workflow loading rather than Maestro dashboard/hook injection |
| Wiki live HTTP/dashboard mode | Intentionally not ported | DevFlow implementation is offline/file-based; no dashboard server dependency |
| MCP/wiki dashboard internals | Intentionally not ported | Same rationale: no dashboard/MCP subsystem in target architecture |
| Harvest from arbitrary workflow artifacts | Intentionally not ported as a command | DevFlow task research/report paths plus `learn`, `knowhow`, `spec add`, and `wiki create` provide explicit capture. Maestro harvest depends on `.workflow/state.json` artifact registries not present in DevFlow |
| Knowledge-audit semantic GC | Partially covered, explicit non-port | DevFlow has `wiki health`, `wiki stats`, `wiki cleanup`, `wiki digest --create-issues`; interactive semantic triage/purge over artifacts is not ported because DevFlow avoids destructive artifact lifecycle automation |
| `learn-follow` / `learn-decompose` hints | Not dedicated commands in Maestro source | Dedicated workflow files are absent; DevFlow equivalent is `wiki backlinks/forward/graph`, `wiki digest`, `wiki connect`, and `knowhow` capture |
| `ui-codify-knowhow` | Out of current architecture scope | UI codification belongs to Maestro's broader UI workflow system, not the requested local knowledge core; reusable UI lessons can be captured through `knowhow`, `spec add`, or `learn` |

## DevFlow documentation/template updates

- Generated workflow Phase 3.3 now points users to `devflow knowledge learn`, `devflow spec add`, `devflow knowhow add`, wiki CRUD, connect, cleanup, digest, and gap issue creation.
- Generated learn skill now documents `devflow spec init/list/status`, `devflow spec add`, `devflow knowhow`, wiki CRUD, graph, connect, cleanup, digest, and stats.

## Final validation set

Run after the last implementation increment:

- `pnpm --filter @enpd/devflow test -- test/commands/knowledge.test.ts test/templates/devflow.test.ts`
- `pnpm --filter @enpd/devflow typecheck`
- `pnpm --filter @enpd/devflow lint`
- `pnpm --filter @enpd/devflow build`

Compiled smoke commands run in temp projects:

- `devflow spec add --layer backend --file quality-guidelines.md --title ... --body ... --category quality --keywords compiled,spec --json`
- `devflow spec --category quality --keyword compiled --json`
- `devflow knowhow add --type recipe --slug auth-tool --title ... --body ... --tool --category coding --json`
- `devflow spec --category coding --keyword auth --json`
- `devflow wiki list --tool --category coding --json`
- `devflow spec init --json`
- `devflow spec list --layer guides --json`
- `devflow spec status --json`

