# DevFlow Knowledge Digest Issue Recursion Fix

## Problem

`devflow wiki digest <topic> --create-issues` writes generated follow-up entries
under `.devflow/spec/wiki/issue/**` with `type="issue"`,
`category="knowledge-gap"`, and `source="wiki-digest"`. A later digest scan was
able to treat those generated issues as normal knowledge input, which allowed the
digest to create second-generation issues about the generated issue entries.

## Fix

Digest input now excludes only DevFlow-generated knowledge-gap issue entries:

- `doc.type === "spec-entry"`
- `doc.entryType === "issue"`
- `doc.category === "knowledge-gap"`
- `doc.source === "wiki-digest"`

This preserves normal user-authored issue entries while preventing the digest
from feeding on its own generated follow-up work.

## Regression

The unit regression creates digest issues, rescans the knowledge store, creates a
second digest from the rescanned documents, and verifies no recursive issue
entries are created. The compiled CLI smoke also runs:

```powershell
devflow wiki digest auth --create-issues --json
devflow wiki digest auth --create-issues --json
devflow wiki list --type spec-entry --category knowledge-gap --json
```

Expected behavior: first digest creates the current gap issues, second digest
creates zero and skips the same issue IDs.
