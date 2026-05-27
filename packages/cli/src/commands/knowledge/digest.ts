import fs from "node:fs";

import {
  buildKnowledgeGraph,
  bodyForKnowledgeGraphLinks,
  computeKnowledgeGraphHealth,
  isKnowledgeGraphNode,
} from "./graph.js";
import {
  defaultKnowledgeReportPath,
  slugifyReportPart,
  writeKnowledgeReport,
  type KnowledgeReportWriteResult,
} from "./reports.js";
import { searchDocuments, tokenize } from "./search.js";
import { scanKnowledge, type KnowledgeDocument } from "./store.js";
import { createKnowledgeEntry } from "./writer.js";

export interface KnowledgeDigestOptions {
  topic?: string;
  type?: string;
  recentDays?: number;
  format?: "brief" | "full";
  maxThemes?: number;
  now?: Date;
}

export interface KnowledgeDigestTheme {
  name: string;
  slug: string;
  summary: string;
  health: number;
  entries: KnowledgeDigestEntry[];
  keyEntries: KnowledgeDigestEntry[];
  typeDistribution: Record<string, number>;
  gaps: KnowledgeDigestGap[];
}

export interface KnowledgeDigestEntry {
  id: string;
  title: string;
  kind: string;
  category?: string;
  keywords: string[];
  relativePath: string;
  line: number;
  snippet?: string;
}

export interface KnowledgeDigestGap {
  theme: string;
  kind: "broken-link" | "orphan" | "missing-perspective" | "todo-marker";
  detail: string;
  suggestedAction: string;
}

export interface KnowledgeDigest {
  scope: string;
  generatedAt: string;
  entries: number;
  health: number;
  themes: KnowledgeDigestTheme[];
  heatmap: Record<string, Record<string, number>>;
  gaps: KnowledgeDigestGap[];
  unlinkedInsights: KnowledgeDigestEntry[];
  recommendedActions: string[];
}

export interface KnowledgeDigestIssueResult {
  created: {
    id: string;
    relativePath: string;
    gap: KnowledgeDigestGap;
  }[];
  skipped: {
    id: string;
    reason: string;
    gap: KnowledgeDigestGap;
  }[];
}

export type KnowledgeDigestWriteResult = KnowledgeReportWriteResult;

const DEFAULT_MAX_THEMES = 5;

export function createKnowledgeDigest(
  documents: readonly KnowledgeDocument[],
  options: KnowledgeDigestOptions = {},
): KnowledgeDigest {
  const now = options.now ?? new Date();
  const scopedDocs = scopeDocuments(documents, options, now).filter(isDigestNode);
  const graph = buildKnowledgeGraph(scopedDocs);
  const health = computeKnowledgeGraphHealth(graph, scopedDocs);
  const themes = buildThemes(scopedDocs, options, graph.backlinks);
  const gaps = themes.flatMap((theme) => theme.gaps);
  const unlinkedInsights = findUnlinkedInsights(scopedDocs, themes, graph.backlinks);
  const recommendedActions = recommendActions(gaps, unlinkedInsights, health.orphans.length);

  return {
    scope: scopeLabel(options),
    generatedAt: now.toISOString(),
    entries: scopedDocs.length,
    health: health.score,
    themes,
    heatmap: buildHeatmap(themes),
    gaps,
    unlinkedInsights,
    recommendedActions,
  };
}

