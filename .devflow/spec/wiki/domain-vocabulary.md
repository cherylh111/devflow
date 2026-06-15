# Domain Vocabulary

Runtime glossary for project-specific terms. Load this in skills that explore requirements or design — not in session start, to avoid context pollution.

---

## DevFlow Terms

**Task**: A directory under `.devflow/tasks/` that owns planning artifacts (`prd.md`, `design.md`, `implement.md`), implementation/check manifests (`.jsonl`), and research outputs. Tasks move through planning → in_progress → completed lifecycle. _Avoid_: "ticket", "issue" (those are external tracker concepts).

**Phase**: One of three workflow stages (Plan, Execute, Finish) in `.devflow/workflow.md`. Each phase has ordered steps with `[required]`, `[optional]`, or `[once]` tags. _Avoid_: "stage" (we use "phase" consistently in workflow docs).

**Spec**: A package-scoped or cross-cutting guideline document in `.devflow/spec/<package>/<layer>/`. Specs define coding conventions, architecture rules, and quality checks. They're authoritative for implementation/check agents. _Avoid_: "standard", "guideline" (we use "spec" for the directory structure).

**Agent**: A sub-agent dispatched for a specific role (implement, check, research). Agents read task manifests (`.jsonl`) to load context on demand. _Avoid_: "bot", "assistant" (those are generic; we use "agent" for DevFlow sub-roles).

**Manifest**: A `.jsonl` file (`implement.jsonl` or `check.jsonl`) that lists spec entries, research files, or knowledge IDs to inject into sub-agent context. Each line is a JSON object with `file`, `reason`, and optional `priority`. _Avoid_: "config" (manifests are context pointers, not configuration).

**Learnings**: Lightweight, searchable knowledge entries stored in `.devflow/spec/guides/learnings.md` as `<spec-entry>` blocks. Captured via `knowledge.py learn`. Different from specs (specs are rules; learnings are observations). _Avoid_: "notes", "tips" (we use "learnings" as the canonical term).

**Hook**: A Python script in `.devflow/hooks/` or `.claude/hooks/` that runs on lifecycle events (session-start, user-prompt-submit, etc.). Hooks inject context or validate actions. _Avoid_: "trigger", "callback" (we use "hook" consistently).

---

## Anti-Patterns

**Don't add**:
- General programming terms (function, class, API) — these have universal meaning
- Framework/library names unless DevFlow customizes them (e.g., "Task" is DevFlow-specific; "React" is not)
- Acronyms without expansion (write "Architecture Decision Record (ADR)" first)

**When to add**:
- Term appears in 3+ task artifacts with project-specific meaning
- New developers regularly ask "what does X mean here?"
- Term's local usage differs from industry standard

---

## Maintenance

- Update definitions when scope changes (e.g., Task gains new lifecycle states)
- Remove stale entries when concepts are deprecated
- Keep `_Avoid_:` up to date with synonyms people actually use
