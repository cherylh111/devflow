import type { KnowledgeDocument } from "./store.js";

export interface KnowledgeBrokenLink {
  sourceId: string;
  target: string;
}

export interface KnowledgeGraph {
  forwardLinks: Record<string, string[]>;
  backlinks: Record<string, string[]>;
  brokenLinks: KnowledgeBrokenLink[];
}

export interface KnowledgeHub {
  id: string;
  inDegree: number;
}

export interface KnowledgeGraphHealth {
  score: number;
  totals: {
    entries: number;
    brokenLinks: number;
    orphans: number;
    missingTitles: number;
  };
  orphans: string[];
  hubs: KnowledgeHub[];
  brokenLinks: KnowledgeBrokenLink[];
}

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;

export function resolveKnowledgeTarget(
  documents: readonly KnowledgeDocument[],
  target: string,
): string | undefined {
  const normalized = target.trim();
  if (!normalized) return undefined;
  const byId = new Map(documents.map((doc) => [doc.id, doc]));
  if (byId.has(normalized)) return normalized;
  const titleIndex = new Map(
    documents.map((doc) => [doc.title.toLowerCase(), doc.id] as const),
  );
  return titleIndex.get(normalized.toLowerCase());
}

export function buildKnowledgeGraph(
  documents: readonly KnowledgeDocument[],
): KnowledgeGraph {
  const forwardLinks: Record<string, string[]> = {};
  const backlinks: Record<string, string[]> = {};
  const brokenLinks: KnowledgeBrokenLink[] = [];

  for (const doc of documents) {
    const targets = [
      ...doc.related,
      ...(doc.parent ? [doc.parent] : []),
      ...extractWikiLinks(bodyForKnowledgeGraphLinks(doc)),
    ];
    for (const target of targets) {
      const resolved = resolveKnowledgeTarget(documents, target);
      if (!resolved) {
        brokenLinks.push({ sourceId: doc.id, target });
        continue;
      }
      addUnique(forwardLinks, doc.id, resolved);
      addUnique(backlinks, resolved, doc.id);
    }
  }

  return { forwardLinks, backlinks, brokenLinks };
}

export function detectKnowledgeOrphans(
  graph: KnowledgeGraph,
  documents: readonly KnowledgeDocument[],
): string[] {
  return documents
    .filter(isKnowledgeGraphNode)
    .filter((doc) => {
      const outgoing = graph.forwardLinks[doc.id]?.length ?? 0;
      const incoming = graph.backlinks[doc.id]?.length ?? 0;
      return outgoing === 0 && incoming === 0;
    })
    .map((doc) => doc.id);
}

export function detectKnowledgeHubs(
  graph: KnowledgeGraph,
  limit = 10,
): KnowledgeHub[] {
  return Object.entries(graph.backlinks)
    .map(([id, sources]) => ({ id, inDegree: sources.length }))
    .sort((a, b) => b.inDegree - a.inDegree || a.id.localeCompare(b.id))
    .slice(0, limit);
}

export function computeKnowledgeGraphHealth(
  graph: KnowledgeGraph,
  documents: readonly KnowledgeDocument[],
): KnowledgeGraphHealth {
  const graphNodes = documents.filter(isKnowledgeGraphNode);
  const orphans = detectKnowledgeOrphans(graph, graphNodes);
  const hubs = detectKnowledgeHubs(graph, 10);
  const missingTitles = graphNodes.filter((doc) => !doc.title || doc.title === doc.id)
    .length;
  const rawScore =
    100 - 2 * graph.brokenLinks.length - orphans.length - 3 * missingTitles;

  return {
    score: Math.max(0, Math.min(100, rawScore)),
    totals: {
      entries: graphNodes.length,
      brokenLinks: graph.brokenLinks.length,
      orphans: orphans.length,
      missingTitles,
    },
    orphans,
    hubs,
    brokenLinks: graph.brokenLinks,
  };
}

export function isKnowledgeGraphNode(doc: KnowledgeDocument): boolean {
  if (doc.type === "spec-entry") return true;
  return bodyForKnowledgeGraphLinks(doc).trim().length > 0;
}

export function bodyForKnowledgeGraphLinks(doc: KnowledgeDocument): string {
  if (doc.type === "spec-entry") return doc.body;
  return doc.body.replace(/<spec-entry\b[^>]*>[\s\S]*?<\/spec-entry>/g, "");
}

function extractWikiLinks(body: string): string[] {
  const links: string[] = [];
  WIKILINK_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = WIKILINK_RE.exec(body)) !== null) {
    const target = match[1]?.trim();
    if (target) links.push(target);
  }
  return links;
}

function addUnique(
  map: Record<string, string[]>,
  source: string,
  target: string,
): void {
  const values = map[source] ?? [];
  if (!values.includes(target)) values.push(target);
  map[source] = values;
}
