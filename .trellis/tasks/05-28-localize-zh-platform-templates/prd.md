# zh 模板汉化补齐

## 目标

补齐 `packages/cli/src/templates/zh` 下指定范围的中文本地化，让使用 `language: zh` 初始化或更新 DevFlow 的用户拿到可读、自然、结构正确的中文模板，而不是乱码或中英混排的说明。

本任务覆盖：

- `packages/cli/src/templates/zh/qoder`
- `packages/cli/src/templates/zh/claude`
- `packages/cli/src/templates/zh/codebuddy`
- `packages/cli/src/templates/zh/codex`
- `packages/cli/src/templates/zh/common`
- `packages/cli/src/templates/zh/devflow`

## 已确认事实

- 目标目录 `packages/cli/src/templates/zh` 已存在。
- Qoder、Claude Code、CodeBuddy、Codex 四个平台已有 zh 模板文件，但存在两类问题：
  - 中文文本被错误解码后形成乱码。
  - 人类可读说明仍有大量英文残留。
- 公共部分已由用户确认，主要指：
  - `packages/cli/src/templates/zh/common`
  - `packages/cli/src/templates/zh/devflow`
- `zh/common` 包含共享 commands、skills、bundled-skills 及其 reference 文档。
- `zh/devflow` 包含 `config.yaml`、`gitignore.txt`、`workflow.md`，其中 `workflow.md` 仍有大量英文工作流说明、状态块和注释。
- 近期已有相关提交尝试处理 zh 本地化，但当前工作区仍需要继续修复：
  - `c878d88 fix: localize zh templates`
  - `1611a1f fix: localize generated agent metadata`
  - `c69d2b7 fix: localize generated runtime templates`

## 需求

- 修复目标范围内所有明显乱码，恢复为可读中文。
- 翻译目标范围内面向 AI 或用户阅读的英文说明。
- 保留以下机器可读内容和稳定标识，不因汉化改变行为：
  - YAML frontmatter key、TOML key、JSON/YAML 配置 key。
  - 平台名称、agent/skill 名称、命令名、环境变量、占位符、文件路径、代码块、CLI 参数、工具名。
  - workflow-state 标签、HTML 注释标记、脚本调用格式。
- 保持模板语义不变：只做语言本地化，不改工作流阶段、平台注册、任务生命周期或脚本行为。
- 公共部分的汉化范围以 `zh/common` 和 `zh/devflow` 为准，不包括所有历史 migration changelog。

## 验收标准

- [ ] `zh/qoder` 下 agent 模板为可读中文，无明显乱码；除路径、命令、占位符、工具名和示例外，不保留大段英文说明。
- [ ] `zh/claude` 下 agent 模板为可读中文，无明显乱码；保留 Claude Code 所需 frontmatter 和工具声明。
- [ ] `zh/codebuddy` 下 agent 模板为可读中文，无明显乱码；保留 CodeBuddy 所需 frontmatter 和工具声明。
- [ ] `zh/codex` 下 agent TOML 与 skill 模板为可读中文，无明显乱码；TOML 结构和 Codex skill 元数据保持有效。
- [ ] `zh/common` 下 commands、skills、bundled-skills 和 reference 文档为可读中文，无明显乱码；公共说明语义与英文源模板一致。
- [ ] `zh/devflow` 下公共工作流模板为可读中文，无明显乱码；workflow-state 标签和状态块边界保持可解析。
- [ ] Markdown/YAML frontmatter/TOML 基本语法没有因汉化损坏。
- [ ] 相关模板或本地化测试通过；若某项检查无法运行，在结果中说明原因。

## 非目标

- 不翻译 `packages/cli/src/templates/zh` 中本次未点名的平台目录，例如 Copilot、Cursor、Droid、Gemini、Kiro、OpenCode、Pi、Markdown 规范模板等，除非它们被共享模板生成流程直接要求同步。
- 不翻译 `packages/cli/src/migrations/manifests/*.json` 中所有历史 changelog。
- 不改英文源模板。
- 不改变 DevFlow 工作流语义、平台行为、脚本逻辑或模板安装路径。

## 开放问题

无。当前范围已由用户确认。