export function renderKnowledgeDigestMarkdown(digest: KnowledgeDigest): string {
  const lines = [
    `# Knowledge Digest: ${digest.scope}`,
    "",
    `**Generated:** ${digest.generatedAt.slice(0, 10)} | **Entries:** ${digest.entries} | **Health:** ${digest.health}/100`,
    "",
    "## Themes",
    "",
  ];

  if (digest.themes.length === 0) {
    lines.push("(no knowledge entries matched this scope)", "");
  }

  digest.themes.forEach((theme, index) => {
    lines.push(`### ${index + 1}. ${theme.name} (${theme.entries.length} entries)`);
    lines.push(theme.summary);
    lines.push("");
    lines.push(`**Key entries:** ${theme.keyEntries.map((entry) => entry.id).join(", ") || "none"}`);
    lines.push(`**Health:** ${theme.health}/100`);
    lines.push("");
    if (theme.gaps.length > 0) {
      lines.push("**Gaps:**");
      for (const gap of theme.gaps) {
        lines.push(`- ${gap.detail}`);
      }
      lines.push("");
    }
    if (theme.entries.some((entry) => entry.snippet)) {
      lines.push("**Entry notes:**");
      for (const entry of theme.entries.filter((item) => item.snippet)) {
        lines.push(`- ${entry.id}: ${entry.snippet}`);
      }
      lines.push("");
    }
  });

  lines.push("## Coverage Heatmap", "");
  lines.push(renderHeatmapTable(digest));
  lines.push("");
  lines.push("## Knowledge Gaps", "");
  if (digest.gaps.length === 0) {
    lines.push("(no gaps detected)");
  } else {
    lines.push("| Gap | Theme | Suggested Action |");
    lines.push("|-----|-------|------------------|");
    for (const gap of digest.gaps) {
      lines.push(`| ${escapeTable(gap.detail)} | ${escapeTable(gap.theme)} | ${escapeTable(gap.suggestedAction)} |`);
    }
  }
  lines.push("");
  lines.push("## Unlinked Insights", "");
  if (digest.unlinkedInsights.length === 0) {
    lines.push("(none)");
  } else {
    for (const insight of digest.unlinkedInsights) {
      lines.push(`- ${insight.id}: ${insight.title}`);
    }
  }
  lines.push("");
  lines.push("## Recommended Actions", "");
  if (digest.recommendedActions.length === 0) {
    lines.push("1. No immediate action.");
  } else {
    digest.recommendedActions.forEach((action, index) => {
      lines.push(`${index + 1}. ${action}`);
    });
  }
  lines.push("");

  return `${lines.join("\n").trimEnd()}\n`;
}

export function writeKnowledgeDigestReport(
  cwd: string,
  digest: KnowledgeDigest,
  reportPath: string,
): KnowledgeDigestWriteResult {
  return writeKnowledgeReport(cwd, reportPath, renderKnowledgeDigestMarkdown(digest));
}

export function defaultDigestReportPath(taskName: string | undefined, digest: KnowledgeDigest): string | undefined {
  return defaultKnowledgeReportPath(
    taskName,
    "knowledge-digest",
    digest.scope,
    digest.generatedAt,
  );
}

export function createKnowledgeDigestIssues(
  cwd: string,
  digest: KnowledgeDigest,
): KnowledgeDigestIssueResult {
  const existingIds = new Set(
    scanKnowledge(cwd).documents.map((doc) => doc.id),
  );
  const result: KnowledgeDigestIssueResult = { created: [], skipped: [] };

  for (const gap of digest.gaps) {
    const slug = issueSlugForGap(gap);
    const id = `issue-${slug}`;
    if (existingIds.has(id)) {
      result.skipped.push({ id, reason: "issue already planned in this digest", gap });
      continue;
    }
    existingIds.add(id);
    try {
      const created = createKnowledgeEntry(cwd, {
        type: "issue",
        slug,
        title: `Knowledge gap: ${gap.theme} ${gap.kind}`,
        body: renderGapIssueBody(gap, digest),
        category: "knowledge-gap",
        keywords: ["knowledge-gap", gap.kind, slugifyReportPart(gap.theme)],
        source: "wiki-digest",
        status: "open",
        now: new Date(digest.generatedAt),
      });
      result.created.push({
        id: created.id,
        relativePath: created.relativePath,
        gap,
      });
    } catch (error) {
      result.skipped.push({
        id,
        reason: error instanceof Error ? error.message : String(error),
        gap,
      });
    }
  }

  return result;
}

