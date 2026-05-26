import fs from "node:fs";
import path from "node:path";

import type { KnowledgeCleanupPlan } from "./cleanup.js";
import type { KnowledgeConnectResult } from "./connect.js";
import type {
  KnowledgeRelatedLinkApplyResult,
  KnowledgeRelatedLinkRemoveResult,
} from "./store.js";

export interface KnowledgeReportWriteResult {
  filePath: string;
  relativePath: string;
}

export function writeKnowledgeReport(
  cwd: string,
  reportPath: string,
  markdown: string,
): KnowledgeReportWriteResult {
  const filePath = path.isAbsolute(reportPath)
    ? reportPath
    : path.join(cwd, reportPath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, markdown, "utf-8");
  return {
    filePath,
    relativePath: path.relative(cwd, filePath).replace(/\\/g, "/"),
  };
}

export function defaultKnowledgeReportPath(
  taskName: string | undefined,
  kind: string,
  scope: string,
  generatedAt: string,
): string | undefined {
  if (!taskName) return undefined;
  const date = generatedAt.slice(0, 10);
  return `.devflow/tasks/${taskName}/research/${kind}-${slugify(scope)}-${date}.md`;
}

export function renderKnowledgeConnectReportMarkdown(input: {
  result: KnowledgeConnectResult;
  apply?: KnowledgeRelatedLinkApplyResult;
  generatedAt: string;
  scope?: string;
}): string {
  const { result, apply, generatedAt } = input;
  const scope = input.scope?.trim() ? input.scope.trim() : "all knowledge";
  const lines = [
    `# Knowledge Connection Report: ${scope}`,
    "",
    `**Generated:** ${generatedAt.slice(0, 10)} | **Suggestions:** ${result.suggestions.length} | **Health:** ${result.baseline.score}/100 -> ${result.projected.score}/100`,
    "",
    "## Suggestions",
    "",
  ];

  if (result.suggestions.length === 0) {
    lines.push("(no connection suggestions)");
  } else {
    lines.push("| Score | Source | Target | Reason |");
    lines.push("|-------|--------|--------|--------|");
    for (const suggestion of result.suggestions) {
      lines.push(
        `| ${suggestion.score.toFixed(3)} | ${escapeTable(suggestion.sourceId)} | ${escapeTable(suggestion.targetId)} | ${escapeTable(suggestion.reasons.join(" + "))} |`,
      );
    }
  }

  lines.push("");
  lines.push("## Apply Result", "");
  if (!apply) {
    lines.push("Dry run only. No files were changed.");
  } else {
    lines.push(`Applied: ${apply.applied.length}`);
    lines.push(`Skipped: ${apply.skipped.length}`);
    if (apply.skipped.length > 0) {
      lines.push("");
      lines.push("| Source | Target | Reason |");
      lines.push("|--------|--------|--------|");
      for (const skipped of apply.skipped) {
        lines.push(
          `| ${escapeTable(skipped.sourceId)} | ${escapeTable(skipped.targetId)} | ${escapeTable(skipped.reason)} |`,
        );
      }
    }
  }

  lines.push("");
  lines.push("## Graph Observations", "");
  lines.push(`- Baseline orphans: ${result.baseline.totals.orphans}`);
  lines.push(`- Baseline broken links: ${result.baseline.totals.brokenLinks}`);
  lines.push(`- Projected orphans: ${result.projected.totals.orphans}`);
  lines.push(`- Projected broken links: ${result.projected.totals.brokenLinks}`);
  lines.push("");

  return `${lines.join("\n").trimEnd()}\n`;
}

export function renderKnowledgeCleanupReportMarkdown(input: {
  plan: KnowledgeCleanupPlan;
  fix?: KnowledgeRelatedLinkRemoveResult;
  afterFix?: KnowledgeCleanupPlan;
  generatedAt: string;
  scope?: string;
}): string {
  const { plan, fix, afterFix, generatedAt } = input;
  const scope = input.scope?.trim() ? input.scope.trim() : "all knowledge";
  const finalPlan = afterFix ?? plan;
  const lines = [
    `# Knowledge Cleanup Report: ${scope}`,
    "",
    `**Generated:** ${generatedAt.slice(0, 10)} | **Issues:** ${plan.issues.length} -> ${finalPlan.issues.length} | **Health:** ${plan.baseline.score}/100 -> ${finalPlan.baseline.score}/100`,
    "",
    "## Issue Counts",
    "",
    "| Kind | Before | After |",
    "|------|--------|-------|",
  ];

  for (const kind of Object.keys(plan.counts) as (keyof KnowledgeCleanupPlan["counts"])[]) {
    lines.push(`| ${kind} | ${plan.counts[kind]} | ${finalPlan.counts[kind]} |`);
  }

  lines.push("");
  lines.push("## Issues", "");
  if (plan.issues.length === 0) {
    lines.push("(no cleanup issues)");
  } else {
    lines.push("| Kind | Entry | Target | Detail | Fixable |");
    lines.push("|------|-------|--------|--------|---------|");
    for (const issue of plan.issues) {
      lines.push(
        `| ${issue.kind} | ${escapeTable(issue.id)} | ${escapeTable(issue.target ?? "")} | ${escapeTable(issue.detail)} | ${issue.fixable ? "yes" : "no"} |`,
      );
    }
  }

  lines.push("");
  lines.push("## Fix Result", "");
  if (!fix) {
    lines.push("Dry run only. No files were changed.");
  } else {
    lines.push(`Removed: ${fix.removed.length}`);
    lines.push(`Skipped: ${fix.skipped.length}`);
    if (fix.skipped.length > 0) {
      lines.push("");
      lines.push("| Source | Target | Reason |");
      lines.push("|--------|--------|--------|");
      for (const skipped of fix.skipped) {
        lines.push(
          `| ${escapeTable(skipped.sourceId)} | ${escapeTable(skipped.target)} | ${escapeTable(skipped.reason)} |`,
        );
      }
    }
  }
  lines.push("");

  return `${lines.join("\n").trimEnd()}\n`;
}

export function slugifyReportPart(value: string): string {
  return slugify(value);
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, "\\|");
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "all"
  );
}
