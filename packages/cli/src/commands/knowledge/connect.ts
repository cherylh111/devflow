import {
  buildKnowledgeGraph,
  computeKnowledgeGraphHealth,
  detectKnowledgeOrphans,
  isKnowledgeGraphNode,
  type KnowledgeGraph,
  type KnowledgeGraphHealth,
} from "./graph.js";
import { tokenize } from "./search.js";
import type { KnowledgeDocument } from "./store.js";

export interface KnowledgeConnectOptions {
  scope?: string;
  minSimilarity?: number;
  max?: number;
}

export interface KnowledgeConnectionSuggestion {
  sourceId: string;
  targetId: string;
  sourceTitle: string;
  targetTitle: string;
  score: number;
  reasons: string[];
}

export interface KnowledgeConnectResult {
  baseline: KnowledgeGraphHealth;
  projected: KnowledgeGraphHealth;
  suggestions: KnowledgeConnectionSuggestion[];
}

interface Candidate {
  source: KnowledgeDocument;
  target: KnowledgeDocument;
  reasons: string[];
  extraScore?: number;
}

export function suggestKnowledgeConnections(
  documents: readonly KnowledgeDocument[],
  options: KnowledgeConnectOptions = {},
): KnowledgeConnectResult {
  const max = positiveInt(options.max, 20);
  const minSimilarity = clamp(options.minSimilarity ?? 0.3, 0, 1);
  const docs = filterScope(documents, options.scope).filter(isKnowledgeGraphNode);
  const graph = buildKnowledgeGraph(docs);
  const candidates = [
    ...orphanRescueCandidates(docs, graph),
    ...reverseLinkCandidates(docs, graph),
    ...transitiveCandidates(docs, graph),
    ...typeBridgeCandidates(docs, graph),
  ];
  const suggestions = rankCandidates(candidates, graph, minSimilarity).slice(0, max);
  const projected = computeKnowledgeGraphHealth(
    projectGraph(graph, suggestions),
    docs,
  );

  return {
    baseline: computeKnowledgeGraphHealth(graph, docs),
    projected,
    suggestions,
  };
}

function orphanRescueCandidates(
  docs: readonly KnowledgeDocument[],
  graph: KnowledgeGraph,
): Candidate[] {
  const byId = new Map(docs.map((doc) => [doc.id, doc]));
  return detectKnowledgeOrphans(graph, docs).flatMap((id) => {
    const source = byId.get(id);
    if (!source) return [];
    return docs
      .filter((target) => target.id !== source.id)
      .map((target) => ({
        source,
        target,
        reasons: ["orphan rescue"],
        extraScore: 0.05,
      }));
  });
}

function reverseLinkCandidates(
  docs: readonly KnowledgeDocument[],
  graph: KnowledgeGraph,
): Candidate[] {
  const byId = new Map(docs.map((doc) => [doc.id, doc]));
  const candidates: Candidate[] = [];
  for (const [sourceId, targetIds] of Object.entries(graph.forwardLinks)) {
    for (const targetId of targetIds) {
      if (hasForwardLink(graph, targetId, sourceId)) continue;
      const source = byId.get(targetId);
      const target = byId.get(sourceId);
      if (!source || !target) continue;
      candidates.push({
        source,
        target,
        reasons: ["missing reverse link"],
        extraScore: 0.15,
      });
    }
  }
  return candidates;
}

function transitiveCandidates(
  docs: readonly KnowledgeDocument[],
  graph: KnowledgeGraph,
): Candidate[] {
  const byId = new Map(docs.map((doc) => [doc.id, doc]));
  const candidates: Candidate[] = [];
  for (const [sourceId, middleIds] of Object.entries(graph.forwardLinks)) {
    for (const middleId of middleIds) {
      for (const targetId of graph.forwardLinks[middleId] ?? []) {
        if (targetId === sourceId || hasForwardLink(graph, sourceId, targetId)) {
          continue;
        }
        const source = byId.get(sourceId);
        const target = byId.get(targetId);
        if (!source || !target || !sharesCategoryOrKeyword(source, target)) {
          continue;
        }
        candidates.push({
          source,
          target,
          reasons: ["two-hop transitive link"],
          extraScore: 0.1,
        });
      }
    }
  }
  return candidates;
}

function typeBridgeCandidates(
  docs: readonly KnowledgeDocument[],
  graph: KnowledgeGraph,
): Candidate[] {
  const candidates: Candidate[] = [];
  for (let i = 0; i < docs.length; i++) {
    const source = docs[i];
    if (!source) continue;
    for (let j = i + 1; j < docs.length; j++) {
      const target = docs[j];
      if (!target || !isTypeBridge(source, target)) continue;
      if (hasAnyLink(graph, source.id, target.id)) continue;
      if (!sharesConcept(source, target)) continue;
      candidates.push({
        source,
        target,
        reasons: ["type bridge"],
        extraScore: 0.1,
      });
      candidates.push({
        source: target,
        target: source,
        reasons: ["type bridge"],
        extraScore: 0.1,
      });
    }
  }
  return candidates;
}

function rankCandidates(
  candidates: readonly Candidate[],
  graph: KnowledgeGraph,
  minSimilarity: number,
): KnowledgeConnectionSuggestion[] {
  const byPair = new Map<string, KnowledgeConnectionSuggestion>();
  for (const candidate of candidates) {
    if (candidate.source.id === candidate.target.id) continue;
    if (hasForwardLink(graph, candidate.source.id, candidate.target.id)) continue;
    const scored = scoreCandidate(candidate);
    if (scored.score < minSimilarity) continue;
    const key = `${scored.sourceId}\n${scored.targetId}`;
    const existing = byPair.get(key);
    if (!existing || scored.score > existing.score) {
      if (existing) {
        scored.reasons = [...new Set([...existing.reasons, ...scored.reasons])];
      }
      byPair.set(key, scored);
    } else if (existing.score === scored.score) {
      existing.reasons = [...new Set([...existing.reasons, ...scored.reasons])];
    } else {
      existing.reasons = [...new Set([...existing.reasons, ...scored.reasons])];
    }
  }
  return [...byPair.values()].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.sourceId !== b.sourceId) return a.sourceId.localeCompare(b.sourceId);
    return a.targetId.localeCompare(b.targetId);
  });
}

