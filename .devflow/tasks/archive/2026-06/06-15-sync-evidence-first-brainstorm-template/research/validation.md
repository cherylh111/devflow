# Evidence-First Brainstorm Parity Validation

## Summary

The P0 finding from `06-13-research-skills-improvements` has already been resolved in the current repository state. No production template changes are required for this child task.

The archived report said the local dogfood brainstorm skill had the evidence-first rule while the shipped template lacked it. Current inspection shows active shipped templates, platform-specific generated templates, and local dogfood copies all include the same behavior.

## Active Surfaces Checked

Repository search for brainstorm templates and local installed copies identified these active surfaces:

- `packages/cli/src/templates/common/skills/brainstorm.md`
- `packages/cli/src/templates/zh/common/skills/brainstorm.md`
- `packages/cli/src/templates/codex/skills/brainstorm/SKILL.md`
- `packages/cli/src/templates/zh/codex/skills/brainstorm/SKILL.md`
- `packages/cli/src/templates/copilot/prompts/brainstorm.prompt.md`
- `packages/cli/src/templates/zh/copilot/prompts/brainstorm.prompt.md`
- `.agents/skills/devflow-brainstorm/SKILL.md`
- `.claude/skills/devflow-brainstorm/SKILL.md`
- `.codebuddy/skills/devflow-brainstorm/SKILL.md`

## Behavior Checks

Each active surface contains all required evidence-first behaviors:

| File | Evidence heading | Inspect first | Do not confirm repo facts | Ask only intent/scope/risk |
| --- | --- | --- | --- | --- |
| `packages/cli/src/templates/common/skills/brainstorm.md` | yes | yes | yes | yes |
| `packages/cli/src/templates/zh/common/skills/brainstorm.md` | yes | yes | yes | yes |
| `packages/cli/src/templates/codex/skills/brainstorm/SKILL.md` | yes | yes | yes | yes |
| `packages/cli/src/templates/zh/codex/skills/brainstorm/SKILL.md` | yes | yes | yes | yes |
| `packages/cli/src/templates/copilot/prompts/brainstorm.prompt.md` | yes | yes | yes | yes |
| `packages/cli/src/templates/zh/copilot/prompts/brainstorm.prompt.md` | yes | yes | yes | yes |
| `.agents/skills/devflow-brainstorm/SKILL.md` | yes | yes | yes | yes |
| `.claude/skills/devflow-brainstorm/SKILL.md` | yes | yes | yes | yes |
| `.codebuddy/skills/devflow-brainstorm/SKILL.md` | yes | yes | yes | yes |

## Commands Run

```powershell
rg --files packages/cli/src/templates .agents .claude .codebuddy | rg "(brainstorm|devflow-brainstorm)"
```

```powershell
rg -n "Non-Negotiable Evidence Rule|不可协商的证据规则" packages/cli/src/templates .agents .claude .codebuddy
```

```powershell
corepack pnpm --filter @enpd/devflow test test/configurators/platforms.test.ts test/configurators/index.test.ts
```

Result: `2` test files passed, `101` tests passed.

## Conclusion

No missing brainstorm evidence-rule surface was found. The task should close as a validation-only child task and note that the 06-13 research finding is stale against the current codebase.
