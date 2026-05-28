---
name: check-cross-layer
description: "实现后的多维代码验证：跨层数据流、代码复用分析、导入路径验证和同层一致性检查。识别遗漏更新点、类型不匹配和重复常量。当变更跨越 3+ 架构层、修改共享常量或配置、批量改文件后，或创建新工具函数时使用。"
---

# 跨层检查

检查你的变更是否覆盖所有维度。多数 bug 来自“没有想到这一点”，而不是技术能力不足。

> **注意**：这是**实现后**的安全网。理想情况下，应在写代码**之前**阅读 [Pre-Implementation Checklist](.devflow/spec/guides/pre-implementation-checklist.md)。

---

## 相关文档

| 文档 | 用途 | 时机 |
|----------|---------|--------|
| [Pre-Implementation Checklist](.devflow/spec/guides/pre-implementation-checklist.md) | 编码前问题清单 | **写代码前** |
| [Code Reuse Thinking Guide](.devflow/spec/guides/code-reuse-thinking-guide.md) | 模式识别 | 实现期间 |
| **`$check-cross-layer`**（本 skill） | 验证检查 | **实现后** |

---

## 执行步骤

### 1. 识别变更范围

```bash
git status
git diff --name-only
```

### 2. 选择适用的检查维度

根据变更类型，执行下面的相关检查：

---

## 维度 A：跨层数据流（涉及 3+ 层时必需）

**触发条件**：变更涉及 3 个或更多层。

| 层 | 常见位置 |
|-------|------------------|
| API/Routes | `routes/`, `api/`, `handlers/`, `controllers/` |
| Service/Business Logic | `services/`, `lib/`, `core/`, `domain/` |
| Database/Storage | `db/`, `models/`, `repositories/`, `schema/` |
| UI/Presentation | `components/`, `views/`, `templates/`, `pages/` |
| Utility | `utils/`, `helpers/`, `common/` |

**检查清单**：
- [ ] 读取流：Database -> Service -> API -> UI。
- [ ] 写入流：UI -> API -> Service -> Database。
- [ ] 类型/schema 是否在层间正确传递？
- [ ] 错误是否正确传播给调用方？
- [ ] 每一层是否处理了 loading/pending 状态？

**详细指南**：`.devflow/spec/guides/cross-layer-thinking-guide.md`

---

## 维度 B：代码复用（修改常量/config 时必需）

**触发条件**：
- 修改 UI 常量（label、icon、color）。
- 修改任何硬编码值。
- 在多个位置看到相似代码。
- 创建新的 utility/helper function。
- 刚刚跨文件完成批量修改。

**检查清单**：
- [ ] 先搜索：有多少位置定义了这个值？
  ```bash
  # 在源文件中搜索（按项目调整扩展名）
  grep -r "value-to-change" src/
  ```
- [ ] 如果 2+ 个位置定义同一个值 -> 是否应抽取为共享常量？
- [ ] 修改后，所有使用位置是否都已更新？
- [ ] 如果创建 utility：是否已经存在类似 utility？

**详细指南**：`.devflow/spec/guides/code-reuse-thinking-guide.md`

---

## 维度 B2：新的 Utility Functions

**触发条件**：准备创建新的 utility/helper function。

**检查清单**：
- [ ] 先搜索现有类似 utilities。
  ```bash
  grep -r "functionNamePattern" src/
  ```
- [ ] 如果已有类似工具，能否扩展它？
- [ ] 如果创建新工具，它是否位于正确位置（shared vs domain-specific）？

---

## 维度 B3：批量修改之后

**触发条件**：刚刚在多个文件中修改了相似模式。

**检查清单**：
- [ ] 是否检查了所有具有相似模式的文件？
  ```bash
  grep -r "patternYouChanged" src/
  ```
- [ ] 是否漏掉了也应更新的文件？
- [ ] 是否应抽象该模式，以防未来重复？

---

## 维度 C：Import/Dependency 路径（创建新文件时必需）

**触发条件**：创建新的源文件。

**检查清单**：
- [ ] 是否使用正确的 import 路径（相对 vs 绝对）？
- [ ] 是否没有循环依赖？
- [ ] 是否与项目模块组织一致？

---

## 维度 D：同层一致性

**触发条件**：
- 修改展示逻辑或格式化逻辑。
- 同一领域概念在多个位置使用。

**检查清单**：
- [ ] 搜索使用同一概念的其他位置。
  ```bash
  grep -r "ConceptName" src/
  ```
- [ ] 这些用法是否一致？
- [ ] 它们是否应共享配置/常量？

---

## 常见问题速查

| 问题 | 根因 | 预防 |
|-------|------------|------------|
| 改了一个地方，漏掉其他地方 | 没有搜索影响范围 | 修改前先 `grep` |
| 某层丢失数据 | 没有检查数据流 | 从源头追踪到目标 |
| 类型/schema 不匹配 | 跨层类型不一致 | 使用共享类型定义 |
| UI/output 不一致 | 同一概念分散在多处 | 抽取共享常量 |
| 已存在相似 utility | 创建前没有搜索 | 创建前先搜索 |
| 批量修复不完整 | 没验证所有出现位置 | 修复后再 grep |

---

## 输出

报告：
1. 你的变更涉及哪些维度。
2. 每个维度的检查结果。
3. 发现的问题和修复建议。
