/**
 * Public surface for `@enpd/devflow-core/mem` — reusable retrieval and
 * dialogue-context extraction over persisted Claude Code / Codex / OpenCode
 * sessions.
 *
 * This subpackage is intentionally NOT re-exported from the root
 * `@enpd/devflow-core` barrel. Import it explicitly:
 *
 *   import { searchMemSessions } from "@enpd/devflow-core/mem";
 *
 * v1 scope: persisted-session search and context extraction only. It does not
 * read channel / forum / thread event logs and has no cursor / pagination.
 */

export {
  listMemSessions,
  searchMemSessions,
  extractMemDialogue,
  MemSessionNotFoundError,
} from "./sessions.js";

export { readMemContext } from "./context.js";

export { listMemProjects } from "./projects.js";

export { inRange, inRangeOverlap, sameProject } from "./filter.js";

export {
  parseTaskPyCommand,
  parseTaskPyCommandsAll,
  splitShellArgs,
  slugFromTaskDir,
  buildBrainstormWindows,
} from "./phase.js";

export {
  claudeListSessions,
  claudeExtractDialogue,
  claudeSearch,
  collectClaudeTurnsAndEvents,
} from "./adapters/claude.js";

export {
  codexListSessions,
  codexExtractDialogue,
  codexSearch,
  collectCodexTurnsAndEvents,
  commandFromCodexArguments,
} from "./adapters/codex.js";

export {
  opencodeListSessions,
  opencodeExtractDialogue,
  opencodeSearch,
} from "./adapters/opencode.js";

export type {
  MemSourceKind,
  MemSourceFilter,
  MemPhase,
  DialogueRole,
  DialogueTurn,
  MemFilter,
  MemSessionInfo,
  SearchExcerpt,
  SearchHit,
  MemWarning,
  MemSearchMatch,
  MemSearchResult,
  MemContextTurn,
  MemContextResult,
  BrainstormWindow,
  MemDialogueGroup,
  MemExtractResult,
  MemProjectSummary,
  ListMemSessionsOptions,
  SearchMemSessionsOptions,
  ReadMemContextOptions,
  ExtractMemDialogueOptions,
  ListMemProjectsOptions,
  ParsedTaskPyCommand,
  TaskPyEvent,
} from "./types.js";
