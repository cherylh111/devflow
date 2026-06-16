# UI Prototype Reference

Use a UI prototype when the unknown is layout, interaction, or visual comparison.

## Good Questions

- Which layout makes the primary workflow easiest to scan?
- Which interaction model best exposes the required state?
- Which variant handles empty, loading, and dense data states?
- Which visual hierarchy supports repeated operational use?

## Shape

Prefer one route or surface with switchable variants:

1. Keep prototype code outside production paths, or mark it clearly as throwaway.
2. Build two to four meaningfully different variants.
3. Switch variants with a route segment, search param, tab, or simple local control.
4. Use realistic domain data instead of generic filler.
5. Render key states: empty, populated, error, loading, and dense where relevant.

## Command

Use the app's existing development command:

```bash
pnpm dev
pnpm --filter <package> dev
```

If the project has no app server, make the prototype runnable with a single local command and document it in the findings.

## What To Avoid

- Do not polish visual details that are unrelated to the decision.
- Do not wire real writes unless data mutation is the question.
- Do not bury variants in separate branches that cannot be compared quickly.
- Do not promote the prototype component directly into production.

## Findings Checklist

Record the answer in `research/prototype-<slug>-findings.md`:

- question;
- variants compared;
- screenshots or concise observations;
- decision;
- cleanup status.