function scoreCandidate(candidate: Candidate): KnowledgeConnectionSuggestion {
  const tagScore = keywordOverlapRatio(candidate.source, candidate.target);
  const titleScore = titleSimilarity(candidate.source, candidate.target);
  const sameCategory = sameCategoryBonus(candidate.source, candidate.target);
  const typeBridge = isTypeBridge(candidate.source, candidate.target) ? 1 : 0;
  const score = clamp(
    0.4 * tagScore +
      0.3 * titleScore +
      0.2 * sameCategory +
      0.1 * typeBridge +
      (candidate.extraScore ?? 0),
    0,
    1,
  );
  const reasons = new Set(candidate.reasons);
  if (tagScore > 0) reasons.add(`keyword overlap (${sharedKeywords(candidate.source, candidate.target).join(", ")})`);
  if (titleScore > 0) reasons.add("title similarity");
  if (sameCategory > 0) reasons.add("same category");
  if (typeBridge > 0) reasons.add("type bridge");

  return {
    sourceId: candidate.source.id,
    targetId: candidate.target.id,
    sourceTitle: candidate.source.title,
    targetTitle: candidate.target.title,
    score: Number(score.toFixed(3)),
    reasons: [...reasons],
  };
}

function projectGraph(
  graph: KnowledgeGraph,
  suggestions: readonly KnowledgeConnectionSuggestion[],
): KnowledgeGraph {
  const forwardLinks = cloneLinks(graph.forwardLinks);
  const backlinks = cloneLinks(graph.backlinks);
  for (const suggestion of suggestions) {
    addUnique(forwardLinks, suggestion.sourceId, suggestion.targetId);
    addUnique(backlinks, suggestion.targetId, suggestion.sourceId);
  }
  return {
    forwardLinks,
    backlinks,
    brokenLinks: graph.brokenLinks.slice(),
  };
}

function filterScope(
  docs: readonly KnowledgeDocument[],
  scope: string | undefined,
): KnowledgeDocument[] {
  if (!scope) return [...docs];
  const normalized = scope.toLowerCase();
  return docs.filter((doc) => {
    return (
      doc.collection === normalized ||
      doc.type === normalized ||
      doc.entryType?.toLowerCase() === normalized ||
      doc.category?.toLowerCase() === normalized
    );
  });
}

function keywordOverlapRatio(
  source: KnowledgeDocument,
  target: KnowledgeDocument,
): number {
  const sourceKeywords = new Set(source.keywords.map((item) => item.toLowerCase()));
  const targetKeywords = new Set(target.keywords.map((item) => item.toLowerCase()));
  const denom = Math.max(sourceKeywords.size, targetKeywords.size);
  if (denom === 0) return 0;
  return sharedKeywords(source, target).length / denom;
}

function sharedKeywords(
  source: KnowledgeDocument,
  target: KnowledgeDocument,
): string[] {
  const targetKeywords = new Set(target.keywords.map((item) => item.toLowerCase()));
  return [...new Set(source.keywords.map((item) => item.toLowerCase()))].filter(
    (item) => targetKeywords.has(item),
  );
}

function titleSimilarity(
  source: KnowledgeDocument,
  target: KnowledgeDocument,
): number {
  const sourceTokens = new Set(tokenize(source.title));
  const targetTokens = new Set(tokenize(target.title));
  const denom = Math.max(sourceTokens.size, targetTokens.size);
  if (denom === 0) return 0;
  let shared = 0;
  for (const token of sourceTokens) {
    if (targetTokens.has(token)) shared++;
  }
  return shared / denom;
}

function sameCategoryBonus(
  source: KnowledgeDocument,
  target: KnowledgeDocument,
): number {
  return source.category?.toLowerCase() === target.category?.toLowerCase() &&
    source.category !== undefined
    ? 1
    : 0;
}

function isTypeBridge(
  source: KnowledgeDocument,
  target: KnowledgeDocument,
): boolean {
  return nodeKind(source) !== nodeKind(target);
}

function nodeKind(doc: KnowledgeDocument): string {
  return doc.entryType ?? doc.collection;
}

function sharesCategoryOrKeyword(
  source: KnowledgeDocument,
  target: KnowledgeDocument,
): boolean {
  return sameCategoryBonus(source, target) > 0 || sharedKeywords(source, target).length > 0;
}

function sharesConcept(
  source: KnowledgeDocument,
  target: KnowledgeDocument,
): boolean {
  return (
    sharedKeywords(source, target).length > 0 ||
    titleSimilarity(source, target) > 0 ||
    sameCategoryBonus(source, target) > 0
  );
}

function hasAnyLink(
  graph: KnowledgeGraph,
  sourceId: string,
  targetId: string,
): boolean {
  return (
    hasForwardLink(graph, sourceId, targetId) ||
    hasForwardLink(graph, targetId, sourceId)
  );
}

function hasForwardLink(
  graph: KnowledgeGraph,
  sourceId: string,
  targetId: string,
): boolean {
  return graph.forwardLinks[sourceId]?.includes(targetId) ?? false;
}

function cloneLinks(links: Record<string, string[]>): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(links).map(([key, values]) => [key, values.slice()]),
  );
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

function positiveInt(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) return fallback;
  return Math.floor(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
