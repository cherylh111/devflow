<spec-entry
  id="insight-20260602-205500-06-02-marketplace-template-category-pull"
  type="session-insight"
  category="session"
  keywords="session-insight,finish-work,06-02-marketplace-template-category-pull,devflow,diff"
  source="finish-work"
  date="2026-06-02"
  task="06-02-marketplace-template-category-pull"
  package="devflow"
  branch="main"
  commits="d964ad5,2726ad1"
  derived_from=".devflow/tasks/archive/2026-06/06-02-marketplace-template-category-pull"
>

### Marketplace template category pulls

#### Summary

Added init-time marketplace batch template selection by template id and category tags, including remote/local registry support, generic template install paths, tests, and init command spec coverage.

#### Task

- Path: `.devflow/tasks/archive/2026-06/06-02-marketplace-template-category-pull`
- Title: Marketplace template category pull
- Why: Allow DevFlow marketplace pulls to install custom template groups from a specified marketplace directory/source, including multiple categories in one operation such as `common`, `uware`, and other user-defined categories. The user wants ...

#### Commits

- `d964ad5`
- `2726ad1`

#### Changed Files

- `.devflow/spec/devflow/backend/commands-init.md`
- `.devflow/spec/devflow/backend/index.md`
- `.devflow/tasks/06-02-marketplace-template-category-pull/check.jsonl`
- `.devflow/tasks/06-02-marketplace-template-category-pull/design.md`
- `.devflow/tasks/06-02-marketplace-template-category-pull/implement.jsonl`
- `.devflow/tasks/06-02-marketplace-template-category-pull/implement.md`
- `.devflow/tasks/06-02-marketplace-template-category-pull/prd.md`
- `.devflow/tasks/06-02-marketplace-template-category-pull/task.json`
- `packages/cli/src/cli/index.ts`
- `packages/cli/src/commands/init.ts`
- `packages/cli/src/utils/template-fetcher.ts`
- `packages/cli/test/commands/init.integration.test.ts`
- `packages/cli/test/utils/template-fetcher.test.ts`

#### Referenced Specs

- (No task spec references found.)

#### Review

- Reviewed by: (not recorded)

#### Key Decisions

- ## Trade-Offs
- business category. The trade-off is that marketplace authors must tag entries
- Product decision: `common`, `uware`, and future names are marketplace
- Adding a new AI platform named `uware` unless the category decision explicitly

#### Pitfalls

- `Local registry probe failed: ${error instanceof Error ? error.message : String(error)}`,
- Report per-entry success/skip/failure and abort on failures that make the
- Using tags/categories avoids adding a new hard-coded template type for every

#### Invariants

- expect(result.message).toContain("must stay inside");
- ### 3. Contracts
- `workflow` entries must use workflow-specific commands, not generic pulls.
- | Remote registry probe has transient/auth/error result | Abort; never fall through to direct-download mode |
- ### 6. Tests Required
- Existing Git-backed registry tests must keep asserting probe/download backend
</spec-entry>
