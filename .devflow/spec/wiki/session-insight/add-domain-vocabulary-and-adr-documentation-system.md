<spec-entry
  id="insight-20260615-171251-add-domain-vocabulary-and-adr-documentation-system"
  type="session-insight"
  category="session"
  keywords="session-insight,finish-work,devflow,diff"
  source="finish-work"
  date="2026-06-15"
  package="devflow"
  branch="main"
  commits="768814c,7e5147f,3dc5c7b"
>

### Add domain vocabulary and ADR documentation system

#### Summary

Implemented CONTEXT.md/ADR system with templates, skills integration, and session-start hook support. Created 6 templates (vocabulary + ADR in EN/ZH), updated brainstorm/learn skills with vocabulary loading and ADR prompts, added path hints to session-start hook, and created local dogfood files. Fixed 2 test issues (Chinese line count, undefined variable). All 1336 tests passing.

#### Commits

- `768814c`
- `7e5147f`
- `3dc5c7b`

#### Changed Files

- `.devflow/spec/adr/.gitkeep`
- `.devflow/spec/wiki/domain-vocabulary.md`
- `.devflow/tasks/06-15-06-15-add-context-adr-system/check.jsonl`
- `.devflow/tasks/06-15-06-15-add-context-adr-system/design.md`
- `.devflow/tasks/06-15-06-15-add-context-adr-system/implement.jsonl`
- `.devflow/tasks/06-15-06-15-add-context-adr-system/implement.md`
- `.devflow/tasks/06-15-06-15-add-context-adr-system/prd.md`
- `.devflow/tasks/06-15-06-15-add-context-adr-system/task.json`
- `.devflow/tasks/06-15-skills-improvements-roadmap/task.json`
- `README.md`
- `packages/cli/src/templates/common/skills/brainstorm.md`
- `packages/cli/src/templates/common/skills/learn.md`
- `packages/cli/src/templates/markdown/docs/adr/0001-example.md.txt`
- `packages/cli/src/templates/markdown/docs/adr/_template.md.txt`
- `packages/cli/src/templates/markdown/spec/wiki/domain-vocabulary.md.txt`
- `packages/cli/src/templates/shared-hooks/session-start.py`
- `packages/cli/src/templates/zh/common/skills/brainstorm.md`
- `packages/cli/src/templates/zh/common/skills/learn.md`
- `packages/cli/src/templates/zh/markdown/docs/adr/0001-example.md.txt`
- `packages/cli/src/templates/zh/markdown/docs/adr/_template.md.txt`
- `packages/cli/src/templates/zh/markdown/spec/wiki/domain-vocabulary.md.txt`

#### Referenced Specs

- (No task spec references found.)

#### Review

- Reviewed by: (not recorded)

#### Key Decisions

- Acronyms without expansion (write "Architecture Decision Record (ADR)" first)
- └─> Prompt for ADR when design decision passes 3-condition filter
- └── 0002-user-decision.md
- ## Trade-offs
- ### Chosen: 按需加载 (On-demand loading)
- ### Chosen: 单文件 MVP (Single-file MVP)

#### Pitfalls

- Runtime glossary for project-specific terms. Load this in skills that explore requirements or design — not in session start, to avoid context pollution.
- Task**: A directory under `.devflow/tasks/` that owns planning artifacts (`prd.md`, `design.md`, `implement.md`), implementation/check manifests (`.jsonl`), and research outputs...
- Phase**: One of three workflow stages (Plan, Execute, Finish) in `.devflow/workflow.md`. Each phase has ordered steps with `[required]`, `[optional]`, or `[once]` tags. _Avoid_:...
- Spec**: A package-scoped or cross-cutting guideline document in `.devflow/spec/<package>/<layer>/`. Specs define coding conventions, architecture rules, and quality checks. They...
- Agent**: A sub-agent dispatched for a specific role (implement, check, research). Agents read task manifests (`.jsonl`) to load context on demand. _Avoid_: "bot", "assistant" (t...
- Manifest**: A `.jsonl` file (`implement.jsonl` or `check.jsonl`) that lists spec entries, research files, or knowledge IDs to inject into sub-agent context. Each line is a JSON ...

#### Invariants

- Phase**: One of three workflow stages (Plan, Execute, Finish) in `.devflow/workflow.md`. Each phase has ordered steps with `[required]`, `[optional]`, or `[once]` tags. _Avoid_:...
- This task adds documentation infrastructure (templates + integration points) for domain vocabulary and ADR systems. **No complex technical design required** - primarily file cre...
- Skills must remember to load vocabulary
- Implement CONTEXT.md/ADR documentation system through template creation, skill updates, and session start integration. No complex technical design required - primarily file crea...
- Three-condition admission criteria** (all must be true):
- Event schema evolution** - We must version events carefully and maintain backward compatibility. Introduces operational overhead.
</spec-entry>
