# Remove Auto runner implementation

## Goal

Remove the Auto runner fast-path implementation from DevFlow so new and updated projects no longer receive an `auto-run` command or skill, and this repository no longer advertises or carries the generated Auto runner files.

## Requirements

- Remove the Auto runner command template from CLI source templates in every supported template language.
- Remove Auto runner registration/metadata from shared configurator code so generated command and skill sets no longer include it.
- Remove generated/local Auto runner files from this repository, including platform command copies and the local `.agents` skill.
- Remove user-facing README documentation for Auto-Run.
- Keep the normal manual DevFlow workflow, task commands, finish-work flow, and channel runtime untouched.

## Acceptance Criteria

- [x] Searching the repository for Auto runner identifiers finds only this task's planning/history artifacts, not active source, generated command, skill, or README documentation.
- [x] CLI template/configurator tests pass or are updated to reflect that `auto-run` is no longer emitted.
- [x] Project typecheck/test checks relevant to the CLI pass.

## Out of Scope

- Removing unrelated task queue, task archive, finish-work, or channel command behavior.
- Adding a replacement automated runner.
