# Skills、Commands、Prompts 和 Workflows

Skills 和 commands 是用户与 DevFlow 交互的文本入口点。不同平台名称不同，但核心目的相同：当用户表达某种意图时，告诉 AI 如何进入 DevFlow 流程。

## 概念差异

| 类型 | 触发方式 | 最适合 |
| --- | --- | --- |
| skill | AI 自动匹配或用户明确提及 | 长期能力、工作流规则、修改指南。 |
| command | 用户显式调用 | continue 和 finish-work 等清晰操作入口点。 |
| prompt | 用户显式调用或平台选择 | 类似 command，但使用平台提示格式。 |
| workflow | 用户显式选择或平台自动匹配 | 在没有子代理/hook 时引导主会话。 |

DevFlow 工作流技能通常共享一组语义：brainstorm、before-dev、check、update-spec、break-loop。`devflow-meta` 等多文件内置技能使用分层 references。

## 常见路径

| 平台 | 常见入口 |
| --- | --- |
| Claude Code | `.claude/skills/`, `.claude/commands/` |
| Cursor | `.cursor/skills/`, `.cursor/commands/` |
| OpenCode | `.opencode/skills/`, `.opencode/commands/` |
| Codex | `.agents/skills/`, `.codex/skills/` |
| Kilo | `.kilocode/skills/`, `.kilocode/workflows/` |
| Kiro | `.kiro/skills/` |
| Gemini CLI | `.agents/skills/`, `.gemini/commands/` |
| Antigravity | `.agent/skills/`, `.agent/workflows/` |
| Windsurf | `.windsurf/skills/`, `.windsurf/workflows/` |
| Qoder | `.qoder/skills/`, `.qoder/commands/` |
| CodeBuddy | `.codebuddy/skills/`, `.codebuddy/commands/` |
| GitHub Copilot | `.github/skills/`, `.github/prompts/` |
| Factory Droid | `.factory/skills/`, `.factory/commands/` |
| Pi Agent | `.pi/skills/` |

在用户项目中，以 init 实际生成的文件为准。

## Skill 结构

常见 skill 是一个目录：

```text
devflow-meta/
├── SKILL.md
└── references/
```

`SKILL.md` 应告诉 AI：

- 何时使用此 skill。
- 当前任务应先读取哪个 reference。
- 不要做什么。

References 保存较长说明，因此入口文件不必包含全部内容。

## Command/Prompt/Workflow 结构

Commands、prompts 和 workflows 通常是单文件。其内容应包括：

- 何时使用。
- 要读取哪些 `.devflow/` 文件。
- 要运行哪些脚本。
- 完成后如何报告。

它们不应存储任务状态；任务状态属于 `.devflow/tasks/` 和 `.devflow/.runtime/`。

## 本地更改场景

| 用户需求 | 编辑位置 |
| --- | --- |
| 更改 AI 自动触发规则 | 对应 skill 的 frontmatter description。 |
| 更改用户命令行为 | 对应 command/prompt/workflow 文件。 |
| 添加项目本地 skill | 平台 skill 目录，或共享 `.agents/skills/`。 |
| 让多个平台共享同一能力 | 在各平台 skill 目录写等价 skills，或在支持的平台上使用 `.agents/skills/` 共享层。 |
| 更改 finish/continue 入口点 | 平台 commands/prompts/workflows。 |

## 修改原则

1. **入口文件保持简短；references 承载长内容**。这对 `devflow-meta` 这类多文件 skills 尤其重要。
2. **让触发描述具体**。描述太宽会误触发；太窄可能不触发。
3. **跨平台保持相同语义一致**。文件格式可以不同，但行为描述应匹配。
4. **把项目专属能力放进本地 skills**。不要把团队私有流程放进公开的 `devflow-meta`。

如果用户只是想让本地 AI 多知道一条项目规则，通常应创建项目本地 skill 或更新 `.devflow/spec/`，而不是更改 DevFlow 内置工作流 skill。
