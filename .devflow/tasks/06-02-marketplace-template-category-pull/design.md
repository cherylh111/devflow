# Marketplace template category pull design

## Architecture And Boundaries

The change extends the existing marketplace registry path instead of creating a
new marketplace subsystem.

- `packages/cli/src/utils/template-fetcher.ts` remains the transport and
  installer boundary for marketplace entries.
- `packages/cli/src/commands/init.ts` remains the command surface for init-time
  template pulls.
- `packages/cli/src/utils/workflow-resolver.ts` keeps its workflow-specific
  single-file resolver. Generic category pulls do not take over
  `devflow workflow` behavior.
- `marketplace/index.json` keeps the existing `templates[]` shape. Category
  matching uses `tags` so entries can opt into `common`, `uware`, or any future
  category without redefining template `type`.

## Data Model

Existing template entries already support:

```json
{
  "id": "example",
  "type": "skill",
  "name": "Example",
  "path": "skills/example",
  "tags": ["common", "uware"]
}
```

Category selection should match against `tags`. Template `type` continues to
drive the install destination.

Supported generic install types:

- `spec` -> `.devflow/spec`
- `skill` -> `.agents/skills/<template-id>` so marketplace paths like
  `skills/devflow-spec-bootstarp` keep a valid skill directory after install
- `command` -> `.claude/commands`
- `full` -> project root

`workflow` remains resolved by `devflow workflow` / `init --workflow`, because it
has a special hash ownership contract for `.devflow/workflow.md`.

## Registry Sources

Remote registry behavior should remain compatible with the current parser:

- `gh:org/repo/marketplace`
- `https://github.com/org/repo/tree/main/marketplace`
- self-hosted GitLab HTTPS/SSH
- Git-backed fallback for private/self-hosted registries

Add local filesystem marketplace support for paths such as:

- `C:\marketplace`
- `C:/marketplace`
- `./marketplace`

Local marketplace behavior:

- Read `<root>/index.json`.
- Copy each selected entry from `<root>/<entry.path>`.
- Reuse the same `skip` / `overwrite` / `append` strategies.
- Validate every template path stays inside the local marketplace root.

## Command Surface

Preserve existing behavior:

```bash
devflow init --registry <source> --template <id>
```

Add batch selection:

```bash
devflow init --registry <source> --templates <id1,id2>
devflow init --registry <source> --categories common,uware
```

Rules:

- `--template <id>` remains the single-template compatibility path.
- `--templates` selects multiple explicit ids.
- `--categories` selects all templates whose `tags` contain any requested
  category.
- `--templates` and `--categories` can be combined; duplicate ids are installed
  once in stable index order.
- `--categories` must work for both local marketplace roots and remote registry
  sources such as `gh:org/repo/marketplace`.
- If no selected entry matches, fail with a clear message instead of falling
  back to blank templates.
- In `-y` mode, `--categories` or `--templates` makes marketplace selection
  deterministic, so the current "marketplace with multiple templates" error
  should not fire.

## Data Flow

1. Parse the registry source as either a local marketplace root or existing
   remote registry source.
2. Probe/read `index.json`.
3. Resolve selected entries:
   - explicit ids from `--template` / `--templates`
   - category matches from `--categories`
4. Validate installability:
   - supported type
   - path inside registry root
5. Install each entry using existing strategy semantics.
6. Report per-entry success/skip/failure and abort on failures that make the
   requested selection incomplete.

## Compatibility

- Existing single `spec` template installs must keep the same destination and
  retry messaging.
- Existing direct-download registry behavior when no `index.json` exists should
  remain for `spec` direct downloads.
- Remote category batch pulls should reuse the existing HTTP/Git registry probe
  and download backend instead of adding a separate fetch path.
- Interactive template selection can continue to list only `spec` entries for
  now; the new multi-entry feature is primarily non-interactive through
  explicit flags.
- The `workflow` hash contract must not be bypassed by category pulls.

## Trade-Offs

Using tags/categories avoids adding a new hard-coded template type for every
business category. The trade-off is that marketplace authors must tag entries
correctly, and the CLI must surface available categories when a requested
category is unknown.

Local filesystem support increases implementation surface, but it directly
serves the requested `C:\marketplace` workflow and can reuse existing directory
copy helpers.

## Rollback

The change is additive. Rollback is to remove the new flags and local-source
branch while leaving current `--registry --template` behavior untouched.
