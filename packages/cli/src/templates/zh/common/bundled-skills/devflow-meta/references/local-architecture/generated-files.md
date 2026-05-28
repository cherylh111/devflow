# Init 后生成的本地文件

`devflow init` 会把 DevFlow 运行时写入用户项目。之后，`devflow update` 会尝试更新 DevFlow 管理的模板文件，但它会使用 `.devflow/.template-hashes.json` 判断哪些文件已被用户修改。

本页只描述用户项目内可见且可编辑的文件。

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

| 路径 | 通常可编辑？ | 说明 |
| --- | --- | --- |
| `.devflow/workflow.md` | 是 | 本地工作流文档和 AI 路由规则。 |
| `.devflow/config.yaml` | 是 | 项目配置、hooks、packages、日志行数限制和相关设置。 |
| `.devflow/spec/` | 是 | 项目规范，应由用户和 AI 定期更新。 |
| `.devflow/tasks/` | 是 | 任务材料和研究产物，由任务工作流维护。 |
| `.devflow/workspace/` | 是 | 会话记录，通常由 `add_session.py` 写入。 |
| `.devflow/scripts/` | 谨慎 | 本地运行时。可以定制，但必须先理解调用链。 |
| `.devflow/.runtime/` | 否 | 运行时状态，通常由 hooks/scripts 自动写入。 |
| `.devflow/.developer` | 谨慎 | 当前开发者身份。 |
| `.devflow/.version` | 否 | update/migration 逻辑使用的 DevFlow 版本记录。 |
| `.devflow/.template-hashes.json` | 否 | 模板哈希记录。不要在这里手写业务规则。 |

## 平台目录

不同平台会生成不同目录。常见类别：

| 类别 | 示例路径 | 用途 |
| --- | --- | --- |
| hooks | `.claude/hooks/`, `.codex/hooks/`, `.cursor/hooks/` | 注入会话上下文、workflow-state 和子代理上下文。 |
| settings | `.claude/settings.json`, `.codex/hooks.json`, `.qoder/settings.json` | 告诉平台何时运行 hooks 或插件。 |
| agents | `.claude/agents/`, `.codex/agents/`, `.kiro/agents/` | 定义 `devflow-research`、`devflow-implement` 和 `devflow-check` 等代理。 |
| skills | `.claude/skills/`, `.agents/skills/`, `.qoder/skills/` | 可自动触发或由 AI 阅读的技能。 |
| commands/prompts/workflows | `.cursor/commands/`, `.github/prompts/`, `.windsurf/workflows/` | 用户显式调用的命令或工作流入口。 |

修改平台目录时，也要确认 `.devflow/workflow.md` 是否仍描述同一流程。

## 模板哈希的含义

`.devflow/.template-hashes.json` 记录 DevFlow 上次写入模板文件时的内容哈希。`devflow update` 用它区分三种情况：

| 情况 | 更新行为 |
| --- | --- |
| 文件未被用户修改 | 可以自动更新。 |
| 文件已被用户修改 | 提示用户覆盖、保留或生成 `.new`。 |
| 文件不再是当前模板 | 可按迁移规则删除、重命名或保留。 |

当 AI 定制本地 DevFlow 文件时，不需要手动维护哈希。DevFlow update 将结果识别为“用户已修改”是正常的。

## 本地定制边界

默认可编辑：

- `.devflow/workflow.md`
- `.devflow/config.yaml`
- `.devflow/spec/**`
- `.devflow/scripts/**`
- Platform hooks, settings, agents, skills, commands, prompts, and workflows

默认不要编辑：

- 全局 npm 安装目录
- `node_modules/@enpd/devflow`
- DevFlow GitHub 仓库源码
- `.devflow/.runtime/**` 下的具体状态文件
- `.devflow/.template-hashes.json` 内的哈希内容

只有当用户明确要贡献上游时，才切换到 DevFlow CLI 源码视角。
