---
name: devflow-prototype
description: "Build a throwaway prototype to answer a design question before committing to implementation. Use during DevFlow planning or research when feasibility is uncertain, a state model needs validation, UI options need comparison, or the user asks to prototype, mock it up, or try a few designs."
---

# DevFlow Prototype

A prototype is throwaway code that answers a question. The question decides the shape.

## Preconditions

Use this skill only in Phase 1 planning or research. If implementation has already started, return to planning for the specific sub-question before prototyping.

Resolve the active task first:

```bash
python ./.devflow/scripts/task.py current --source
```

Read the task `prd.md`, then `design.md`, `implement.md`, and existing `research/` notes when present.

Do not prototype when code inspection, existing tests, or a short design note can answer the question.

## Pick A Branch

Choose the prototype shape from the question:

- Logic question: use [LOGIC.md](LOGIC.md) for state machines, parsers, algorithms, lifecycle rules, or boundary cases.
- UI question: use [UI.md](UI.md) for layout, interaction, or visual comparison across multiple variants.

If the question is ambiguous, default to the surrounding code: backend or CLI modules use the logic branch; pages and components use the UI branch. State the assumption in the findings.

## Build Rules

1. Name the work clearly as a prototype.
2. Keep it outside production paths, or place it near the explored code with an explicit prototype marker.
3. Provide one project-native command to run it.
4. Keep state in memory unless persistence is the question.
5. Skip polish: no broad tests, no abstractions, no production error handling.
6. Surface the relevant state after every operation or interaction.

## Capture Findings

Write the durable answer before leaving the prototype:

Create `.devflow/tasks/TASK_DIR/research/prototype-SLUG-findings.md` from this skill's `prototype-findings-template.md`.

Fill in:

- the question being answered;
- the evidence gathered;
- what worked, what failed, and why;
- the decision for real implementation;
- whether prototype code was deleted, kept temporarily, or rewritten.

The answer is the only thing worth keeping by default.

## Cleanup Decision

Before ending the session, make one explicit decision:

- Delete the prototype code.
- Keep it temporarily and add `PROTOTYPE-DELETE-ME.md` beside it with the deadline and owner.
- Rewrite the validated approach properly in Phase 2 with normal tests, error handling, and specs.

Never let prototype code silently become production.
