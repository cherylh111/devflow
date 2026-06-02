# Marketplace template category pull

## Goal

Allow DevFlow marketplace pulls to install custom template groups from a
specified marketplace directory/source, including multiple categories in one
operation such as `common`, `uware`, and other user-defined categories.

The user wants to support a local or remote marketplace layout like
`C:\marketplace\...` and pull several template categories together instead of
being limited to one `spec` template install. Category batch pulls such as
`--categories common,uware` must work against remote marketplace sources too.

## Confirmed Facts

- The CLI already has marketplace-style registry support through
  `packages/cli/src/utils/template-fetcher.ts`.
- Existing registry sources support GitHub/GitLab/Bitbucket-style sources,
  HTTPS/SSH/self-hosted GitLab, HTTP probing, and Git-backed fallback.
- Current `marketplace/index.json` already contains more than one template
  type: `skill` and `workflow`.
- `downloadTemplateById()` currently rejects non-`spec` entries with an
  "only spec is supported" error, even though install paths exist for `skill`,
  `command`, and `full`.
- Current `init --registry --template` supports a single selected template id.
  It does not support selecting multiple template ids or categories in one run.
- `common` currently exists as an internal platform template directory category:
  every `AI_TOOLS[*].templateDirs` includes `common`.
- `uware` is not currently a known `TemplateDir`, platform, marketplace type, or
  install category in the codebase.
- Product decision: `common`, `uware`, and future names are marketplace
  groups/categories represented by metadata such as `tags`, not template types.
  Selected entries still install according to their individual template type.
- User clarification: batch category selection is expected to pull from remote
  marketplace sources as well as any supported local marketplace root.

## Requirements

- Support marketplace pulls from a specified marketplace source/directory.
- Support local filesystem marketplace roots such as `C:\marketplace` as well
  as existing remote Git/HTTP registry sources.
- Support `--categories common,uware` against remote marketplace sources.
- Support custom template entries beyond `spec`, including at least the
  template types needed by selected category entries.
- Support pulling multiple categories/templates in one operation.
- Treat category selection as matching marketplace entry metadata, initially via
  the existing `tags` field.
- Preserve existing `spec` template behavior and registry error handling.
- Keep marketplace paths constrained to the registry root; no path traversal.
- Add tests that cover multi-category/category-based pulls and unsupported or
  malformed marketplace entries.

## Acceptance Criteria

- [x] A marketplace index can tag templates with `common`, `uware`, or other
      categories, and category selection installs every matching entry.
- [x] A user can request multiple marketplace entries/categories in one
      non-interactive command invocation.
- [x] A local marketplace root such as `C:\marketplace` can be used without
      requiring a Git provider prefix.
- [x] The same category selection works against remote registry sources such as
      `gh:org/repo/marketplace`.
- [x] Existing `devflow init --registry ... --template <spec-id>` behavior still
      installs spec templates into `.devflow/spec`.
- [x] Unknown categories produce a clear user-facing error that lists available
      categories from the marketplace index.
- [x] Non-`spec` selected entries install only when their type has a supported
      install destination; unsupported types produce a clear error.
- [x] Git-backed registry tests still pass for marketplace index probing and
      downloads.
- [x] New tests cover the Windows-style source/destination concern without
      relying on platform-specific path separators.

## Out Of Scope

- Publishing or hosting a new remote marketplace.
- Changing workflow template switching semantics unless needed for shared
  registry plumbing.
- Adding a new AI platform named `uware` unless the category decision explicitly
  requires it.

## Open Questions

- None blocking planning.

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
