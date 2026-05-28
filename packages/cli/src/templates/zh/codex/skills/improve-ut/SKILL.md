---
name: improve-ut
description: "分析已变更文件，并使用 .devflow/spec/ unit-test specs 中的项目测试约定改进单元测试覆盖。判断测试范围（unit vs integration vs regression），按现有模式新增或更新测试，并运行验证。用于代码变更需要测试覆盖、实现功能后、修复 bug 后，或识别出测试缺口时。"
---

# 改进单元测试（UT）

代码变更后，使用此 skill 改进测试覆盖。

## Usage

```text
$improve-ut
```

## 真相来源

动态发现并读取 unit-test specs：

```bash
# 发现可用 packages 及其 spec layers
python3 ./.devflow/scripts/get_context.py --mode packages
```

在输出中查找带有 `unit-test` spec layer 的 packages。对每个发现的 `unit-test/` 目录，读取其中所有相关 spec 文件（例如 `index.md`、`conventions.md`、`integration-patterns.md`、`mock-strategies.md`）。

> 如果此 skill 与 unit-test specs 冲突，以 specs 为准。

---

## 执行流程

1. 检查已变更文件：
   - `git diff --name-only`
2. 使用 unit-test specs 判断测试范围：
   - unit vs integration vs regression
   - mock vs real filesystem flow
3. 使用现有项目测试模式新增/更新测试
4. 运行验证：

```bash
pnpm lint
pnpm typecheck
pnpm test
```

5. 总结决策、更新和剩余测试缺口。

---

## 输出格式

```markdown
## UT Coverage Plan
- Changed areas: ...
- Test scope (unit/integration/regression): ...

## Test Updates
- Added: ...
- Updated: ...

## Validation
- pnpm lint: pass/fail
- pnpm typecheck: pass/fail
- pnpm test: pass/fail

## Gaps / Follow-ups
- <none or explicit rationale>
```
