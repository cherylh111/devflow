# Add TDD Guidance To Before-Dev Implementation Plan

## Checklist

1. Read applicable specs:
   - [ ] `.devflow/spec/devflow/backend/skill-authoring.md`
   - [ ] `.devflow/spec/devflow/unit-test/conventions.md`
2. Inspect current before-dev templates and dogfood skill.
3. Add concise TDD guidance to:
   - [ ] English common template
   - [ ] Chinese common template
   - [ ] Local dogfood skill
4. Validate:
   - [ ] `git diff --check`
   - [ ] focused template/language parity tests if existing coverage applies
   - [ ] lint/typecheck if TypeScript test fixtures are touched

## Risk

The guidance could sound mandatory. Keep wording explicitly conditional and skip-friendly.

## Rollback

Revert the three before-dev text edits.
