# Local Files Generated After Init

`devflow init` writes the DevFlow runtime into the user project. Later, `devflow update` tries to update DevFlow-managed template files, but it uses `.devflow/.template-hashes.json` to determine which files have already been modified by the user.

This page only describes files that are visible and editable inside the user project.

## `.devflow/`

```text
.devflow/
├── workflow.md
├── config.yaml
├── .developer
├── .version
├── .template-hashes.json
├── .runtime/
├── scripts/
├── spec/
├── tasks/
└── workspace/
```

| Path | Usually editable? | Notes |
| --- | --- | --- |
| `.devflow/workflow.md` | Yes | Local workflow documentation and AI routing rules. |
| `.devflow/config.yaml` | Yes | Project configuration, hooks, packages, journal line limits, and related settings. |
| `.devflow/spec/` | Yes | Project specs, intended to be updated regularly by users and AI. |
| `.devflow/tasks/` | Yes | Task material and research artifacts, maintained by the task workflow. |
| `.devflow/workspace/` | Yes | Session records, usually written by `add_session.py`. |
| `.devflow/scripts/` | Carefully | Local runtime. It can be customized, but only after understanding the call chain. |
| `.devflow/.runtime/` | No | Runtime state, usually written automatically by hooks/scripts. |
| `.devflow/.developer` | Carefully | Current developer identity. |
| `.devflow/.version` | No | DevFlow version record used by update/migration logic. |
| `.devflow/.template-hashes.json` | No | Template hash record. Do not hand-write business rules here. |

## Platform Directories

Different platforms generate different directories. Common categories:

| Category | Example paths | Purpose |
| --- | --- | --- |
| hooks | `.claude/hooks/`, `.codex/hooks/`, `.cursor/hooks/` | Inject session context, workflow-state, and sub-agent context. |
| settings | `.claude/settings.json`, `.codex/hooks.json`, `.qoder/settings.json`, `.trae/hooks.json` | Tell the platform when to run hooks or plugins. |
| agents | `.claude/agents/`, `.codex/agents/`, `.kiro/agents/`, `.zcode/cli/agents/` | Define agents such as `devflow-research`, `devflow-implement`, and `devflow-check`. |
| skills | `.claude/skills/`, `.agents/skills/`, `.qoder/skills/` | Skills that auto-trigger or can be read by AI. |
| commands/prompts/workflows | `.cursor/commands/`, `.github/prompts/`, `.devin/workflows/`, `.zcode/commands/` | Explicit user-invoked command or workflow entry points. |

When modifying a platform directory, also confirm whether `.devflow/workflow.md` still describes the same flow.

## Meaning Of Template Hashes

`.devflow/.template-hashes.json` records the content hash from the last time DevFlow wrote a template file. `devflow update` uses it to distinguish three cases:

| Case | Update behavior |
| --- | --- |
| File was not modified by the user | It can be updated automatically. |
| File was modified by the user | Prompt the user to overwrite, keep, or generate `.new`. |
| File is no longer a current template | It may be deleted, renamed, or preserved according to migration rules. |

When an AI customizes local DevFlow files, it does not need to maintain hashes manually. It is normal for DevFlow update to recognize the result as "modified by the user."

## Local Customization Boundaries

Editable by default:

- `.devflow/workflow.md`
- `.devflow/config.yaml`
- `.devflow/spec/**`
- `.devflow/scripts/**`
- Platform hooks, settings, agents, skills, commands, prompts, and workflows

Do not edit by default:

- Global npm install directory
- `node_modules/@enpd/devflow`
- DevFlow GitHub repository source code
- Concrete state files under `.devflow/.runtime/**`
- Hash contents inside `.devflow/.template-hashes.json`

Switch to the DevFlow CLI source-code perspective only when the user explicitly wants to contribute upstream.
