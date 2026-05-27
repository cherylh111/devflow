---
name: devflow-meta
description: "DevFlow 内置 skill：devflow-meta。用于理解、定制或引导项目内 DevFlow 工作流。"
---

# devflow-meta

此 skill 面向已经运行 `devflow init` 的项目。使用时先读取当前项目里的 `.devflow/`、平台目录和相关 reference 文件，实际本地文件优先于默认说明。

## 使用方式

1. 先读取本 skill 的 references 索引或相关主题。
2. 根据用户请求定位工作流、任务、spec、hook、agent、skill、command 或 prompt 的入口。
3. 修改前搜索同名平台镜像，保持跨平台模板一致。
4. 修改后运行相关验证，并说明剩余风险。

## 约束

- 不要假设用户拥有 DevFlow 源码仓库。
- 不要修改全局 npm 安装目录或 node_modules。
- 不要覆盖用户已经定制的本地文件。
