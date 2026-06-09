# 规范编写

DevFlow specs 是给未来代理使用的编码指南。它们应解释如何在这个仓库中工作，而不是描述通用项目可能如何组织。

## 基于证据编写

每条重要规则都应由以下之一支撑：

- 展示推荐模式的源码文件。
- 展示期望行为的测试文件。
- 定义约定的项目文档。
- 在多个文件中重复出现的模式。

只有当短 snippet 能让规则更清晰时才使用它。优先链接到文件路径，并命名符号或行为。

## 文件结构

让 spec 树与项目保持一致：

- 保留 `index.md` 作为规范目录的导航文件。
- 当开发者会独立查找主题时拆分 topic。
- 当分开的文件会重复同一规则时合并 topic。
- 删除不适用的模板文件。
- 为模板遗漏的重要本地模式添加新文件。

## 内容标准

好的 spec section 包括：

- 规则适用时机。
- 要遵循的本地模式。
- 证明该模式的源码或测试文件。
- 常见错误或反模式。
- 当验证命令或检查具体且可靠时，写出它们。

避免：

- 占位 prose。
- 通用框架建议。
- 只能在一个代理宿主中工作的工具说明。
- 长篇复制代码块。
- 基于单个偶然实现细节的规则。

## 示例形状

```markdown
## Command Handlers

Command handlers should keep argument parsing, validation, and side effects separate. The local pattern is:

- Parse CLI flags at the command boundary.
- Convert raw inputs into typed task options before invoking core logic.
- Keep filesystem writes in the command or service layer, not in template helpers.

Reference files:
- `packages/cli/src/commands/example.ts`
- `packages/cli/test/commands/example.test.ts`

Avoid passing raw `process.argv` or unvalidated config objects into shared helpers.
```

## 最终检查

完成前：

```bash
grep -R "To be filled\\|TODO: fill\\|placeholder" .devflow/spec
```

还要检查链接、index 文件，以及是否仍有任何 spec 描述的是模板而不是这个仓库。

