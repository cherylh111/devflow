# Improve Vertical Slice Readiness Guidance Implementation Plan

## Checklist

1. Read current brainstorm surfaces:
   - [ ] English common template
   - [ ] Chinese common template
   - [ ] Local dogfood skill
2. Add implementation-readiness and AFK/HITL wording.
3. Validate:
   - [ ] `git diff --check`
   - [ ] language parity/template tests if affected
   - [ ] lint/typecheck if tests are touched

## Risk

Avoid turning AFK/HITL into workflow statuses. They are planning labels only.

## Rollback

Revert brainstorm text edits.
