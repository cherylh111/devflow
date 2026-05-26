import {
  buildKnowledgeGraph,
  computeKnowledgeGraphHealth,
  detectKnowledgeOrphans,
  isKnowledgeGraphNode,
  resolveKnowledgeTarget,
  type KnowledgeGraphHealth,
} from "./graph.js";
import type { KnowledgeDocument } from "./store.js";

export interface KnowledgeCleanupOptions {
  staleDays?: number;
  now?: Date;
}

export interface KnowledgeCleanupIssue {
  kind:
    | "broken-related"
    | "broken-wikilink"
    | "orphan"
    | "empty-body"
    | "stale-draft";
  id: string;
  title: string;
  target?: string;
  filePath: string;
  line: number;
  detail: string;
  fixable: boolean;
}

export interface KnowledgeCleanupPlan {
  baseline: KnowledgeGraphHealth;
  issues: KnowledgeCleanupIssue[];
  counts: Record<KnowledgeCleanupIssue["kind"], number>;
  fixableBrokenRelated: { sourceId: string; target: string }[];
}

const DEFAULT_STALE_DAYS = 90;

export function planKnowledgeCleanup(
  documents: readonly KnowledgeDocument[],
  options: KnowledgeCleanupOptions = {},
): KnowledgeCleanupPlan {
  const graph = buildKnowledgeGraph(documents);
  const graphNodes = documents.filter(isKnowledgeGraphNode);
  const byId = new Map(documents.map((doc) => [doc.id, doc]));
  const issues: KnowledgeCleanupIssue[] = [];

  for (const doc of graphNodes) {
    for (const target of doc.related) {
      if (resolveKnowledgeTarget(documents, target)) continue;
      issues.push(issue(doc, "broken-related", `related target not found: ${target}`, true, target));
    }
  }

  for (const broken of graph.brokenLinks) {
    const source = byId.get(broken.sourceId);
    if (!source) continue;
    if (source.related.includes(broken.target)) continue;
    issues.push(issue(source, "broken-wikilink", `wikilink target not found: ${broken.target}`, false, broken.target));
  }

  for (const id of detectKnowledgeOrphans(graph, graphNodes)) {
    const doc = byId.get(id);
    if (!doc) continue;
    issues.push(issue(doc, "orphan", "no incoming or outgoing graph links", false));
  }

  for (const doc of graphNodes) {
    if (doc.body.trim().length === 0) {
      issues.push(issue(doc, "empty-body", "entry body is empty", false));
    }
    if (isStaleDraft(doc, options)) {
      issues.push(issue(doc, "stale-draft", `draft older than ${options.staleDays ?? DEFAULT_STALE_DAYS} days`, false));
    }
  }

  const counts = emptyCounts();
  for (const item of issues) counts[item.kind]++;

  return {
    baseline: computeKnowledgeGraphHealth(graph, documents),
    issues,
    counts,
    fixableBrokenRelated: issues
      .filter((item) => item.kind === "broken-related" && item.target)
      .map((item) => ({ sourceId: item.id, target: item.target ?? "" })),
  };
}

function issue(
  doc: KnowledgeDocument,
  kind: KnowledgeCleanupIssue["kind"],
  detail: string,
  fixable: boolean,
  target?: string,
): KnowledgeCleanupIssue {
  return {
    kind,
    id: doc.id,
    title: doc.title,
    target,
    filePath: doc.filePath,
    line: doc.line,
    detail,
    fixable,
  };
}

function isStaleDraft(
  doc: KnowledgeDocument,
  options: KnowledgeCleanupOptions,
): boolean {
  if (
    doc.category?.toLowerCase() !== "draft" &&
    doc.entryType?.toLowerCase() !== "draft" &&
    doc.status?.toLowerCase() !== "draft"
  ) {
    return false;
  }
  if (!doc.date) return false;
  const timestamp = Date.parse(`${doc.date}T00:00:00Z`);
  if (!Number.isFinite(timestamp)) return false;
  const now = options.now ?? new Date();
  const ageMs = now.getTime() - timestamp;
  const staleMs = (options.staleDays ?? DEFAULT_STALE_DAYS) * 24 * 60 * 60 * 1000;
  return ageMs >= staleMs;
}

function emptyCounts(): Record<KnowledgeCleanupIssue["kind"], number> {
  return {
    "broken-related": 0,
    "broken-wikilink": 0,
    orphan: 0,
    "empty-body": 0,
    "stale-draft": 0,
  };
}
