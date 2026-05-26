# DevFlow spec command parity

Date: 2026-05-26

## Maestro source

- `src/commands/spec.ts`
- `workflows/specs-add.md`
- `workflows/specs-load.md`
- `workflows/specs-setup.md`

Maestro exposes `spec load/list/init/status/add` for closed `<spec-entry>`
blocks. It also supports scoped spec roots, injection config, analytics, and
ref/knowhow integration around `.workflow/specs/` and `.workflow/knowhow/`.

## DevFlow adaptation

DevFlow keeps specs under `.devflow/spec/`, with projects allowed to use either
package/layer directories or the simpler layer-only scaffold. Because there is
no universal category-to-file map in this structure, DevFlow uses explicit
targeting for writes:

```bash
devflow spec add --layer backend --file quality-guidelines.md --title "Rule" --body "Rule body"
devflow spec add --path cli/backend/workflow-state-contract.md --title "Rule" --body "Rule body"
```

The command surface:

- preserves top-level `devflow spec` loading plus grouped `devflow knowledge specs`
  and top-level `devflow specs` aliases;
- adds `devflow spec init` to create the local learnings scaffold;
- adds `devflow spec list` to list markdown spec files under `.devflow/spec`;
- adds `devflow spec status` to report file/document/diagnostic counts;
- adds `devflow spec add` to append a structured entry with `type="spec"`;
- creates the target markdown file with a basic title when needed;
- rejects targets outside `.devflow/spec`;
- supports `--category`, `--keywords`, `--source`, `--status`, `--related`, and
  `--json` for appended entries;
- keeps `category=learning` compatible with `.devflow/spec/guides/learnings.md`
  when no explicit target is provided.

## Implementation notes

Commander parses duplicate parent/subcommand options such as `--layer`,
`--category`, and `--json` on the parent `spec` command when the parent already
owns those options for loading. `spec init/list/status/add` merge selected parent
options into the subcommand options so loader filters and management flags work
without breaking existing syntax.

The writer append primitive now accepts optional `related` metadata so spec
entries created through `spec add` participate in the same graph/connect/cleanup
flows as other structured knowledge.

Maestro's scoped spec roots (`global`, `team`, `personal`), injection config,
hook analytics, and TUI are intentionally not ported. DevFlow's current
architecture is a local file-based knowledge store under `.devflow/spec` plus
explicit workflow/skill loading; automatic dashboard/hook injection is outside
this migration unless requested separately.

## Validation

- `pnpm --filter @enpd/devflow test -- test/commands/knowledge.test.ts test/templates/devflow.test.ts`
- `pnpm --filter @enpd/devflow typecheck`
- `pnpm --filter @enpd/devflow lint`
- `pnpm --filter @enpd/devflow build`
- Compiled CLI smoke:
  - `devflow spec add --layer backend --file quality-guidelines.md --title ... --body ... --category quality --keywords compiled,spec --json`
  - `devflow spec --category quality --keyword compiled --json`
  - `devflow spec init --json`
  - `devflow spec list --layer guides --json`
  - `devflow spec status --json`

