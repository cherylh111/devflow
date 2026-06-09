# 仓库分析

目标是在编写规则前发现项目的真实架构。不要从通用规范模板开始填空。先从代码开始，然后让规范结构跟随代码。

## 分析顺序

1. 阅读现有 `.devflow/spec/` 树，并标记哪些文件仍是模板、已经过时或已经是项目专属内容。
2. 检查包清单、构建脚本、workspace 配置和顶层文档，以识别包和运行时层。
3. 使用 GitNexus 分析执行流、模块集群、依赖枢纽和影响敏感区域。
4. 使用 ABCoder 或语言原生工具获取精确签名、类型、类边界和实现示例。
5. 在把任何发现写成规范规则前，直接阅读有代表性的源码和测试文件。

## 要捕获什么

| 区域 | 问题 |
|------|-----------|
| 包边界 | 每个包负责什么？哪些 import 跨越边界？ |
| 运行时层 | 哪些代码属于 CLI、backend、frontend、worker、shared library、test-only 或 tooling？ |
| 核心抽象 | 哪些类型、服务、store、命令、路由或 adapter 定义了系统形状？ |
| 数据流 | 用户输入从哪里进入，如何验证，状态持久化在哪里？ |
| 错误处理 | 失败如何表示、记录、暴露和测试？ |
| 配置 | 默认值、环境配置、生成文件和模板位于哪里？ |
| 测试 | 哪些测试风格是新工作的可信示例？ |

## GitNexus 用法

先广泛查询，再检查具体符号：

```text
gitnexus_query({query: "CLI command execution flow"})
gitnexus_query({query: "template generation and migration"})
gitnexus_context({name: "SymbolName"})
gitnexus_cypher({query: "MATCH (n)-[r]->(m) RETURN n.name, type(r), m.name LIMIT 30"})
```

使用 GitNexus 结果查找重要文件和流程。在检查相关源码文件之前，不要把图输出当作最终权威。

## ABCoder 用法

当规范需要精确代码形状时使用 ABCoder：

```text
list_repos()
get_repo_structure({repo_name: "package-name"})
get_file_structure({repo_name: "package-name", file_path: "src/example.ts"})
get_ast_node({repo_name: "package-name", node_ids: [{mod_path: "...", pkg_path: "...", name: "SymbolName"}]})
```

ABCoder 对记录构造函数模式、函数签名、类型契约和引用链最有价值。

## 分析笔记

分析时保留简短 notes。notes 应包括：

- 包或层级名称。
- 定义本地模式的文件。
- 规范应教授的规则。
- 在旧代码、注释、测试或迁移路径中发现的反模式。
- 应创建、删除、重命名或合并的规范文件。

