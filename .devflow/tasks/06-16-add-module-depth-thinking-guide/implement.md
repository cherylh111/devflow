# Add Module Depth Thinking Guide Implementation Plan

## Checklist

1. Read current guide index and related guides:
   - [ ] `.devflow/spec/guides/index.md`
   - [ ] `.devflow/spec/guides/code-reuse-thinking-guide.md`
   - [ ] `.devflow/spec/guides/cross-layer-thinking-guide.md`
2. Add `.devflow/spec/guides/module-depth-thinking-guide.md`.
3. Update `.devflow/spec/guides/index.md`.
4. Validate:
   - [ ] Check links and paths.
   - [ ] Verify no production files changed.
   - [ ] Run `git diff --check`.

## Risk

The main risk is duplicating existing code reuse guidance. Keep this guide focused on interface/implementation depth and link out for deletion-test details.

## Rollback

Remove the new guide and index entry.
