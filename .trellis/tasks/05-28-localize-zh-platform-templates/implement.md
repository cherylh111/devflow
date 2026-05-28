# 实施计划：zh 模板汉化补齐

## 步骤

1. 加载实现前规范：运行 `trellis-before-dev`，读取 CLI/template 相关规范。
2. 列出目标文件：
   - `packages/cli/src/templates/zh/qoder`
   - `packages/cli/src/templates/zh/claude`
   - `packages/cli/src/templates/zh/codebuddy`
   - `packages/cli/src/templates/zh/codex`
   - `packages/cli/src/templates/zh/common`
   - `packages/cli/src/templates/zh/devflow`
3. 扫描乱码和残留英文，按目录分批处理。
4. 对照英文源模板翻译：
   - 先处理四个平台 agent/skill 模板。
   - 再处理 `common` 公共 commands/skills/bundled-skills。
   - 最后处理 `devflow/workflow.md`，重点保护 workflow-state 标签和状态块。
5. 运行验证：
   - 搜索目标目录中的明显乱码字符片段。
   - 搜索目标目录中的大段残留英文说明。
   - 运行相关模板/本地化测试。
   - 运行 TypeScript 类型检查或项目既有快速检查（如可用）。

## 风险点

- `workflow.md` 同时是用户文档和 hook 解析来源，翻译时必须保留标签和块边界。
- Codex agent TOML 多行字符串不能破坏引号结构。
- YAML frontmatter 中工具列表和 key 不能翻译。
- 部分英文标识应保留，例如 `Task`, `Read`, `Write`, `Bash`, `Active task`, `workflow-state`。

## 验证命令候选

```bash
rg -n "浣|瀹|鈥|鐨|涓|鏂|锛|銆" packages/cli/src/templates/zh/qoder packages/cli/src/templates/zh/claude packages/cli/src/templates/zh/codebuddy packages/cli/src/templates/zh/codex packages/cli/src/templates/zh/common packages/cli/src/templates/zh/devflow
rg -n "[A-Za-z]{4,}" packages/cli/src/templates/zh/qoder packages/cli/src/templates/zh/claude packages/cli/src/templates/zh/codebuddy packages/cli/src/templates/zh/codex packages/cli/src/templates/zh/common packages/cli/src/templates/zh/devflow
npm test -- --run packages/cli/test/templates
```

英文搜索会出现路径、命令、工具名、代码块和协议标识，需要人工判断是否为合理保留。
