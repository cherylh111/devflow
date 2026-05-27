import fs from "node:fs";
import path from "node:path";

import { PATHS } from "../../constants/paths.js";
import {
  buildKnowledgeGraph,
  detectKnowledgeHubs,
  detectKnowledgeOrphans,
  isKnowledgeGraphNode,
} from "./graph.js";
import {
  makeLearningId,
  parseKeywordCsv,
  parseSpecEntries,
  serializeSpecEntry,
  type SpecEntry,
  type SpecEntryAttrs,
  type SpecEntryDiagnostic,
} from "./spec-entry.js";

export const LEARNINGS_RELATIVE_PATH = `${PATHS.SPEC}/guides/learnings.md`;

export interface LearningInput {
  insight: string;
  title?: string;
  category?: string;
  keywords?: string[];
  source?: string;
  task?: string;
  package?: string;
  layer?: string;
  confidence?: string;
  derived_from?: string;
  id?: string;
  now?: Date;
}

export interface LearningWriteResult {
  id: string;
  filePath: string;
  entry: SpecEntry;
}

export interface KnowledgeDocument {
  id: string;
  type: "spec-entry" | "markdown";
  entryType?: string;
  collection: "spec" | "task" | "journal";
  title: string;
  body: string;
  filePath: string;
  relativePath: string;
  line: number;
  category?: string;
  keywords: string[];
  source?: string;
  date?: string;
  status?: string;
  related: string[];
  parent?: string;
  attrs?: SpecEntryAttrs;
}

export interface KnowledgeScanResult {
  documents: KnowledgeDocument[];
  entries: SpecEntry[];
  diagnostics: SpecEntryDiagnostic[];
}

export interface KnowledgeHealth {
  documents: number;
  specEntries: number;
  diagnostics: SpecEntryDiagnostic[];
  duplicateIds: {
    id: string;
    locations: { filePath: string; line: number }[];
  }[];
  emptyDocuments: { filePath: string }[];
  brokenLinks: { filePath: string; line: number; target: string }[];
}

export interface KnowledgeStats {
  documents: number;
  specEntries: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  topKeywords: { keyword: string; count: number }[];
  connectivity: {
    nodes: number;
    links: number;
    brokenLinks: number;
    orphans: number;
    averageInDegree: number;
    averageOutDegree: number;
    maxHub: { id: string; inDegree: number } | null;
  };
  growth: {
    entriesByWeek: Record<string, number>;
  };
}

export interface KnowledgeRelatedLinkRequest {
  sourceId: string;
  targetId: string;
}

export interface KnowledgeRelatedLinkApplyResult {
  applied: { sourceId: string; targetId: string; filePath: string }[];
  skipped: { sourceId: string; targetId: string; reason: string }[];
}

export interface KnowledgeRelatedLinkRemoveRequest {
  sourceId: string;
  target: string;
}

export interface KnowledgeRelatedLinkRemoveResult {
  removed: { sourceId: string; target: string; filePath: string }[];
  skipped: { sourceId: string; target: string; reason: string }[];
}

const MARKDOWN_EXT = ".md";

export function learningScaffold(): string {
  return `# Project Learnings

Append-only reusable insights captured by \`python3 ./.devflow/scripts/knowledge.py learn\`.

Entries use closed \`&lt;spec-entry&gt;\` blocks so they can live inside normal
markdown while still being searchable and loadable as structured knowledge.
`;
}

export function ensureLearningStore(cwd: string): string {
  const filePath = path.join(cwd, LEARNINGS_RELATIVE_PATH);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, learningScaffold(), "utf-8");
  }
  return filePath;
}

