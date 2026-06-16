# Logic Prototype Reference

Use a logic prototype when the unknown is behavior, not presentation.

## Good Questions

- Does this state machine allow impossible transitions?
- Which parser or normalization rule handles real inputs cleanly?
- Does a lifecycle rule stay understandable across edge cases?
- Which algorithm shape is simpler after walking through examples?

## Shape

Prefer the smallest runnable harness around the real idea:

1. Put the prototype outside production paths, or mark it clearly as throwaway.
2. Model only the state and transitions needed to answer the question.
3. Include a few hard-coded scenarios or a tiny interactive loop.
4. Print the full relevant state after each step.
5. Keep dependencies minimal and project-native.

## Command

Use an existing project runner when possible:

```bash
pnpm tsx path/to/prototype.ts
python path/to/prototype.py
node path/to/prototype.js
```

The command should be easy to rerun and easy to delete.

## What To Avoid

- Do not add production persistence unless persistence is the thing being tested.
- Do not hide state behind abstractions.
- Do not add broad test suites for throwaway code.
- Do not reuse the prototype implementation directly in Phase 2.

## Findings Checklist

Record the answer in `research/prototype-<slug>-findings.md`:

- question;
- scenarios exercised;
- state snapshots or key outputs;
- decision;
- cleanup status.
