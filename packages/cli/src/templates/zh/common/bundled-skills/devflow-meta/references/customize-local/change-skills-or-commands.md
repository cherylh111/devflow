# 更改本地 Skills、Commands、Prompts 和 Workflows

当用户想更改 AI 入口点、自动触发规则或显式命令行为时，编辑本地平台目录中的 skills、commands、prompts 或 workflows。

## 先读取这些文件

1. `.devflow/workflow.md`
2. 目标平台 skill/command/prompt/workflow 目录
3. 相关 agent 或 hook 文件
4. 项目规则是否已存在于 `.devflow/spec/`

## 选择哪种入口类型

| 目标 | 建议 |
| --- | --- |
| AI 应自动知道某项能力 | 添加或修改 skill。 |
| 用户想用命令手动触发 | 添加或修改 command/prompt/workflow。 |
| 团队项目约定 | 优先使用 `.devflow/spec/` 或项目本地 skill。 |
| 更改 DevFlow 流程语义 | 同步 `.devflow/workflow.md`。 |

## 修改 Skill

Skill 通常是：

```text
<skill-name>/
├── SKILL.md
└── references/
```

`SKILL.md` 应保持简短，并负责触发/路由。长内容放在 `references/` 中，供 AI 按需读取。

frontmatter description 应说明何时使用该 skill。示例：

```yaml
description: "Use when customizing this project's deployment workflow and release checklist."
```

不要写“helpful project skill”这类模糊描述；它们可能错误触发。

## 修改 Command/Prompt/Workflow

显式入口点应说明：

- 用户如何触发它。
- 要读取哪些 `.devflow/` 文件。
- 要运行哪些脚本。
- 完成后如何报告。

如果命令只是重复工作流规则，优先让它引用/读取 `.devflow/workflow.md`，而不是维护第二份流程副本。

## 常见路径

| 平台 | 入口目录 |
| --- | --- |
| Claude Code | `.claude/skills/`, `.claude/commands/` |
| Cursor | `.cursor/skills/`, `.cursor/commands/` |
| OpenCode | `.opencode/skills/`, `.opencode/commands/` |
| Codex | `.agents/skills/`, `.codex/skills/` |
| GitHub Copilot | `.github/skills/`, `.github/prompts/` |
| Kilo / Antigravity / Windsurf | workflows + skills |

## 添加项目本地 Skill

如果用户想记录团队私有定制，创建项目本地 skill，例如：

```text
.claude/skills/project-devflow-local/
└── SKILL.md
```

对于多平台项目，在每个平台 skill 目录添加等价版本，或在支持共享层的平台上使用 `.agents/skills/`。

## 说明

- 不要把每个平台的语法混进同一个文件。
- 不要只更改一个平台入口点却声称支持所有平台。
- 不要把长期工程约定藏在命令里；把它们写入 `.devflow/spec/`。