export function appendLearning(cwd: string, input: LearningInput): LearningWriteResult {
  const filePath = ensureLearningStore(cwd);
  const existing = fs.readFileSync(filePath, "utf-8");
  const now = input.now ?? new Date();
  const id = input.id ?? makeUniqueLearningId(existing, filePath, now);
  const title = blankToUndefined(input.title?.trim()) ?? titleFromInsight(input.insight);
  const keywords = normalizeKeywords(input.keywords);
  const attrs: SpecEntryAttrs = {
    id,
    type: "learning",
    category: blankToUndefined(input.category?.trim()) ?? "learning",
    keywords,
    source: blankToUndefined(input.source?.trim()) ?? "manual",
    date: now.toISOString().slice(0, 10),
    task: blankToUndefined(input.task?.trim()),
    package: blankToUndefined(input.package?.trim()),
    layer: blankToUndefined(input.layer?.trim()),
    confidence: blankToUndefined(input.confidence?.trim()),
    derived_from: blankToUndefined(input.derived_from?.trim()),
  };
  const body = renderLearningBody(title, input.insight);
  const entryText = serializeSpecEntry(attrs, body);
  const separator = existing.endsWith("\n") ? "\n" : "\n\n";
  fs.writeFileSync(filePath, `${existing}${separator}${entryText}`, "utf-8");

  const parsed = parseSpecEntries(entryText, filePath).entries[0];
  if (!parsed) {
    throw new Error("internal error: appended learning could not be parsed");
  }
  return { id, filePath, entry: parsed };
}

export function scanKnowledge(cwd: string): KnowledgeScanResult {
  const roots: {
    collection: KnowledgeDocument["collection"];
    path: string;
  }[] = [
    { collection: "spec", path: path.join(cwd, PATHS.SPEC) },
    { collection: "task", path: path.join(cwd, PATHS.TASKS) },
    { collection: "journal", path: path.join(cwd, PATHS.WORKSPACE) },
  ];
  const documents: KnowledgeDocument[] = [];
  const entries: SpecEntry[] = [];
  const diagnostics: SpecEntryDiagnostic[] = [];

  for (const root of roots) {
    for (const filePath of walkMarkdown(root.path)) {
      const content = readText(filePath);
      if (content === undefined) continue;
      const relativePath = normalizeRelative(cwd, filePath);
      const parsed = parseSpecEntries(content, filePath);
      entries.push(...parsed.entries);
      diagnostics.push(...parsed.diagnostics);
      for (const entry of parsed.entries) {
        documents.push(specEntryToDocument(cwd, entry, root.collection));
      }
      const title = markdownTitle(content) ?? path.basename(filePath);
      documents.push({
        id: `file:${relativePath}`,
        type: "markdown",
        collection: root.collection,
        title,
        body: content.trim(),
        filePath,
        relativePath,
        line: 1,
        keywords: [],
        related: [],
      });
    }
  }

  return { documents, entries, diagnostics };
}

export function getKnowledgeHealth(cwd: string): KnowledgeHealth {
  const scan = scanKnowledge(cwd);
  const byId = new Map<string, { filePath: string; line: number }[]>();
  for (const entry of scan.entries) {
    const locations = byId.get(entry.attrs.id) ?? [];
    locations.push({ filePath: entry.filePath, line: entry.startLine });
    byId.set(entry.attrs.id, locations);
  }
  const duplicateIds = [...byId.entries()]
    .filter(([, locations]) => locations.length > 1)
    .map(([id, locations]) => ({ id, locations }));

  return {
    documents: scan.documents.length,
    specEntries: scan.entries.length,
    diagnostics: scan.diagnostics,
    duplicateIds,
    emptyDocuments: findEmptyDocuments(cwd),
    brokenLinks: findBrokenLinks(cwd),
  };
}

export function getKnowledgeStats(cwd: string): KnowledgeStats {
  const scan = scanKnowledge(cwd);
  const byType: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const keywords = new Map<string, number>();
  const graphNodes = scan.documents.filter(isKnowledgeGraphNode);
  const graph = buildKnowledgeGraph(graphNodes);
  const linkCount = Object.values(graph.forwardLinks)
    .reduce((total, targets) => total + targets.length, 0);
  const hubs = detectKnowledgeHubs(graph, 1);
  const entriesByWeek: Record<string, number> = {};

  for (const doc of scan.documents) {
    byType[doc.type] = (byType[doc.type] ?? 0) + 1;
    if (doc.category) {
      byCategory[doc.category] = (byCategory[doc.category] ?? 0) + 1;
    }
    for (const keyword of doc.keywords) {
      keywords.set(keyword, (keywords.get(keyword) ?? 0) + 1);
    }
  }

  for (const doc of graphNodes) {
    const week = isoWeekKey(new Date(statsTimestamp(doc)));
    entriesByWeek[week] = (entriesByWeek[week] ?? 0) + 1;
  }

  const topKeywords = [...keywords.entries()]
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.keyword.localeCompare(b.keyword);
    })
    .slice(0, 20);

  return {
    documents: scan.documents.length,
    specEntries: scan.entries.length,
    byType,
    byCategory,
    topKeywords,
    connectivity: {
      nodes: graphNodes.length,
      links: linkCount,
      brokenLinks: graph.brokenLinks.length,
      orphans: detectKnowledgeOrphans(graph, graphNodes).length,
      averageInDegree: roundRatio(linkCount, graphNodes.length),
      averageOutDegree: roundRatio(linkCount, graphNodes.length),
      maxHub: hubs[0] ?? null,
    },
    growth: {
      entriesByWeek: Object.fromEntries(
        Object.entries(entriesByWeek).sort(([a], [b]) => a.localeCompare(b)),
      ),
    },
  };
}

