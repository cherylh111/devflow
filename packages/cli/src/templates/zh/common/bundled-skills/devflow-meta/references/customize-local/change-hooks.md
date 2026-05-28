# 更改本地 Hooks

Hooks 是将平台连接到 DevFlow 的自动化层。当用户想更改“何时注入上下文”“shell 命令如何继承会话”或“代理启动前读取哪些文件”时，hooks 通常是编辑点。

## 先读取这些文件

1. 目标平台 settings/config，例如 `.claude/settings.json`、`.codex/hooks.json`、`.cursor/hooks.json`
2. 目标平台 hooks 目录
3. `.devflow/scripts/common/active_task.py`
4. `.devflow/scripts/common/session_context.py`
5. `.devflow/workflow.md`

## 常见 Hook 类型

| Hook | 用途 |
| --- | --- |
| session-start | 会话开始、清空或压缩时注入 DevFlow 概览。 |
| workflow-state | 在每次用户输入时注入状态提示。 |
| sub-agent context | 代理启动前注入 PRD/spec/research。 |
| shell session bridge | 让 shell 中的 `task.py` 命令看到同一会话身份。 |

## 修改步骤

1. 在 settings/config 中找到 hook 注册。
2. 确认注册的脚本路径存在。
3. 阅读 hook 脚本，并识别输入、输出和调用的 `.devflow/scripts/`。
4. 修改 hook 行为。
5. 如果 hook 依赖工作流内容，同步 `.devflow/workflow.md`。

## 示例：更改新会话注入内容

先找到 session-start hook：

```text
.claude/settings.json
.claude/hooks/session-start.py
```

如果 hook 最终调用 `.devflow/scripts/get_context.py` 或 `session_context.py`，编辑本地脚本通常比在 hook 中硬编码内容更稳妥。

## 示例：Agent 未读取 JSONL

先确认：

```bash
python3 ./.devflow/scripts/task.py current --source
python3 ./.devflow/scripts/task.py validate <task>
```

如果任务和 JSONL 正确，判断平台使用 hook push 还是 agent pull。对于 hook push，编辑 `inject-subagent-context`；对于 agent pull，编辑 agent 文件。

## 说明

- Settings 负责注册，hook 脚本负责行为；两者要一起检查。
- 不同平台支持不同 hook 事件。不要直接复制另一个平台的 settings。
- Hooks 应读取项目本地 `.devflow/`；不应依赖 DevFlow 上游源码路径。
- Hook 失败应产生可见错误，避免 AI 静默丢失上下文。
