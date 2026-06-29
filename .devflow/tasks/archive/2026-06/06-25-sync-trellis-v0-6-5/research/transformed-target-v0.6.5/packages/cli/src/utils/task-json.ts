/**
 * Canonical task.json shape — single source of truth shared by all TS
 * writers. The canonical types and factory now live in the
 * `@enpd/devflow-core` task API; this module re-exports them under
 * the legacy `TaskJson` / `emptyTaskJson` names for CLI call sites.
 *
 * New code should prefer `DevFlowTaskRecord` / `emptyTaskRecord` from
 * `@enpd/devflow-core/task` directly.
 */

import {
  emptyTaskRecord,
  type DevFlowTaskRecord,
} from "@enpd/devflow-core/task";

export type TaskJson = DevFlowTaskRecord;

export const emptyTaskJson = emptyTaskRecord;