export function applyRelatedLinks(
  cwd: string,
  requests: readonly KnowledgeRelatedLinkRequest[],
): KnowledgeRelatedLinkApplyResult {
  const uniqueRequests = dedupeLinkRequests(requests);
  const scan = scanKnowledge(cwd);
  const entryById = new Map(scan.entries.map((entry) => [entry.attrs.id, entry]));
  const pendingByFile = new Map<string, KnowledgeRelatedLinkRequest[]>();
  const result: KnowledgeRelatedLinkApplyResult = { applied: [], skipped: [] };

  for (const request of uniqueRequests) {
    const entry = entryById.get(request.sourceId);
    if (!entry) {
      result.skipped.push({
        ...request,
        reason: "source is not a structured spec-entry",
      });
      continue;
    }
    if (!entryById.has(request.targetId)) {
      result.skipped.push({ ...request, reason: "target entry not found" });
      continue;
    }
    const currentRelated = relatedValues(entry.attrs.related);
    if (currentRelated.includes(request.targetId)) {
      result.skipped.push({ ...request, reason: "link already exists" });
      continue;
    }
    const requestsForFile = pendingByFile.get(entry.filePath) ?? [];
    requestsForFile.push(request);
    pendingByFile.set(entry.filePath, requestsForFile);
  }

  for (const [filePath, fileRequests] of pendingByFile.entries()) {
    const content = readText(filePath);
    if (content === undefined) {
      for (const request of fileRequests) {
        result.skipped.push({ ...request, reason: "source file could not be read" });
      }
      continue;
    }
    const parsed = parseSpecEntries(content, filePath);
    const requestsBySource = new Map<string, string[]>();
    for (const request of fileRequests) {
      const targets = requestsBySource.get(request.sourceId) ?? [];
      targets.push(request.targetId);
      requestsBySource.set(request.sourceId, targets);
    }

    let nextContent = content;
    for (const entry of parsed.entries.slice().sort((a, b) => b.startOffset - a.startOffset)) {
      const targets = requestsBySource.get(entry.attrs.id);
      if (!targets) continue;
      const related = [...relatedValues(entry.attrs.related)];
      let changed = false;
      for (const target of targets) {
        if (!related.includes(target)) {
          related.push(target);
          changed = true;
        }
      }
      if (!changed) continue;
      const updatedBlock = serializeSpecEntry(
        {
          ...entry.attrs,
          related,
        },
        entry.body,
      ).trimEnd();
      nextContent =
        nextContent.slice(0, entry.startOffset) +
        updatedBlock +
        nextContent.slice(entry.endOffset);
      for (const target of targets) {
        result.applied.push({ sourceId: entry.attrs.id, targetId: target, filePath });
      }
    }
    fs.writeFileSync(filePath, nextContent, "utf-8");
  }

  return result;
}

