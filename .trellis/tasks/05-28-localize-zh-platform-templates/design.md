# 设计：zh 模板汉化补齐

## 边界

本任务只修改 `packages/cli/src/templates/zh` 下的目标模板内容。实现时以英文源模板作为语义参考，以现有 zh 模板作为结构参考。

目标目录：

- `qoder`
- `claude`
- `codebuddy`
- `codex`
- `common`
- `devflow`

## 方法

1. 对目标目录做扫描，识别明显乱码和残留英文说明。
2. 对照对应英文模板路径，确认文本原意。
3. 在 zh 模板中翻译人类可读说明，保留机器可读结构。
4. 对 Markdown/YAML frontmatter、TOML、YAML 配置和 workflow-state 标签做语法/结构检查。

## 兼容性约束

- 不重命名文件、目录、agent、skill 或命令。
- 不修改模板加载逻辑。
- 不修改 `workflow.md` 中标签名，例如 `[workflow-state:planning]`。
- 不翻译必须保持英文的协议字段，例如 `name`、`description` key、`sandbox_mode`、`developer_instructions`、工具名、环境变量、占位符。
- Markdown 中的代码块、命令示例、路径示例只翻译注释和解释文字，不改变命令本身。

## 取舍

公共目录文件较多，逐字翻译所有示例表格中的英文标识没有价值，也可能破坏可复制命令。验收以“人类说明可读中文、机器标识保留”为准。

历史 migration changelog 不纳入本任务，避免把一次模板汉化变成版本公告全量翻译。

## 回滚

所有变更集中在 zh 模板和当前 Trellis 任务产物中。若发现翻译破坏结构，可按文件对照英文源模板恢复对应段落，再重新翻译。
