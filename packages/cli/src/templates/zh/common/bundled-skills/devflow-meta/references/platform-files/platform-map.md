# 平台文件地图

本页按平台列出用户项目中常见的 DevFlow 文件位置。实际项目中是否存在某个平台目录，取决于用户运行过哪些 `devflow init --<platform>` 命令。

## 矩阵

| 平台 | CLI 标志 | 主目录 | 技能目录 | 代理目录 | Hooks/extensions |
| --- | --- | --- | --- | --- | --- |
| Claude Code | `--claude` | `.claude/` | `.claude/skills/` | `.claude/agents/` | `.claude/hooks/` + `.claude/settings.json` |
| Cursor | `--cursor` | `.cursor/` | `.cursor/skills/` | `.cursor/agents/` | `.cursor/hooks.json` + `.cursor/hooks/` |
| OpenCode | `--opencode` | `.opencode/` | `.opencode/skills/` | `.opencode/agents/` | `.opencode/plugins/` |
| Codex | `--codex` | `.codex/` | `.agents/skills/` | `.codex/agents/` | `.codex/hooks/` + `.codex/hooks.json` |
| Kilo | `--kilo` | `.kilocode/` | `.kilocode/skills/` | Usually none | `.kilocode/workflows/` |
| Kiro | `--kiro` | `.kiro/` | `.kiro/skills/` | `.kiro/agents/` | `.kiro/hooks/` |
| Gemini CLI | `--gemini` | `.gemini/` | `.agents/skills/` | `.gemini/agents/` | `.gemini/settings.json` + `.gemini/hooks/` |
| Antigravity | `--antigravity` | `.agent/` | `.agent/skills/` | Usually none | `.agent/workflows/` |
| Windsurf | `--windsurf` | `.windsurf/` | `.windsurf/skills/` | Usually none | `.windsurf/workflows/` |
| Qoder | `--qoder` | `.qoder/` | `.qoder/skills/` | `.qoder/agents/` | `.qoder/hooks/` + `.qoder/settings.json` |
| CodeBuddy | `--codebuddy` | `.codebuddy/` | `.codebuddy/skills/` | `.codebuddy/agents/` | `.codebuddy/hooks/` + `.codebuddy/settings.json` |
| GitHub Copilot | `--copilot` | `.github/` | `.github/skills/` | `.github/agents/` | `.github/copilot/hooks/` + prompts |
| Factory Droid | `--droid` | `.factory/` | `.factory/skills/` | `.factory/droids/` | `.factory/hooks/` + settings |
| Pi Agent | `--pi` | `.pi/` | `.pi/skills/` | `.pi/agents/` | `.pi/extensions/devflow/` + `.pi/settings.json` |

## 能力分组

### DevFlow 子代理支持

这些平台通常有 `devflow-research`、`devflow-implement` 和 `devflow-check` 文件：

- Claude Code
- Cursor
- OpenCode
- Codex
- Kiro
- Gemini CLI
- Qoder
- CodeBuddy
- GitHub Copilot
- Factory Droid
- Pi Agent

更改实现/检查/研究行为时，先查找对应平台的代理文件。

### 主会话工作流平台

这些平台更多依赖 workflows/skills 来引导主会话：

- Kilo
- Antigravity
- Windsurf

更改行为时，先检查 workflows 和 skills。不要假设 DevFlow 子代理一定存在。

### Shared `.agents/skills/`

Codex 会写入共享 `.agents/skills/` 层。一些支持 agentskills.io 的工具也能读取此目录。如果用户希望多个兼容工具共享一个技能，优先考虑 `.agents/skills/`，但不要假设每个平台都会读取它。

## 修改平台文件时的决策规则

1. 用户指定平台：只修改该平台目录，除非共享 workflow/spec 文件也必须更改。
2. 用户说“所有平台都应这样”：逐个平台同步等价入口点；不要只修改一个目录。
3. 用户只说“我的 AI”：检查项目中实际存在的配置目录，并推断当前 AI 平台。
4. 用户想要项目规则：优先使用 `.devflow/spec/` 或项目本地技能。
5. 用户想要 DevFlow 行为：编辑 `.devflow/workflow.md` 以及平台 hooks/agents/skills/commands。

## 路径不一致时

平台生态会变化，用户项目也可能已被定制。如果此表与本地文件不一致，以用户项目中的实际 settings/config 为准：

- 检查 settings 注册的 hook。
- 检查 command/prompt/workflow 指向的脚本。
- 根据代理文件中当前写明的读取规则判断行为。

不要仅因为某个自定义文件不在此路径表中就删除它。
