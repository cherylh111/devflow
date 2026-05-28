# Agents

DevFlow agent 文件定义专门角色。用户项目中常见的 DevFlow agents 包括：

- `devflow-research`
- `devflow-implement`
- `devflow-check`

文件位置和格式因平台而异，但职责边界应保持一致。

## Agent 职责

| Agent | 职责 |
| --- | --- |
| `devflow-research` | 调查问题，并将发现写入当前任务的 `research/`。 |
| `devflow-implement` | 基于 `prd.md`、可选 `design.md` / `implement.md`、`implement.jsonl` 及相关 spec/research/knowledge 实现。 |
| `devflow-check` | 评审变更、修复发现的问题，并运行必要检查。 |

Agent 文件不应变成通用聊天提示。它们应定义输入来源、写入边界、是否可改代码，以及如何报告结果。

## 常见路径

| 平台 | Agent 路径 |
| --- | --- |
| Claude Code | `.claude/agents/devflow-*.md` |
| Cursor | `.cursor/agents/devflow-*.md` |
| OpenCode | `.opencode/agents/devflow-*.md` |
| Codex | `.codex/agents/devflow-*.toml` |
| Kiro | `.kiro/agents/devflow-*.json` |
| Gemini CLI | `.gemini/agents/devflow-*.md` |
| Qoder | `.qoder/agents/devflow-*.md` |
| CodeBuddy | `.codebuddy/agents/devflow-*.md` |
| Factory Droid | `.factory/droids/devflow-*.md` |
| Pi Agent | `.pi/agents/devflow-*.md` |

GitHub Copilot 的 agent/prompt 支持由 `.github/agents/`、`.github/prompts/` 和 `.github/skills/` 等目录组合提供；请检查用户项目中实际生成的文件。

Kilo、Antigravity 和 Windsurf 等主会话工作流平台可能没有 DevFlow 子代理文件。它们通常依靠 workflows/skills 引导主会话。

## 两种上下文加载模式

### hook push

平台 hook 会在代理启动前注入任务上下文。代理文件本身可以更专注于职责和边界。

常见于支持 agent hooks 的平台。

### agent pull

代理文件指示代理在启动后读取：

- `python3 ./.devflow/scripts/task.py current --source`
- `implement.jsonl` or `check.jsonl`
- spec/research files and knowledge entries referenced by JSONL
- current task `prd.md`
- `design.md` if present
- `implement.md` if present

此模式适合 hooks 无法可靠重写子代理提示的平台。

## 本地更改场景

| 用户需求 | 编辑位置 |
| --- | --- |
| 实现代理必须遵循额外限制 | 平台的 `devflow-implement` agent 文件。 |
| 检查代理必须运行项目特定命令 | `devflow-check` agent 文件，必要时还有 `.devflow/spec/`。 |
| 研究代理必须输出固定格式 | `devflow-research` agent 文件。 |
| Agent 无法读取任务上下文 | Agent prelude 或 `inject-subagent-context` hook。 |
| 添加项目专属代理 | 平台 agent 目录 + 相关 workflow/command/skill 入口点。 |

## 修改原则

1. **保持职责单一**。不要把研究、实现和检查职责混入同一个 agent。
2. **指定读取顺序**。Agents 必须知道先从活动任务开始，读取 jsonl/spec/knowledge 上下文，再读取 `prd.md`、存在时的 `design.md` 和存在时的 `implement.md`。
3. **指定写入边界**。研究通常只写 `research/`；实现可以写代码；检查可以修复问题。
4. **在多平台项目中保持语义同步**。如果用户同时配置了 Claude、Codex 和 Cursor，要判断对一个平台 agent 的更改是否也需要应用到其他平台。

## 不要默认编辑上游模板

本地 AI 应默认修改用户项目内的平台 agent 文件。只有当用户明确想把变更贡献回 DevFlow 时，才讨论上游模板源码。
