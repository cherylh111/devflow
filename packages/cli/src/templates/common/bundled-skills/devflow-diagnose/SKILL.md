---
name: devflow-diagnose
description: "Run a disciplined pre-fix diagnosis loop for bugs, failing tests, broken behavior, errors, crashes, flaky behavior, or performance regressions in a DevFlow-managed project. Use before making fixes when the root cause is not already proven."
---

# DevFlow Diagnose

Use this skill before changing code for a bug unless the root cause and fix are already proven by existing evidence. The goal is a fast, deterministic feedback loop that lets the fix be verified, not a long theory-first investigation.

This skill complements `devflow-break-loop`: use `devflow-diagnose` before and during the fix; use `devflow-break-loop` after repeated failed fixes or when the final lesson needs deeper retrospective capture.

## Ground The Task

1. Resolve the current task with:
   ```bash
   {{PYTHON_CMD}} ./.devflow/scripts/task.py current --source
   ```
2. Read `prd.md`, then `design.md` and `implement.md` if present.
3. Read relevant `research/` notes if the task already has debugging evidence.
4. Load applicable specs before edits. Use `devflow-before-dev` when available.

If there is no active task and the bug work is more than a trivial answer, return to DevFlow planning before making code changes.

## Build A Feedback Loop

Do not start with speculative edits. First create or identify a pass/fail loop that reproduces the user-visible symptom.

Try these in roughly this order:

- failing unit or integration test at the real bug seam
- CLI command with fixture input and asserted stdout/stderr/files
- HTTP or API script against the relevant service
- Playwright or browser automation for UI behavior
- replayed captured trace, payload, event log, or fixture
- throwaway harness around the smallest real code path
- stress loop for flaky or timing-dependent failures
- differential loop comparing old/new versions, configs, or inputs

Refine the loop until it is fast, sharp, and repeatable enough to guide the fix. If no useful loop is possible, write down what you tried in the task `research/` directory and ask the user for a captured artifact, environment access, or permission to add temporary instrumentation.

## Reproduce

Run the loop and confirm:

- it shows the same failure the user reported
- the failure is reproducible, or reproducible often enough for flaky behavior
- the symptom is captured concretely: error text, wrong output, timing, trace, or state diff

Do not fix a nearby failure and call it done.

## Hypothesize

Create 3 to 5 ranked, falsifiable hypotheses before testing fixes.

For each hypothesis, state the prediction:

- if this is the cause, which probe should change?
- if this is not the cause, what result should stay unchanged?

When the change is risky or the user may have domain knowledge, briefly show the ranked hypotheses before proceeding. Do not block indefinitely if the user is unavailable.

## Instrument

Probe one hypothesis at a time.

- Prefer debugger, REPL, targeted assertions, or narrow logs over broad logging.
- Tag temporary logs with a unique prefix such as `[DEBUG-<short-id>]`.
- For performance regressions, measure before fixing: timing harness, profiler, query plan, or comparable baseline.

Keep instrumentation temporary unless the task explicitly decides to keep it as production observability.

## Fix And Test

When a correct seam exists:

1. Turn the minimized reproduction into a failing regression test.
2. Watch it fail.
3. Apply the smallest fix that satisfies the hypothesis.
4. Watch the regression test pass.
5. Rerun the original feedback loop.

If no correct regression seam exists, document that as a finding. It may indicate an architectural gap that belongs in `design.md`, `research/`, or a follow-up task.

## Clean Up And Preserve Knowledge

Before reporting completion:

- rerun the original loop and confirm the symptom is gone
- rerun relevant tests/checks
- remove all temporary `[DEBUG-...]` logs and throwaway harnesses
- record the proven root cause in the task notes or final response
- update `.devflow/spec/` when the fix reveals a reusable rule, contract, or prevention mechanism
- use `devflow-break-loop` if the task involved repeated failed fixes or a broader prevention lesson

