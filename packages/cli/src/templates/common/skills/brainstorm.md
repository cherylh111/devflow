# DevFlow Brainstorm

## Non-Negotiable Interview Contract

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time.

## Non-Negotiable Evidence Rule

If a question can be answered by exploring the codebase, explore the codebase instead.

This is mandatory. Before asking the user a question, first check whether the answer is already available in code, tests, configs, docs, existing specs, or task history.

Do not ask the user to confirm facts that the repository can answer. Ask only for product intent, preference, scope, risk tolerance, or decisions that remain ambiguous after inspection.

---

Use this skill during Phase 1 planning to turn the user's request into clear requirements and planning artifacts.

## Preconditions

Use this skill only after task-creation consent has been given and the user is ready to enter DevFlow planning.

If no task exists yet, create one:

```bash
TASK_DIR=$({{PYTHON_CMD}} ./.devflow/scripts/task.py create "<short task title>" --slug <slug>)
```

Use a concise title from the user's request. Use a slug without a date prefix. `task.py create` adds the `MM-DD-` directory prefix automatically.

`task.py create` creates the default `prd.md`. Update that file with the current understanding before asking follow-up questions.

## Planning Flow

1. Load domain vocabulary if it exists:
   ```bash
   cat .devflow/spec/wiki/domain-vocabulary.md 2>/dev/null || echo "No vocabulary file yet"
   ```
   Use it to maintain term consistency during requirements exploration.
2. Capture the user's request and initial known facts in `prd.md`.
2. Inspect available evidence before asking questions:
   - code, tests, fixtures, and configs
   - README files, docs, existing specs, and domain notes
   - related DevFlow tasks, research files, and session history when present
3. Separate what you found into:
   - confirmed facts
   - product intent still needed from the user
   - scope or risk decisions still needed from the user
   - likely out-of-scope items
4. Ask the single highest-value remaining question.
5. Include your recommended answer with the question.
6. After each user answer, update `prd.md` before continuing.
7. For complex tasks, create or update `design.md` and `implement.md` before implementation starts.

Do not invent a project-specific product/spec hierarchy. If the repository already has product, domain, or spec docs, use them. If it does not, proceed with the evidence that exists.

## When To Use Prototyping

If a key design question has high feasibility risk and cannot be answered through code inspection or existing tests, consider using `devflow-prototype` before finalizing the design:

- state machine or lifecycle edge cases are unclear;
- multiple UI approaches need comparison;
- performance or integration assumptions are unvalidated.

The prototype must produce findings in the task `research/` directory before implementation starts.

## Vertical Slice Decomposition

When the request contains several independently verifiable deliverables, consider a parent/child task split.

Use this mapping:

- Parent task: owns the source requirement set, shared research, task map, cross-child acceptance criteria, and final integration review.
- Child task: owns one thin, end-to-end vertical slice that can be planned, implemented, checked, and archived independently.

Prefer tracer-bullet slices over horizontal layer slices:

- Good: one narrow behavior path through schema/config, command/API, user-visible output, and tests.
- Bad: one child for "types", one child for "backend", one child for "tests" when none is independently verifiable.

Before creating children, draft the proposed slice list in the parent `prd.md` or `design.md`:

- title
- independently verifiable outcome
- blocked-by relationship, if any
- whether human review is required before implementation

Dependencies must be written in child artifacts. Do not rely on tree position to imply ordering.

### Implementation Readiness

Before activating a child task, classify each slice as planning-ready, not as a
new task status:

- AFK-ready: the child has enough context, constraints, target files, validation
  commands, and acceptance criteria for autonomous implementation.
- HITL-required: the child still depends on a human decision, manual review,
  credential/access step, external system, or unresolved product scope.

A child is implementation-ready only when:

- the outcome can be verified without completing sibling tasks;
- blockers and ordering constraints are written in the child `prd.md`,
  `design.md`, or `implement.md`;
- HITL dependencies are explicit, including who must act and what unblocks work;
- validation expectations are concrete enough for the implementation agent to run.

Do not introduce new workflow phases or task statuses for AFK/HITL. Treat them
as planning labels that decide whether to start the child now, defer it, or ask
one more product/scope question.

## Question Rules

Ask only one question per message.

Each question must include:

- the decision needed
- why the answer matters
- your recommended answer
- the trade-off if the user chooses differently

Do not ask process questions such as whether to search, inspect files, or continue brainstorming. Do the evidence work directly. Ask the user only when the remaining issue is a product decision, preference, scope boundary, or risk tolerance choice.

## Artifact Rules

`prd.md` records requirements and acceptance:

- goal and user value
- confirmed facts
- requirements
- acceptance criteria
- out of scope
- open questions that still block planning

`design.md` records technical design for complex tasks:

- architecture and boundaries
- data flow and contracts
- compatibility and migration notes
- important trade-offs
- operational or rollback considerations

`implement.md` records execution planning for complex tasks:

- ordered implementation checklist
- validation commands
- risky files or rollback points
- follow-up checks before `task.py start`

Lightweight tasks may have only `prd.md`. Complex tasks must have `prd.md`, `design.md`, and `implement.md` before `task.py start`.

`implement.md` is not a replacement for `implement.jsonl`. Use JSONL files only for manifest-style spec and research references when the task needs them.

Before start review, converge `prd.md` into its final form:

- Remove temporary brainstorm sections such as `What I already know`, `Assumptions`, `Open Questions`, `Brainstorm Notes`, and `Raw Notes`.
- Fold discovery notes and resolved questions into final requirements, constraints, acceptance criteria, or out-of-scope sections.
- Clear placeholder bullets such as `- TBD`, `- [ ] TBD`, `- TODO`, and `- [ ] TODO`.
- Move technical design or execution details into `design.md` or `implement.md` for complex tasks.

## Decision Capture

When a design decision is made during brainstorming, check if it warrants an ADR using the 3-condition filter:

1. **Hard to reverse?** - Changing this decision would take significant effort (> 1 week)
2. **Surprising without context?** - Future readers would wonder "why this way?"
3. **Result of real trade-off?** - Genuine alternatives existed

If **all three** are true, create an ADR in `docs/adr/NNNN-slug.md` using the minimal format:

```markdown
# {Short title}

{1-3 sentences: context, decision, why.}
```

Examples of ADR-worthy decisions:
- Database choice (PostgreSQL vs MongoDB)
- API architecture (REST vs GraphQL vs gRPC)
- Monorepo vs multi-repo structure
- Event sourcing for audit trail

Not ADR-worthy:
- Standard language features (async/await)
- Obvious practices (error handling)
- Easily reversible choices (file naming)

## Quality Bar

Before declaring planning ready:

- `prd.md` contains testable acceptance criteria.
- `prd.md` has been converged and no longer contains temporary brainstorm sections or placeholder bullets.
- Repository-answerable questions have already been answered through inspection.
- Remaining open questions are genuinely about user intent or scope.
- Complex tasks have `design.md` and `implement.md`.
- The user has reviewed the final planning artifacts or explicitly approved proceeding.

Do not start implementation until the user approves or asks for implementation.
