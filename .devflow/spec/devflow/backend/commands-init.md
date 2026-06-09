# `devflow init` Command

`devflow init` creates the project-local DevFlow structure and can optionally
pull marketplace templates before writing default spec scaffolding.

## Scenario: marketplace template selection

### 1. Scope / Trigger

Trigger: editing init-time marketplace lookup, template selection flags, local
registry path support, or generic template installation behavior in:

- `packages/cli/src/cli/index.ts`
- `packages/cli/src/commands/init.ts`
- `packages/cli/src/utils/template-fetcher.ts`
- `packages/cli/test/commands/init.integration.test.ts`
- `packages/cli/test/utils/template-fetcher.test.ts`

### 2. Signatures

CLI signatures:

```text
devflow init --registry <source> --template <id>
devflow init --registry <source> --templates <id1,id2>
devflow init --registry <source> --categories <category1,category2>
devflow init --registry <local-path> --categories <category1,category2>
```

Resolver signatures:

```typescript
export type RegistryBackend = "http" | "git" | "local";

export type MarketplaceSource = RegistrySource | LocalRegistrySource;

export function parseMarketplaceSource(source: string): MarketplaceSource;

export function selectMarketplaceTemplates(
  templates: SpecTemplate[],
  options: { ids?: string[]; categories?: string[] },
): TemplateSelectionResult;
```

### 3. Contracts

- `--template <id>` is the compatibility path for one selected template.
- `--templates <ids>` selects comma-separated explicit ids.
- `--categories <names>` selects templates whose `tags` contain any requested
  category. Category names are metadata, not template types.
- `--templates` and `--categories` may be combined. Duplicate ids install once
  in marketplace index order.
- Remote registries use the existing HTTP/Git probe and the backend returned by
  `probeRegistryIndex`.
- Local registry paths read `<root>/index.json` and copy entries from
  `<root>/<template.path>`.
- Generic install destinations are:
  - `spec` -> `.devflow/spec`
  - `skill` -> `.agents/skills/<template-id>`
  - `command` -> `.claude/commands`
  - `full` -> project root
- `workflow` entries must use workflow-specific commands, not generic pulls.
- Registry-backed `spec` installs persist their source/template identity in
  `.devflow/config.yaml` so `devflow update` can refresh them later. Persist the
  original source string, including provider prefixes and refs such as
  `gh:org/repo/path#branch`; do not reconstruct it from parsed pieces and drop
  the ref.
- Blank/default scaffolding and built-in non-registry spec creation must not
  write `registry.spec`; only a registry-backed spec template selection owns
  that config section.

### 4. Validation & Error Matrix

| Condition | Behavior |
|---|---|
| Remote registry probe has transient/auth/error result | Abort; never fall through to direct-download mode |
| Registry has no `index.json` and batch flags are present | Abort with batch-selection-specific message |
| Requested template id missing | Abort and name missing id(s) |
| Requested category missing | Abort and list available categories |
| Selection matches zero entries | Abort; do not fall back to blank templates |
| Selected template path escapes registry root | Return/print path-not-found style error |
| Selected type is unsupported | Return/print supported generic types |
| Selected type is `workflow` | Tell user to use `devflow workflow` or `init --workflow` |
| Registry-backed spec template installed | Write `.devflow/config.yaml` `registry.spec` with source + template id |
| Built-in/blank spec scaffolding installed | Do not write `registry.spec` |

### 5. Good/Base/Bad Cases

- Good: `devflow init -y --registry gh:org/repo/marketplace --categories common,uware`
  probes the remote index, installs all matching entries, and passes the probe's
  backend into each download.
- Base: `devflow init --registry gh:org/repo/marketplace --template backend`
  keeps the historical single-template behavior.
- Bad: `--categories common,uware` treats `common` and `uware` as template
  types, forcing new hard-coded install paths for every business grouping.
- Bad: a successful Git probe is followed by an HTTP/giget download, breaking
  private registries that only local Git credentials can access.

### 6. Tests Required

- Unit tests for comma selector parsing and category selection in index order.
- Unit tests for local registry parsing, `index.json` probing, local copy, and
  path traversal rejection.
- Unit tests for generic non-`spec` install destinations and `workflow`
  rejection.
- Integration test for `init -y --registry <remote> --categories ...` proving
  batch remote selection does not hit the old "multiple templates require
  interactive selection" branch.
- Existing Git-backed registry tests must keep asserting probe/download backend
  consistency.
- Integration tests for `init --registry <source> --template <id>` where the
  selected entry is `type: "spec"` must assert that `.devflow/config.yaml`
  records the exact source string and template id, including refs.

### 7. Wrong vs Correct

#### Wrong

```typescript
if (options.categories) {
  selectedType = options.categories;
}
```

This conflates category metadata with install types and makes every new
category a source-code change.

#### Correct

```typescript
const selection = selectMarketplaceTemplates(templates, {
  categories: splitSelectorList(options.categories),
});
```

The selected entry's `type` controls installation while `tags` only control
selection.

#### Wrong

```typescript
const probe = await probeRegistryIndex(indexUrl, registry);
await downloadTemplateById(cwd, id, strategy, template, registry);
```

This drops the backend that proved access to the registry.

#### Correct

```typescript
const probe = await probeRegistryIndex(indexUrl, registry);
await downloadTemplateById(cwd, id, strategy, template, registry, undefined, probe.backend);
```
