/* global process */
/**
 * DevFlow Context Injection Plugin
 *
 * Injects context when Task tool is called with supported subagent types.
 * Uses OpenCode's tool.execute.before hook.
 */

import { existsSync, readdirSync } from "fs"
import { join } from "path"
import { DevFlowContext, debugLog } from "../lib/devflow-context.js"

// Supported subagent types
const AGENTS_ALL = ["implement", "check", "research"]
const AGENTS_REQUIRE_TASK = ["implement", "check"]

// Match `Active task: <path>` on the first non-empty line of the dispatch
// prompt. Mirrors the contract in workflow.md's [workflow-state:in_progress]
// breadcrumb so multi-window users can disambiguate which task is targeted.
const ACTIVE_TASK_HINT_RE = /^\s*Active task:\s*(\S+)\s*$/m

function normalizeLanguage(value) {
  const normalized = String(value || "").trim().toLowerCase()
  if (!normalized) return null
  return ["zh", "cn", "zh-cn", "chinese", "han"].includes(normalized) ? "zh" : "en"
}

function readLanguage(ctx) {
  const envLang = normalizeLanguage(process.env.DEVFLOW_LANG)
  if (envLang) return envLang

  const config = ctx.readProjectFile(".devflow/config.yaml")
  const lang = config?.match(/^\s*language\s*:\s*['"]?([^'"\s#]+)/m)?.[1]
  return normalizeLanguage(lang) || "en"
}

function isZh(ctx) {
  return readLanguage(ctx) === "zh"
}

function tr(ctx, en, zh) {
  return isZh(ctx) ? zh : en
}

function extractActiveTaskHint(prompt) {
  if (typeof prompt !== "string" || !prompt) return null
  const match = prompt.match(ACTIVE_TASK_HINT_RE)
  return match ? match[1].trim() : null
}

/**
 * Get context for implement agent. `taskDir` may be relative
 * (`.devflow/tasks/foo`) or absolute; both are resolved via
 * `ctx.resolveTaskDir`.
 */
function getImplementContext(ctx, taskDir) {
  const parts = []
  const taskDirFull = ctx.resolveTaskDir(taskDir)
  if (!taskDirFull) return ""

  const jsonlPath = join(taskDirFull, "implement.jsonl")
  const entries = ctx.readJsonlWithFiles(jsonlPath)
  if (entries.length > 0) {
    parts.push(ctx.buildContextFromEntries(entries))
  }

  const prd = ctx.readFile(join(taskDirFull, "prd.md"))
  if (prd) {
    parts.push(`=== ${taskDir}/prd.md (${tr(ctx, "Requirements", "需求")}) ===\n${prd}`)
  }

  const design = ctx.readFile(join(taskDirFull, "design.md"))
  if (design) {
    parts.push(`=== ${taskDir}/design.md (${tr(ctx, "Technical Design", "技术设计")}) ===\n${design}`)
  }

  const implementPlan = ctx.readFile(join(taskDirFull, "implement.md"))
  if (implementPlan) {
    parts.push(`=== ${taskDir}/implement.md (${tr(ctx, "Execution Plan", "执行计划")}) ===\n${implementPlan}`)
  }

  return parts.join("\n\n")
}

/**
 * Get context for check agent. `taskDir` may be relative or absolute.
 */
function getCheckContext(ctx, taskDir) {
  const parts = []
  const taskDirFull = ctx.resolveTaskDir(taskDir)
  if (!taskDirFull) return ""

  const jsonlPath = join(taskDirFull, "check.jsonl")
  const entries = ctx.readJsonlWithFiles(jsonlPath)
  if (entries.length > 0) {
    parts.push(ctx.buildContextFromEntries(entries))
  }

  const prd = ctx.readFile(join(taskDirFull, "prd.md"))
  if (prd) {
    parts.push(`=== ${taskDir}/prd.md (${tr(ctx, "Requirements", "需求")}) ===\n${prd}`)
  }

  const design = ctx.readFile(join(taskDirFull, "design.md"))
  if (design) {
    parts.push(`=== ${taskDir}/design.md (${tr(ctx, "Technical Design", "技术设计")}) ===\n${design}`)
  }

  const implementPlan = ctx.readFile(join(taskDirFull, "implement.md"))
  if (implementPlan) {
    parts.push(`=== ${taskDir}/implement.md (${tr(ctx, "Execution Plan", "执行计划")}) ===\n${implementPlan}`)
  }

  return parts.join("\n\n")
}

/**
 * Get context for finish phase (final check before PR)
 */
function getFinishContext(ctx, taskDir) {
  // Finish reuses check context (same JSONL source)
  return getCheckContext(ctx, taskDir)
}


/**
 * Get context for research agent
 */
function getResearchContext(ctx) {
  const parts = []

  // Dynamic project structure (scan actual spec directory)
  const specPath = ".devflow/spec"
  const specFull = join(ctx.directory, specPath)

  const structureTitle = tr(ctx, "Project Spec Directory Structure", "项目 Spec 目录结构")
  const structureLines = [`## ${structureTitle}\n\n\`\`\`\n${specPath}/`]
  if (existsSync(specFull)) {
    try {
      const entries = readdirSync(specFull, { withFileTypes: true })
        .filter(d => d.isDirectory() && !d.name.startsWith("."))
        .sort((a, b) => a.name.localeCompare(b.name))

      for (const entry of entries) {
        const entryPath = join(specFull, entry.name)
        if (existsSync(join(entryPath, "index.md"))) {
          structureLines.push(`├── ${entry.name}/`)
        } else {
          try {
            const nested = readdirSync(entryPath, { withFileTypes: true })
              .filter(d => d.isDirectory() && existsSync(join(entryPath, d.name, "index.md")))
              .sort((a, b) => a.name.localeCompare(b.name))
            if (nested.length > 0) {
              structureLines.push(`├── ${entry.name}/`)
              for (const n of nested) {
                structureLines.push(`│   ├── ${n.name}/`)
              }
            }
          } catch {
            // Ignore nested read errors
          }
        }
      }
    } catch {
      // Ignore read errors
    }
  }
  structureLines.push("```")

  const tips = isZh(ctx)
    ? `

## 搜索提示

- Spec 文件：\`.devflow/spec/**/*.md\`
- 已知问题：\`.devflow/big-question/\`
- 代码搜索：使用 Glob 和 Grep 工具
- 技术方案：使用 mcp__exa__web_search_exa 或 mcp__exa__get_code_context_exa`
    : `

## Search Tips

- Spec files: \`.devflow/spec/**/*.md\`
- Known issues: \`.devflow/big-question/\`
- Code search: Use Glob and Grep tools
- Tech solutions: Use mcp__exa__web_search_exa or mcp__exa__get_code_context_exa`

  parts.push(structureLines.join("\n") + tips)

  return parts.join("\n\n")
}

/**
 * Build enhanced prompt with context
 */
function buildPrompt(ctx, agentType, originalPrompt, context, isFinish = false) {
  if (isZh(ctx)) {
    const templates = {
      implement: `<!-- devflow-hook-injected -->
# Implement Agent 任务

你是 Multi-Agent Pipeline 中的 Implement Agent。

## 你的上下文

${context}

---

## 你的任务

${originalPrompt}

---

## 工作流

1. **理解 specs** - 上方已经注入所有开发 specs
2. **理解任务 artifacts** - 阅读需求、存在时的技术设计和执行计划
3. **实现功能** - 按 specs 和任务 artifacts 实现
4. **自检** - 确认代码质量

## 重要约束

- 不要执行 git commit
- 遵循上方注入的所有开发 specs
- 完成后报告修改/创建的文件列表`,

      check: isFinish ? `<!-- devflow-hook-injected -->
# Finish Agent 任务

你正在创建 PR 前执行最终检查。

## 你的上下文

${context}

---

## 你的任务

${originalPrompt}

---

## 工作流

1. **审查变更** - 运行 \`git diff --name-only\` 查看所有变更文件
2. **验证任务 artifacts** - 检查 prd.md，以及存在时的 design.md / implement.md
3. **同步 spec** - 分析变更是否引入新模式、契约或约定
   - 如果发现新模式/约定：读取目标 spec 文件 -> 更新它 -> 必要时更新 index.md
   - 如果是基础设施/跨层变更：遵循 update-spec.md 中的 7 节强制模板
   - 如果只是纯代码修复且没有新模式：跳过此步骤
4. **运行最终检查** - 执行 lint 和 typecheck
5. **确认就绪** - 确认代码已准备好创建 PR

## 重要约束

- 发现 spec 缺口时可以更新 spec 文件（以 update-spec.md 为指南）
- 编辑前必须先读取目标 spec 文件（避免重复已有内容）
- 不要为琐碎变更更新 specs（错别字、格式、显然的修复）
- 如果发现严重代码问题，清晰报告（修 specs，不修代码）
- 验证 prd.md 中所有验收标准均已满足
- 存在 design.md 和 implement.md 时，验证其中约束` :
        `<!-- devflow-hook-injected -->
# Check Agent 任务

你是 Multi-Agent Pipeline 中的 Check Agent。

## 你的上下文

${context}

---

## 你的任务

${originalPrompt}

---

## 工作流

1. **获取变更** - 运行 \`git diff --name-only\` 和 \`git diff\`
2. **对照 specs 检查** - 逐项检查
3. **自行修复** - 直接修复问题，不要只报告
4. **运行验证** - 运行 lint 和 typecheck

## 重要约束

- 自行修复问题，不要只报告
- 必须执行完整检查清单`,

      research: `<!-- devflow-hook-injected -->
# Research Agent 任务

你是 Multi-Agent Pipeline 中的 Research Agent。

## 核心原则

**你只做一件事：查找并解释信息。**

## 项目信息

${context}

---

## 你的任务

${originalPrompt}

---

## 工作流

1. **理解查询** - 判断搜索类型和范围
2. **规划搜索** - 列出搜索步骤
3. **执行搜索** - 并行运行多个搜索
4. **整理结果** - 输出结构化报告

## 严格边界

**只允许**：描述存在什么、在哪里、如何工作

**禁止**：建议改进、批评实现、修改文件`
    }

    return templates[agentType] || originalPrompt
  }

  const templates = {
    implement: `<!-- devflow-hook-injected -->
# Implement Agent Task

You are the Implement Agent in the Multi-Agent Pipeline.

## Your Context

${context}

---

## Your Task

${originalPrompt}

---

## Workflow

1. **Understand specs** - All dev specs are injected above
2. **Understand task artifacts** - Read requirements, technical design if present, and execution plan if present
3. **Implement feature** - Follow specs and task artifacts
4. **Self-check** - Ensure code quality

## Important Constraints

- Do NOT execute git commit
- Follow all dev specs injected above
- Report list of modified/created files when done`,

    check: isFinish ? `<!-- devflow-hook-injected -->
# Finish Agent Task

You are performing the final check before creating a PR.

## Your Context

${context}

---

## Your Task

${originalPrompt}

---

## Workflow

1. **Review changes** - Run \`git diff --name-only\` to see all changed files
2. **Verify task artifacts** - Check prd.md and, when present, design.md / implement.md
3. **Spec sync** - Analyze whether changes introduce new patterns, contracts, or conventions
   - If new pattern/convention found: read target spec file → update it → update index.md if needed
   - If infra/cross-layer change: follow the 7-section mandatory template from update-spec.md
   - If pure code fix with no new patterns: skip this step
4. **Run final checks** - Execute lint and typecheck
5. **Confirm ready** - Ensure code is ready for PR

## Important Constraints

- You MAY update spec files when gaps are detected (use update-spec.md as guide)
- MUST read the target spec file BEFORE editing (avoid duplicating existing content)
- Do NOT update specs for trivial changes (typos, formatting, obvious fixes)
- If critical CODE issues found, report them clearly (fix specs, not code)
- Verify all acceptance criteria in prd.md are met
- Verify design.md and implement.md constraints when those files are present` :
      `<!-- devflow-hook-injected -->
# Check Agent Task

You are the Check Agent in the Multi-Agent Pipeline.

## Your Context

${context}

---

## Your Task

${originalPrompt}

---

## Workflow

1. **Get changes** - Run \`git diff --name-only\` and \`git diff\`
2. **Check against specs** - Check item by item
3. **Self-fix** - Fix issues directly, don't just report
4. **Run verification** - Run lint and typecheck

## Important Constraints

- Fix issues yourself, don't just report
- Must execute complete checklist`,

    research: `<!-- devflow-hook-injected -->
# Research Agent Task

You are the Research Agent in the Multi-Agent Pipeline.

## Core Principle

**You do one thing: find and explain information.**

## Project Info

${context}

---

## Your Task

${originalPrompt}

---

## Workflow

1. **Understand query** - Determine search type and scope
2. **Plan search** - List search steps
3. **Execute search** - Run multiple searches in parallel
4. **Organize results** - Output structured report

## Strict Boundaries

**Only allowed**: Describe what exists, where it is, how it works

**Forbidden**: Suggest improvements, criticize implementation, modify files`
  }

  return templates[agentType] || originalPrompt
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`
}

function powershellQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

function envValue(env, key) {
  const value = env?.[key]
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function shellBasename(value) {
  return value.replace(/\\/g, "/").split("/").pop()?.toLowerCase() || ""
}

function isWindowsPosixShell(env = process.env) {
  if (envValue(env, "MSYSTEM")) return true
  if (envValue(env, "MINGW_PREFIX")) return true
  if (envValue(env, "OPENCODE_GIT_BASH_PATH")) return true

  const ostype = envValue(env, "OSTYPE")?.toLowerCase() || ""
  if (/(msys|mingw|cygwin)/.test(ostype)) return true

  const shell = shellBasename(envValue(env, "SHELL") || "")
  return /^(bash|sh|zsh)(\.exe)?$/.test(shell)
}

function buildDevFlowContextPrefix(contextKey, hostPlatform = process.platform, env = process.env) {
  if (hostPlatform === "win32" && !isWindowsPosixShell(env)) {
    return `$env:DEVFLOW_CONTEXT_ID = ${powershellQuote(contextKey)}; `
  }

  return `export DEVFLOW_CONTEXT_ID=${shellQuote(contextKey)}; `
}

function getBashCommandKey(args) {
  if (!args || typeof args !== "object") return null
  if (typeof args.command === "string") return "command"
  if (typeof args.cmd === "string") return "cmd"
  return null
}

function commandStartsWithDevFlowContext(command) {
  const firstCommand = command.trimStart().split(/[;&|]/, 1)[0].trimStart()
  return (
    /^DEVFLOW_CONTEXT_ID\s*=/.test(firstCommand) ||
    /^export\s+DEVFLOW_CONTEXT_ID\s*=/.test(firstCommand) ||
    /^env\s+(?:(?:-\S+|[A-Za-z_][A-Za-z0-9_]*=\S*)\s+)*DEVFLOW_CONTEXT_ID\s*=/.test(firstCommand) ||
    /^\$env:DEVFLOW_CONTEXT_ID\s*=/i.test(firstCommand)
  )
}

/**
 * OpenCode TUI may not expose OPENCODE_RUN_ID to Bash. The plugin hook still
 * receives session identity, so inject it into Bash commands before execution.
 */
function injectDevFlowContextIntoBash(ctx, input, output, hostPlatform, env) {
  const args = output?.args
  const commandKey = getBashCommandKey(args)
  if (!commandKey) return false

  const command = args[commandKey]
  if (!command.trim()) return false
  if (commandStartsWithDevFlowContext(command)) return false

  const contextKey = ctx.getContextKey(input)
  if (!contextKey) return false

  args[commandKey] = `${buildDevFlowContextPrefix(contextKey, hostPlatform, env)}${command}`
  return true
}

// OpenCode plugin factory: `export default async (input) => hooks`.
// OpenCode 1.2.x iterates every module export and invokes it as a function
// (packages/opencode/src/plugin/index.ts — `for ([_, fn] of Object.entries(mod)) await fn(input)`);
// the previous `{ id, server }` object shape failed with
// `TypeError: fn is not a function` in 1.2.x.
export default async ({ directory, platform: hostPlatform = process.platform, env = process.env }) => {
  const ctx = new DevFlowContext(directory)
  debugLog("inject", "Plugin loaded, directory:", directory)

  return {
      "tool.execute.before": async (input, output) => {
        try {
          if (process.env.DEVFLOW_HOOKS === "0" || process.env.DEVFLOW_DISABLE_HOOKS === "1") {
            return
          }
          debugLog("inject", "tool.execute.before called, tool:", input?.tool)

          const toolName = input?.tool?.toLowerCase()
          if (toolName === "bash") {
            if (injectDevFlowContextIntoBash(ctx, input, output, hostPlatform, env)) {
              debugLog("inject", "Injected DEVFLOW_CONTEXT_ID into Bash command")
            }
            return
          }

          if (toolName !== "task") {
            return
          }

          const args = output?.args
          if (!args) return

          const rawSubagentType = args.subagent_type
          // Strip "devflow-" prefix added by v0.5.0-beta.5 agent rename migration
          const subagentType = (rawSubagentType || "").replace(/^devflow-/, "")
          const originalPrompt = args.prompt || ""

          debugLog("inject", "Task tool called, subagent_type:", rawSubagentType)

          if (!AGENTS_ALL.includes(subagentType)) {
            debugLog("inject", "Skipping - unsupported subagent_type")
            return
          }

          // Resolve active task in this priority order (only later steps
          // run when earlier ones miss):
          //   1. Exact session runtime context lookup for input.sessionID
          //   2. `Active task: <path>` hint in the dispatch prompt
          //      (explicit per-dispatch override — beats single-session
          //      inference so multi-window users can disambiguate)
          //   3. Single-session fallback — only when exactly 1 session
          //      runtime file exists locally
          let taskDir = null
          let taskSource = null

          const contextKey = ctx.getContextKey(input)
          if (contextKey) {
            const context = ctx.readContext(contextKey)
            const exactRef = ctx.normalizeTaskRef(context?.current_task || "")
            if (exactRef) {
              taskDir = exactRef
              taskSource = `session:${contextKey}`
            }
          }

          if (!taskDir) {
            const hintRef = extractActiveTaskHint(originalPrompt)
            if (hintRef) {
              const hintNormalized = ctx.normalizeTaskRef(hintRef)
              if (hintNormalized) {
                const hintDir = ctx.resolveTaskDir(hintNormalized)
                if (hintDir && existsSync(hintDir)) {
                  taskDir = hintNormalized
                  taskSource = "prompt-hint"
                  debugLog("inject", "Resolved task from Active task: hint:", hintNormalized)
                }
              }
            }
          }

          if (!taskDir) {
            const fallback = ctx._resolveSingleSessionFallback()
            if (fallback?.taskPath) {
              const fallbackDir = ctx.resolveTaskDir(fallback.taskPath)
              if (fallbackDir && existsSync(fallbackDir)) {
                taskDir = fallback.taskPath
                taskSource = fallback.source
                debugLog("inject", "Resolved task via single-session fallback:", taskDir, "source:", taskSource)
              }
            }
          }

          // Agents requiring task directory
          if (AGENTS_REQUIRE_TASK.includes(subagentType)) {
            // subagentType is already stripped of "devflow-" prefix above
            if (!taskDir) {
              debugLog("inject", "Skipping - no current task")
              return
            }
            const taskDirFull = ctx.resolveTaskDir(taskDir)
            if (!taskDirFull || !existsSync(taskDirFull)) {
              debugLog("inject", "Skipping - task directory not found")
              return
            }
          }

          // Check for [finish] marker
          const isFinish = originalPrompt.toLowerCase().includes("[finish]")

          // Get context based on agent type
          let context = ""
          switch (subagentType) {
            case "implement":
              context = getImplementContext(ctx, taskDir)
              break
            case "check":
              context = isFinish
                ? getFinishContext(ctx, taskDir)
                : getCheckContext(ctx, taskDir)
              break
            case "research":
              context = getResearchContext(ctx, taskDir)
              break
          }

          if (!context) {
            debugLog("inject", "No context to inject")
            return
          }

          const newPrompt = buildPrompt(ctx, subagentType, originalPrompt, context, isFinish)

          // Mutate args in-place — whole-object replacement does NOT work for the task tool
          // because the runtime holds a local reference to the same args object.
          args.prompt = newPrompt

          debugLog("inject", "Injected context for", subagentType, "prompt length:", newPrompt.length)

        } catch (error) {
          debugLog("inject", "Error in tool.execute.before:", error.message, error.stack)
        }
      }
    }
}
