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
- property-based or fuzz loop when input space is large
- bisection harness to narrow down a regression range
- HITL (human-in-the-loop) script for UI flows requiring manual steps

### Iterate On The Loop Itself

Before diving into hypothesis testing, optimize the loop for speed and signal:

- **Faster**: Can you reduce fixture size, mock slow dependencies, or run only the failing path?
- **Sharper**: Does the loop isolate one symptom, or does it conflate multiple failures?
- **More deterministic**: Can you eliminate timing races, random inputs, or environment variance?

A slow or noisy loop wastes debugging time. Spend minutes improving the loop to save hours on fixes.

### Non-Deterministic Bugs

For flaky, timing-dependent, or probabilistic failures:

1. **Raise the reproduction rate first** — stress loop, tight iteration, remove sleeps, inject timing probes.
2. **Measure the rate** — "fails 3/10 runs" is more actionable than "sometimes fails."
3. **Bisect the nondeterminism** — is it input-dependent, concurrency, external state, or true randomness?
4. **Stabilize or accept** — either determinize the test (mocks, seeds, synchronization) or document the rate and threshold.

Do not attempt a fix until the loop reproduces the failure reliably enough to verify the fix.

### Stop Condition: No Useful Loop

If after trying multiple loop strategies you cannot create a pass/fail reproduction:

**STOP. Do not proceed to speculative hypotheses.**

Instead:

1. Document what you tried in `research/no-loop-<date>.md`.
2. List what is blocking reproduction: missing environment, unavailable data, UI-only symptom with no automation, external dependency.
3. Ask the user for:
   - a captured artifact (log, trace, screenshot, recording)
   - environment access
   - permission to add production instrumentation
   - confirmation that the bug is deprioritized until reproducible

Do not guess at fixes when you cannot verify them.

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

