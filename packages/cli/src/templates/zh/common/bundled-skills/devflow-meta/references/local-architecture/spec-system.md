# spec-system

本文档说明 DevFlow 本地架构、平台文件或自定义入口中的 `spec-system` 主题。

## 要点

- 以用户项目内的 `.devflow/` 和平台目录为准。
- 修改前先搜索相关模板、hook、agent、skill、command、prompt 和配置。
- 运行时文件和生成模板可能存在双路径，更新时必须确认 init 与 update 都能得到一致结果。
- 对团队约定或项目私有规则，优先写入 `.devflow/spec/` 或项目本地 skill。