function scopeDocuments(
  documents: readonly KnowledgeDocument[],
  options: KnowledgeDigestOptions,
  now: Date,
): KnowledgeDocument[] {
  let docs = documents.filter(isDigestNode);
  if (options.topic?.trim()) {
    const tokens = tokenize(options.topic);
    docs = searchDocuments(
      docs.filter((doc) => matchesTopic(doc, tokens)),
      options.topic,
      { limit: Number.MAX_SAFE_INTEGER },
    ).map((hit) => hit.document);
  }
  const type = options.type?.trim();
  if (type) {
    docs = docs.filter((doc) => matchesScope(doc, type));
  }
  if (options.recentDays !== undefined && Number.isFinite(options.recentDays)) {
    const cutoff = now.getTime() - Math.max(0, options.recentDays) * 24 * 60 * 60 * 1000;
    docs = docs.filter((doc) => docTimestamp(doc) >= cutoff);
  }
  return docs;
}

function issueSlugForGap(gap: KnowledgeDigestGap): string {
  return `knowledge-gap-${slugifyReportPart(gap.theme)}-${gap.kind}-${shortHash(gap.detail)}`;
}

function renderGapIssueBody(gap: KnowledgeDigestGap, digest: KnowledgeDigest): string {
  return [
    `Gap: ${gap.detail}`,
    "",
    `Theme: ${gap.theme}`,
    `Kind: ${gap.kind}`,
    `Digest scope: ${digest.scope}`,
    "",
    `Suggested action: ${gap.suggestedAction}`,
  ].join("\n");
}

function shortHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0").slice(0, 8);
}

