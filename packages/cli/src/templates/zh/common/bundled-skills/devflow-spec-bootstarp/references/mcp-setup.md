# MCP 设置

引导 DevFlow 规范时推荐使用 GitNexus 和 ABCoder，因为它们能向代理暴露架构和 AST 上下文。它们是工具选择，不是平台要求。请通过你的代理宿主提供的 MCP 机制配置它们。

## GitNexus

GitNexus 会从仓库构建代码知识图谱。用它分析模块边界、执行流、依赖关系、影响范围和图查询。

### 安装和索引

```bash
# Run from the repository root.
npx gitnexus analyze

# Check index status.
npx gitnexus status

# Re-index after code changes when the analysis is stale.
npx gitnexus analyze
```

索引会写入 `.gitnexus/`。只有项目已经使用 embeddings 时才保留它们；否则普通索引足以用于规范引导。

### MCP 服务器命令

在宿主的 MCP 配置中使用此服务器命令：

```bash
npx -y gitnexus mcp
```

### 常用工具

| 工具 | 用途 |
|------|---------|
| `gitnexus_query` | 按概念查找执行流和功能区域 |
| `gitnexus_context` | 检查某个符号的调用方、被调用方、引用和流程参与情况 |
| `gitnexus_impact` | 在修改符号前了解影响范围 |
| `gitnexus_detect_changes` | 完成前检查已变更符号和受影响流程 |
| `gitnexus_cypher` | 运行直接图查询 |
| `gitnexus_list_repos` | 列出已索引仓库 |

## ABCoder

ABCoder 将代码解析为 UniAST，并提供精确的包、文件和节点级结构。用它查看签名、类型形状、实现、依赖和反向引用。

### 安装

```bash
go install github.com/cloudwego/abcoder@latest
abcoder --help
```

### 解析仓库

```bash
abcoder parse /absolute/path/to/package \
  --lang typescript \
  --name package-name \
  --output ~/abcoder-asts
```

对于 monorepo，请使用稳定的 `--name` 解析每个包，以便任务笔记引用相同的仓库名称。

### MCP 服务器命令

在宿主的 MCP 配置中使用此服务器命令：

```bash
abcoder mcp ~/abcoder-asts
```

### 常用工具

| 工具 | 层级 | 用途 |
|------|-------|---------|
| `list_repos` | 1 | 列出已解析仓库 |
| `get_repo_structure` | 2 | 检查包和文件 |
| `get_package_structure` | 3 | 检查包内节点 |
| `get_file_structure` | 3 | 检查文件中的函数、类、类型和签名 |
| `get_ast_node` | 4 | 获取代码、依赖、引用和实现 |

## 验证

配置后，在代理宿主中确认两个 MCP 服务器都可见。然后在开始编写规范前，对每个服务器运行一次简单查询。

```bash
ls .gitnexus/meta.json
ls ~/abcoder-asts/*.json
```