export function removeRelatedLinks(
  cwd: string,
  requests: readonly KnowledgeRelatedLinkRemoveRequest[],
): KnowledgeRelatedLinkRemoveResult {
  const uniqueRequests = dedupeRemoveRequests(requests);
  const scan = scanKnowledge(cwd);
  const entryById = new Map(scan.entries.map((entry) => [entry.attrs.id, entry]));
  const pendingByFile = new Map<string, KnowledgeRelatedLinkRemoveRequest[]>();
  const result: KnowledgeRelatedLinkRemoveResult = { removed: [], skipped: [] };

  for (const request of uniqueRequests) {
    const entry = entryById.get(request.sourceId);
    if (!entry) {
      result.skipped.push({
        ...request,
        reason: "source is not a structured spec-entry",
      });
      continue;
    }
    const related = relatedValues(entry.attrs.related);
    if (!related.includes(request.target)) {
      result.skipped.push({ ...request, reason: "related target not present" });
      continue;
    }
    const requestsForFile = pendingByFile.get(entry.filePath) ?? [];
    requestsForFile.push(request);
    pendingByFile.set(entry.filePath, requestsForFile);
  }

  for (const [filePath, fileRequests] of pendingByFile.entries()) {
    const content = readText(filePath);
    if (content === undefined) {
      for (const request of fileRequests) {
        result.skipped.push({ ...request, reason: "source file could not be read" });
      }
      continue;
    }
    const parsed = parseSpecEntries(content, filePath);
    const requestsBySource = new Map<string, string[]>();
    for (const request of fileRequests) {
      const targets = requestsBySource.get(request.sourceId) ?? [];
      targets.push(request.target);
      requestsBySource.set(request.sourceId, targets);
    }

    let nextContent = content;
    for (const entry of parsed.entries.slice().sort((a, b) => b.startOffset - a.startOffset)) {
      const targets = requestsBySource.get(entry.attrs.id);
      if (!targets) continue;
      const removeSet = new Set(targets);
      const currentRelated = relatedValues(entry.attrs.related);
      const related = currentRelated.filter((target) => !removeSet.has(target));
      if (related.length === currentRelated.length) continue;
      const attrs: SpecEntryAttrs = {
        ...entry.attrs,
        related: related.length > 0 ? related : undefined,
      };
      const updatedBlock = serializeSpecEntry(attrs, entry.body).trimEnd();
      nextContent =
        nextContent.slice(0, entry.startOffset) +
        updatedBlock +
        nextContent.slice(entry.endOffset);
      for (const target of targets) {
        if (currentRelated.includes(target)) {
          result.removed.push({ sourceId: entry.attrs.id, target, filePath });
        }
      }
    }
    fs.writeFileSync(filePath, nextContent, "utf-8");
  }

  return result;
}

function specEntryToDocument(
  cwd: string,
  entry: SpecEntry,
  collection: KnowledgeDocument["collection"],
): KnowledgeDocument {
  const title = markdownTitle(entry.body) ?? entry.attrs.id;
  return {
    id: entry.attrs.id,
    type: "spec-entry",
    entryType: entry.attrs.type,
    collection,
    title,
    body: entry.body,
    filePath: entry.filePath,
    relativePath: normalizeRelative(cwd, entry.filePath),
    line: entry.startLine,
    category: entry.attrs.category,
    keywords: entry.attrs.keywords,
    source: entry.attrs.source,
    date: entry.attrs.date,
    status: stringAttr(entry.attrs.status),
    related: parseRelatedAttr(entry.attrs.related),
    parent: stringAttr(entry.attrs.parent),
    attrs: entry.attrs,
  };
}

function parseRelatedAttr(value: string | string[] | undefined): string[] {
  return relatedValues(value);
}

