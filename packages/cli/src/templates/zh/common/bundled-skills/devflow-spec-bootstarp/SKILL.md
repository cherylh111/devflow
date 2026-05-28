---
name: devflow-spec-bootstarp
description: "用平台无关的单代理流程引导生成项目专属 DevFlow 编码规范。创建或刷新 .devflow/spec 指南、用 GitNexus、ABCoder 或源码检查分析代码库、拆分包/层级规范工作，以及编写有真实代码依据且无占位文本的规范文档时使用。"
---

# DevFlow 规范引导

使用此技能从真实代码库创建或刷新 `.devflow/spec/` 指南。一个有能力的代理负责完整闭环：分析仓库、选择规范边界、编写文档并验证结果。该流程不依赖特定宿主、CLI 或代理品牌。

## 工作流程

1. 确认 DevFlow 已初始化，并检查当前 `.devflow/spec/` 目录树。
2. 用可用的最佳工具分析仓库架构：GitNexus、ABCoder、语言工具以及直接读取源码。
3. 只有当包和层级确实反映真实代码库时，才按它们拆分规范工作。
4. 用项目中的具体模式、文件路径、示例和反模式填充或重塑规范文件。
5. 验证最终规范内部一致，且不包含模板占位文本。

## 参考路由

| 需求 | 阅读 |
|------|------|
| 仓库架构分析 | [references/repository-analysis.md](references/repository-analysis.md) |
| 规范工作拆分和任务规划 | [references/spec-task-planning.md](references/spec-task-planning.md) |
| 编写高信号 DevFlow 规范文件 | [references/spec-writing.md](references/spec-writing.md) |
| GitNexus 和 ABCoder MCP 设置 | [references/mcp-setup.md](references/mcp-setup.md) |

## 操作规则

- 将模板视为起点，而不是契约。仓库需要时，可以删除、重命名、拆分或新增规范文件。
- 优先使用有源码依据的规则，而不是通用建议。每条重要建议都应指向真实文件或重复出现的本地模式。
- 默认保持单一负责人执行。可选辅助代理只是实现细节，不是要求，也不是用户可见依赖。
- 除非目标项目已标准化使用某个平台，否则不要编写平台专属说明。
- 不要在 `.devflow/spec/` 中留下占位文本、空标题或复制来的样板内容。

## 完成标准

- `.devflow/spec/` 描述的是项目当前真实状态。
- 每个相关包或层级都有带真实示例的实用编码指南。
- 不适用的模板章节已移除。
- `index.md` 文件与最终规范文件集合一致。
- 任何必要设置或分析假设都记录在相关规范或任务说明中。
