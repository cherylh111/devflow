# Module Depth Thinking Guide

> **Purpose**: Decide when a module should deepen, when to keep it small, and when abstraction is only adding noise.

---

## When To Use

Use this guide when a module feels:

- too thin to justify its own file
- too generic for the problem it solves
- split into wrappers that do not reduce complexity
- hard to change because the interface and implementation drifted apart

---

## Ask These Questions

### Interface Depth

- Does the public surface hide a real concept, or just rename the same steps?
- Is the interface smaller than the implementation, or larger than it needs to be?
- Would a caller understand the module by reading its name and exports alone?

### Implementation Depth

- Is the module doing real work, or only forwarding calls?
- Are parsing, validation, orchestration, and formatting mixed together?
- Would moving one block into a deeper helper make the top-level flow clearer?

### Abstraction Check

- Is this a shared concept, or a one-off helper dressed up as a utility?
- Would deleting the abstraction make the code clearer?
- Are you paying indirection cost without reducing repetition or risk?

---

## Warning Signs

- shallow wrappers that only rename parameters or call one other function
- over-general utilities that accept many optional flags for one use case
- leaky abstractions where callers must know internal details anyway
- files that export many helpers but own no clear concept
- logic duplicated across callers because the module never grew enough depth

---

## Signs A Deeper Module Helps

- one module owns a single concept end to end
- the module has a stable interface even as internals grow
- callers can use the module without knowing all the steps inside
- repeated patterns become easier to centralize after they prove themselves

---

## DevFlow-Specific Checks

- CLI commands: is this helper really reusable, or just hiding one command flow?
- template systems: does the module own one template concern, or a bundle of unrelated writes?
- task scripts: would a small script be clearer than more wrappers around the same command?
- shared helpers: does this belong with the owner of the data, or is it a convenience alias?

When in doubt, compare the module against [Code Reuse Thinking Guide](./code-reuse-thinking-guide.md) first. If the proposed abstraction mainly exists to remove a few lines, the deletion test probably says to keep it inline.

If the module also crosses data boundaries or owns payload shape, read [Cross-Layer Thinking Guide](./cross-layer-thinking-guide.md) too.

---

## Quick Checklist

- [ ] The module owns a clear concept
- [ ] The interface is smaller than the implementation burden it hides
- [ ] The abstraction removes meaningful complexity, not just lines
- [ ] The module is not a shallow wrapper around another API
- [ ] Reuse and cross-layer guides were consulted when relevant