function relatedValues(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value.flatMap((item) => parseKeywordCsv(item)) : parseKeywordCsv(value);
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function dedupeLinkRequests(
  requests: readonly KnowledgeRelatedLinkRequest[],
): KnowledgeRelatedLinkRequest[] {
  const seen = new Set<string>();
  const deduped: KnowledgeRelatedLinkRequest[] = [];
  for (const request of requests) {
    const key = `${request.sourceId}\n${request.targetId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(request);
  }
  return deduped;
}

function dedupeRemoveRequests(
  requests: readonly KnowledgeRelatedLinkRemoveRequest[],
): KnowledgeRelatedLinkRemoveRequest[] {
  const seen = new Set<string>();
  const deduped: KnowledgeRelatedLinkRemoveRequest[] = [];
  for (const request of requests) {
    const key = `${request.sourceId}\n${request.target}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(request);
  }
  return deduped;
}

function stringAttr(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function statsTimestamp(doc: KnowledgeDocument): number {
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

function isoWeekKey(date: Date): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function roundRatio(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100) / 100;
}

function makeUniqueLearningId(existing: string, filePath: string, now: Date): string {
  const currentIds = new Set(
    parseSpecEntries(existing, filePath).entries.map((entry) => entry.attrs.id),
  );
  let id = makeLearningId(now);
  while (currentIds.has(id)) id = makeLearningId(now);
  return id;
}

function normalizeKeywords(keywords: string[] | undefined): string[] {
  const normalized = (keywords ?? [])
    .flatMap((value) => parseKeywordCsv(value))
    .map((value) => value.toLowerCase())
    .filter(Boolean);
  return [...new Set(normalized)];
}

function titleFromInsight(insight: string): string {
  const firstLine = insight.trim().split(/\r?\n/, 1)[0] ?? "";
  const stripped = firstLine.replace(/^#+\s*/, "").trim();
  if (stripped.length === 0) return "Learning";
  return stripped.length > 80 ? `${stripped.slice(0, 77)}...` : stripped;
}

function renderLearningBody(title: string, insight: string): string {
  const trimmed = insight.trim();
  if (/^###\s+/m.test(trimmed)) return trimmed;
  return `### ${title}\n\n${trimmed}`;
}

function markdownTitle(content: string): string | undefined {
  const match = content.match(/^#{1,3}\s+(.+)$/m);
  return match?.[1]?.trim();
}

function readText(filePath: string): string | undefined {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return undefined;
  }
}

function* walkMarkdown(root: string): Generator<string> {
  if (!fs.existsSync(root)) return;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === ".runtime" || entry.name === "__pycache__") continue;
      yield* walkMarkdown(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(MARKDOWN_EXT)) {
      yield fullPath;
    }
  }
}

function normalizeRelative(cwd: string, filePath: string): string {
  return path.relative(cwd, filePath).replace(/\\/g, "/");
}

function findEmptyDocuments(cwd: string): { filePath: string }[] {
  const roots = [
    path.join(cwd, PATHS.SPEC),
    path.join(cwd, PATHS.TASKS),
    path.join(cwd, PATHS.WORKSPACE),
  ];
  const empty: { filePath: string }[] = [];
  for (const root of roots) {
    for (const filePath of walkMarkdown(root)) {
      const content = readText(filePath);
      if (content === undefined) continue;
      const stripped = content
        .replace(/<spec-entry\b[^>]*>[\s\S]*?<\/spec-entry>/g, "")
        .replace(/^---\s*\n[\s\S]*?\n---/m, "")
        .replace(/^#+\s+.*$/gm, "")
        .replace(/^[-*]\s*$/gm, "")
        .trim();
      if (!stripped) empty.push({ filePath });
    }
  }
  return empty;
}

function findBrokenLinks(
  cwd: string,
): { filePath: string; line: number; target: string }[] {
  const roots = [
    path.join(cwd, PATHS.SPEC),
    path.join(cwd, PATHS.TASKS),
    path.join(cwd, PATHS.WORKSPACE),
  ];
  const broken: { filePath: string; line: number; target: string }[] = [];
  for (const root of roots) {
    for (const filePath of walkMarkdown(root)) {
      const content = readText(filePath);
      if (content === undefined) continue;
      for (const link of localMarkdownLinks(content)) {
        const targetPath = resolveLocalLink(filePath, link.target);
        if (!targetPath) continue;
        if (!fs.existsSync(targetPath)) {
          broken.push({ filePath, line: link.line, target: link.target });
        }
      }
    }
  }
  return broken;
}

function localMarkdownLinks(content: string): { target: string; line: number }[] {
  const links: { target: string; line: number }[] = [];
  const re = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const target = match[1];
    if (!target || isExternalLink(target)) continue;
    links.push({ target, line: lineNumberAt(content, match.index) });
  }
  return links;
}

function blankToUndefined(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

function isExternalLink(target: string): boolean {
  return (
    target.startsWith("#") ||
    /^[a-z][a-z0-9+.-]*:/i.test(target) ||
    target.startsWith("//")
  );
}

function resolveLocalLink(filePath: string, target: string): string | undefined {
  const withoutAnchor = target.split("#", 1)[0];
  if (!withoutAnchor) return undefined;
  let decoded = withoutAnchor;
  try {
    decoded = decodeURIComponent(withoutAnchor);
  } catch {
    decoded = withoutAnchor;
  }
  return path.resolve(path.dirname(filePath), decoded);
}

function lineNumberAt(content: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index; i++) {
    if (content.charCodeAt(i) === 10) line++;
  }
  return line;
}
