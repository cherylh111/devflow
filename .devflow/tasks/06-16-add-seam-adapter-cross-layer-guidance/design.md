# Add Seam Adapter Cross-Layer Guidance Design

## Boundaries

This is a guide-only change under `.devflow/spec/guides/`. It should not modify runtime code or tests unless a link/check requires a small docs-only validation update.

## Target File

- `.devflow/spec/guides/cross-layer-thinking-guide.md`

## Content Shape

Add a section covering:

- trigger questions;
- seam versus adapter definitions;
- when a boundary should absorb external volatility;
- when a wrapper is too shallow;
- DevFlow examples.

## Compatibility

No generated template parity is required for local spec guide updates.

## Rollback

Remove the seam/adapter section.