function buildThemes(
  documents: readonly KnowledgeDocument[],
  options: KnowledgeDigestOptions,
  backlinks: Record<string, string[]>,
): KnowledgeDigestTheme[] {
  const grouped = new Map<string, KnowledgeDocument[]>();
  for (const doc of documents) {
    const key = themeKey(doc, options.topic);
    grouped.set(key, [...(grouped.get(key) ?? []), doc]);
  }

  const maxThemes = positiveInt(options.maxThemes, DEFAULT_MAX_THEMES);
  const groups = [...grouped.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .slice(0, maxThemes);

  const selectedKeys = new Set(groups.map(([key]) => key));
  const overflow = [...grouped.entries()]
    .filter(([key]) => !selectedKeys.has(key))
    .flatMap(([, docs]) => docs);
  if (overflow.length > 0) groups.push(["other", overflow]);

  return groups.map(([name, docs]) => buildTheme(name, docs, backlinks, options.format ?? "brief"));
}

function buildTheme(
  name: string,
  documents: readonly KnowledgeDocument[],
  backlinks: Record<string, string[]>,
  format: "brief" | "full",
): KnowledgeDigestTheme {
  const graph = buildKnowledgeGraph(documents);
  const health = computeKnowledgeGraphHealth(graph, documents);
  const entries = documents.map((doc) => digestEntry(doc, format));
  const keyEntries = entries
    .slice()
    .sort((a, b) => (backlinks[b.id]?.length ?? 0) - (backlinks[a.id]?.length ?? 0) || a.id.localeCompare(b.id))
    .slice(0, 5);
  const gaps = detectThemeGaps(name, documents, graph.brokenLinks, health.orphans);
  return {
    name: titleCase(name),
    slug: slugify(name),
    summary: summarizeTheme(name, documents),
    health: health.score,
    entries,
    keyEntries,
    typeDistribution: countBy(documents, nodeKind),
    gaps,
  };
}

function detectThemeGaps(
  theme: string,
  documents: readonly KnowledgeDocument[],
  brokenLinks: readonly { sourceId: string; target: string }[],
  orphans: readonly string[],
): KnowledgeDigestGap[] {
  const gaps: KnowledgeDigestGap[] = [];
  for (const broken of brokenLinks) {
    gaps.push({
      theme: titleCase(theme),
      kind: "broken-link",
      detail: `${broken.sourceId} references missing target ${broken.target}`,
      suggestedAction: "Run devflow wiki cleanup, then create or relink the missing target.",
    });
  }
  for (const orphan of orphans.slice(0, 5)) {
    gaps.push({
      theme: titleCase(theme),
      kind: "orphan",
      detail: `${orphan} has no incoming or outgoing knowledge links`,
      suggestedAction: "Run devflow wiki connect --dry-run to find structured related links.",
    });
  }
  for (const doc of documents) {
    if (/\b(TODO|TBD)\b|\?{2,}/i.test(`${doc.title}\n${doc.body}`)) {
      gaps.push({
        theme: titleCase(theme),
        kind: "todo-marker",
        detail: `${doc.id} still contains TODO/TBD markers or unresolved questions`,
        suggestedAction: "Resolve the open question or capture a follow-up task.",
      });
    }
  }
  const kinds = new Set(documents.map(nodeKind));
  if (kinds.has("spec") && !kinds.has("learning")) {
    gaps.push({
      theme: titleCase(theme),
      kind: "missing-perspective",
      detail: "Spec knowledge exists without linked implementation learnings",
      suggestedAction: "Capture a local knowledge.py learn entry when the spec is applied.",
    });
  }
  if (kinds.has("learning") && !kinds.has("spec")) {
    gaps.push({
      theme: titleCase(theme),
      kind: "missing-perspective",
      detail: "Learning entries exist without a matching spec perspective",
      suggestedAction: "Promote stable lessons into .devflow/spec when they become rules.",
    });
  }
  return gaps;
}

function buildHeatmap(themes: readonly KnowledgeDigestTheme[]): Record<string, Record<string, number>> {
  const heatmap: Record<string, Record<string, number>> = {};
  for (const theme of themes) {
    for (const [kind, count] of Object.entries(theme.typeDistribution)) {
      heatmap[kind] ??= {};
      heatmap[kind][theme.name] = count;
    }
  }
  return heatmap;
}

function renderHeatmapTable(digest: KnowledgeDigest): string {
  if (digest.themes.length === 0) return "(no themes)";
  const themeNames = digest.themes.map((theme) => theme.name);
  const kinds = Object.keys(digest.heatmap).sort();
  const lines = [
    `| Type | ${themeNames.map(escapeTable).join(" | ")} |`,
    `|------|${themeNames.map(() => "------|").join("")}`,
  ];
  for (const kind of kinds) {
    const cells = themeNames.map((theme) => String(digest.heatmap[kind]?.[theme] ?? 0));
    lines.push(`| ${escapeTable(kind)} | ${cells.join(" | ")} |`);
  }
  return lines.join("\n");
}

function findUnlinkedInsights(
  documents: readonly KnowledgeDocument[],
  themes: readonly KnowledgeDigestTheme[],
  backlinks: Record<string, string[]>,
): KnowledgeDigestEntry[] {
  const themeKeywords = new Set(themes.flatMap((theme) => tokenize(theme.name)));
  return documents
    .filter((doc) => doc.entryType === "learning")
    .filter((doc) => (backlinks[doc.id]?.length ?? 0) === 0 && doc.related.length === 0)
    .filter((doc) => doc.keywords.some((keyword) => themeKeywords.has(keyword.toLowerCase())))
    .map((doc) => digestEntry(doc, "brief"))
    .slice(0, 10);
}

function recommendActions(
  gaps: readonly KnowledgeDigestGap[],
  unlinkedInsights: readonly KnowledgeDigestEntry[],
  orphanCount: number,
): string[] {
  const actions: string[] = [];
  if (orphanCount > 0) actions.push("Run devflow wiki connect --dry-run to review orphan rescue suggestions.");
  if (gaps.some((gap) => gap.kind === "broken-link")) actions.push("Run devflow wiki cleanup before relying on digest connectivity.");
  if (unlinkedInsights.length > 0) actions.push("Link matching learning entries with devflow wiki connect --fix after reviewing suggestions.");
  if (gaps.some((gap) => gap.kind === "missing-perspective")) actions.push("Promote stable learnings into spec docs or capture learnings for spec-only themes.");
  return actions;
}

function digestEntry(doc: KnowledgeDocument, format: "brief" | "full"): KnowledgeDigestEntry {
  return {
    id: doc.id,
    title: doc.title,
    kind: nodeKind(doc),
    category: doc.category,
    keywords: doc.keywords,
    relativePath: doc.relativePath,
    line: doc.line,
    snippet: format === "full" ? snippet(doc.body) : undefined,
  };
}

function summarizeTheme(name: string, docs: readonly KnowledgeDocument[]): string {
  const topKeywords = topValues(docs.flatMap((doc) => doc.keywords)).slice(0, 5);
  const kinds = Object.entries(countBy(docs, nodeKind))
    .map(([kind, count]) => `${count} ${kind}`)
    .join(", ");
  const keywordText = topKeywords.length > 0 ? ` around ${topKeywords.join(", ")}` : "";
  return `This theme groups ${docs.length} entries${keywordText}. It currently spans ${kinds || "uncategorized knowledge"}.`;
}

function themeKey(doc: KnowledgeDocument, topic: string | undefined): string {
  const topicTokens = new Set(tokenize(topic ?? ""));
  const matchingKeyword = doc.keywords.find((keyword) => topicTokens.has(keyword.toLowerCase()));
  return matchingKeyword ?? doc.keywords[0] ?? doc.category ?? nodeKind(doc);
}

function matchesScope(doc: KnowledgeDocument, scope: string): boolean {
  const normalized = scope.toLowerCase();
  return (
    doc.collection === normalized ||
    doc.type === normalized ||
    doc.entryType?.toLowerCase() === normalized ||
    doc.category?.toLowerCase() === normalized
  );
}

function matchesTopic(doc: KnowledgeDocument, tokens: readonly string[]): boolean {
  const body = doc.type === "markdown" ? bodyForKnowledgeGraphLinks(doc) : doc.body;
  const haystacks = [
    doc.id,
    doc.title,
    doc.category ?? "",
    doc.relativePath,
    body,
    ...doc.keywords,
  ].map((value) => value.toLowerCase());
  return tokens.some((token) =>
    haystacks.some((value) => value.includes(token.toLowerCase())),
  );
}

function nodeKind(doc: KnowledgeDocument): string {
  return doc.entryType ?? doc.collection;
}

function isDigestNode(doc: KnowledgeDocument): boolean {
  if (isGeneratedKnowledgeGapIssue(doc) || isGeneratedDigestLearning(doc)) {
    return false;
  }
  if (doc.type === "markdown" && bodyForKnowledgeGraphLinks(doc).trim().length === 0) {
    return false;
  }
  return isKnowledgeGraphNode(doc);
}

function isGeneratedKnowledgeGapIssue(doc: KnowledgeDocument): boolean {
  return (
    doc.type === "spec-entry" &&
    doc.entryType === "issue" &&
    doc.category === "knowledge-gap" &&
    doc.source === "wiki-digest"
  );
}

function isGeneratedDigestLearning(doc: KnowledgeDocument): boolean {
  return (
    doc.type === "spec-entry" &&
    doc.entryType === "learning" &&
    doc.source === "wiki-digest"
  );
}

function docTimestamp(doc: KnowledgeDocument): number {
  if (doc.date) {
    const parsed = Date.parse(`${doc.date}T00:00:00Z`);
    if (Number.isFinite(parsed)) return parsed;
  }
  try {
    return fs.statSync(doc.filePath).mtimeMs;
  } catch {
    return 0;
  }
}

function scopeLabel(options: KnowledgeDigestOptions): string {
  const parts: string[] = [];
  if (options.topic?.trim()) parts.push(options.topic.trim());
  if (options.type?.trim()) parts.push(`type=${options.type.trim()}`);
  if (options.recentDays !== undefined) parts.push(`recent=${options.recentDays}d`);
  return parts.length > 0 ? parts.join(", ") : "all knowledge";
}

function countBy<T>(items: readonly T[], keyFor: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const key = keyFor(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function topValues(values: readonly string[]): string[] {
  return Object.entries(countBy(values.filter(Boolean), (value) => value.toLowerCase()))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value]) => value);
}

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ") || "Other";
}

function slugify(value: string): string {
  return slugifyReportPart(value);
}

function snippet(body: string): string {
  return body.replace(/\s+/g, " ").trim().slice(0, 220);
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, "\\|");
}

function positiveInt(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) return fallback;
  return Math.floor(value);
}
