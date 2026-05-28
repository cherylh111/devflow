# Hooks 和 Settings

Hooks/settings 是将平台连接到 DevFlow 的入口层。它们决定平台在什么事件运行哪些脚本、插件或扩展。

## Settings 职责

settings/config 文件通常注册：

- session-start hook：新会话开始或上下文重置时注入 DevFlow 概览。
- workflow-state hook：从 `.devflow/workflow.md` 解析 `[workflow-state:STATUS]` 块，并在每次用户输入时输出与当前任务 `status` 匹配的正文。它只负责解析；脚本不嵌入后备内容。
- sub-agent context hook：实现/检查/研究代理启动时注入任务上下文。
- shell/session bridge：让 shell 命令看到同一个 DevFlow 会话身份。
- 平台插件或扩展入口点。

常见文件：

| 平台 | settings/config |
| --- | --- |
| Claude Code | `.claude/settings.json` |
| Cursor | `.cursor/hooks.json` |
| Codex | `.codex/hooks.json`, `.codex/config.toml` |
| OpenCode | `.opencode/package.json`, `.opencode/plugins/*` |
| Kiro | `.kiro/hooks/` + platform config |
| Gemini CLI | `.gemini/settings.json` |
| Qoder | `.qoder/settings.json` |
| CodeBuddy | `.codebuddy/settings.json` |
| GitHub Copilot | `.github/copilot/hooks.json` |
| Factory Droid | `.factory/settings.json` |
| Pi Agent | `.pi/settings.json`, `.pi/extensions/devflow/` |

项目中是否存在这些文件，取决于用户运行过哪些 `devflow init --<platform>` 标志。

## Hook 脚本类型

| 脚本 | 用途 |
| --- | --- |
| `session-start.py` | 生成 session-start 上下文。 |
| `inject-workflow-state.py` | 解析 `.devflow/workflow.md` 中的 `[workflow-state:STATUS]` 块，并输出与当前任务状态匹配的正文。没有匹配块时退回到 `Refer to workflow.md for current step.`。 |
| `inject-subagent-context.py` | 向子代理注入 PRD、JSONL 上下文和相关 spec/research。 |
| `inject-shell-session-context.py` | 让 shell 命令继承 DevFlow 会话身份。 |

不是每个平台都有每种 hook。不要仅因为某个平台缺少 hook 就从另一个平台复制文件；先确认该平台是否支持对应事件。

## 本地更改场景

| 用户需求 | 编辑位置 |
| --- | --- |
| AI 在新会话中应看到更多/更少上下文 | 平台 `session-start` hook。 |
| 每回合提示策略需要变化 | `.devflow/workflow.md` 中的 `[workflow-state:STATUS]` 块。hook 会逐字解析 workflow.md，不需要编辑脚本。 |
| 子代理无法读取 PRD/spec | `inject-subagent-context` hook 或代理 prelude。 |
| shell 中 `task.py current` 没有活动任务 | shell/session bridge hook 或平台环境变量配置。 |
| 禁用某个自动注入 | settings/config 中对应的 hook 注册。 |

## 修改原则

1. **Settings 负责接线；hooks 定义行为**。如果只改 hook，平台可能永远不会调用它。如果只改 settings，行为可能不会变化。
2. **先确认平台事件名称**。不同平台对 SessionStart、UserPromptSubmit、AgentSpawn、shell 执行及类似事件使用不同名称。
3. **Hooks 读取本地 `.devflow/`，不是上游源码**。用户项目中的 `.devflow/scripts/` 和 `.devflow/workflow.md` 是默认目标。
4. **错误必须可见**。Hook 失败应告诉用户哪些内容没有注入，而不是静默让 AI 缺少上下文。

## 排查路径

如果用户说“AI 没有读取 DevFlow 状态”：

1. 检查平台 settings 是否注册了 hook。
2. 检查 hook 文件是否存在。
3. 手动运行 hook 依赖的 `.devflow/scripts/get_context.py` 或 `task.py current --source` 命令。
4. 检查 `.devflow/.runtime/sessions/` 中是否存在活动任务状态。
5. 检查平台 shell 是否传递会话身份。
