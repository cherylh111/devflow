# Marketplace template category pull implementation plan

## Checklist

- [x] Read relevant backend and unit-test specs before editing:
      `.devflow/spec/devflow/backend/commands-update.md` is not directly
      relevant, but `error-handling.md`, `quality-guidelines.md`,
      `commands-workflow.md`, and unit-test conventions are.
- [x] Extend marketplace source handling to distinguish local filesystem roots
      from remote registry sources without breaking existing
      `parseRegistrySource()` behavior.
- [x] Add local index probing and local directory copy support in
      `template-fetcher.ts`.
- [x] Generalize selected template installation so `downloadTemplateById()`
      supports `spec`, `skill`, `command`, and `full`, while keeping `workflow`
      unsupported in the generic installer with a workflow-specific error.
- [x] Add helpers to resolve selected templates from explicit ids and category
      tags, deduplicating in marketplace index order.
- [x] Ensure category selection works with remote registry probes and passes the
      resolved registry backend into each selected download.
- [x] Add CLI options to `devflow init`:
      `--templates <ids>` and `--categories <names>`.
- [x] Wire non-interactive init selection so `-y --registry <source>
      --categories common,uware` installs all matching entries instead of
      failing because the marketplace contains multiple templates.
- [x] Keep existing `--template <id>` behavior compatible.
- [x] Add unit tests in `packages/cli/test/utils/template-fetcher.test.ts` for
      local marketplace probing, local path traversal rejection, category
      resolution, non-`spec` install paths, and unsupported `workflow` generic
      install.
- [x] Add command-level coverage if init option behavior needs validation beyond
      pure helper tests.
- [x] Run focused tests, then broader package validation.

## Validation Commands

```bash
pnpm test packages/cli/test/utils/template-fetcher.test.ts
pnpm test packages/cli/test/commands/init.integration.test.ts
pnpm lint
pnpm typecheck
```

## Risky Files

- `packages/cli/src/utils/template-fetcher.ts`: shared remote registry behavior;
  regressions here affect custom registry installs and workflow resolver reuse.
- `packages/cli/src/commands/init.ts`: large command flow with monorepo,
  interactive, and non-interactive branches.
- `packages/cli/src/cli/index.ts`: commander options must stay aligned with
  `InitOptions`.

## Review Gates

- Confirm existing direct registry mode still triggers only when no `index.json`
  exists.
- Confirm category selection does not silently install zero templates.
- Confirm local paths cannot escape the marketplace root through `..` segments.
- Confirm `workflow` entries are still handled through workflow-specific code.
