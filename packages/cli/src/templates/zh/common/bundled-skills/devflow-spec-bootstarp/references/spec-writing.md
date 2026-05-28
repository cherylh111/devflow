# 规范编写

DevFlow 规范是给未来代理使用的编码指南。它们应说明如何在此仓库中工作，而不是泛泛说明一个通用项目可能如何组织。

## 基于证据编写

每条重要规则都应由以下至少一项支撑：

- 展示首选模式的源码文件。
- 说明预期行为的测试文件。
- 定义约定的项目文档。
- 多个文件中重复出现的模式。

只有当短片段能让规则更清楚时才使用它们。优先链接文件路径，并指出符号或行为名称。

## 文件结构

保持规范目录树与项目一致：

- 保留 `index.md` 作为规范目录的导航文件。
- 当开发者会独立查找某些主题时，将它们拆分。
- 当分文件会重复同一规则时，将主题合并。
- 删除不适用的模板文件。
- 为模板遗漏的重要本地模式新增文件。

## 内容标准

好的规范章节包括：

- 规则适用的场景。
- 应遵循的本地模式。
- 证明该模式的源码或测试文件。
- 常见错误或反模式。
- 具体且可靠的验证命令或检查项。

避免：

- 占位式文字。
- 通用框架建议。
- 只在某个代理宿主中有效的工具说明。
- 长篇复制的代码块。
- 基于单个偶然实现细节的规则。

## 示例形态

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

还要检查链接、索引文件，以及是否仍有规范描述的是模板而不是此仓库。
