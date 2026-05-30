# DevFlow Core Backend Guidelines

> Package-boundary and backend engineering rules for `@enpd/devflow-core`.

---

## Overview

This layer applies to `packages/core/**`, including channel, task, mem, and testing domain primitives consumed by the DevFlow CLI and downstream Node services.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [DevFlow Core SDK](./devflow-core-sdk.md) | Public exports, package boundaries, build ordering, testing ownership, and CLI/core separation | Done |

---

## Pre-Development Checklist

Before editing `packages/core/**`, moving reusable CLI logic into core, or changing CLI imports from `@enpd/devflow-core`, read [devflow-core-sdk.md](./devflow-core-sdk.md).

---

## Quality Check

After editing core code:

1. Confirm public exports are intentional and declared in `packages/core/package.json`.
2. Verify CLI code imports only public `@enpd/devflow-core` subpaths.
3. Put pure domain tests in `packages/core/test/**`; keep CLI rendering and option parsing tests in `packages/cli/test/**`.
4. Run targeted validation first, then broader checks when package boundaries changed:
   ```bash
   pnpm --filter @enpd/devflow-core test
   pnpm --filter @enpd/devflow-core build
   pnpm --filter @enpd/devflow typecheck
   ```

---

**Language**: All documentation should be written in **English**.