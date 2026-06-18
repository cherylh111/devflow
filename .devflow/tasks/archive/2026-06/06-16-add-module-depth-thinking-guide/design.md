# Add Module Depth Thinking Guide Design

## Boundaries

This task is documentation-only. It adds one thinking guide and updates the guide index. It should not modify production TypeScript, Python scripts, generated templates, or workflow routing.

## Target Files

- `.devflow/spec/guides/module-depth-thinking-guide.md`
- `.devflow/spec/guides/index.md`

## Guide Shape

The guide should remain short and decision-oriented:

- when module-depth thinking is useful;
- interface-depth questions;
- shallow-module warning signs;
- deep-module signs;
- relationship to deletion test and cross-layer guides;
- a short DevFlow-specific checklist.

## Compatibility

The guide is local project knowledge under `.devflow/spec/`. It does not need English/Chinese template parity unless a future task decides to ship it as an init template.

## Rollback

Delete the new guide and remove its row from `.devflow/spec/guides/index.md`.
