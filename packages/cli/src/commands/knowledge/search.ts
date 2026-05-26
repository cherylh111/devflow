import type { KnowledgeDocument } from "./store.js";

export type KnowledgeQueryType =
  | "learning"
  | "knowhow"
  | "spec"
  | "task"
  | "journal"
  | "spec-entry"
  | "markdown";

export interface KnowledgeFilters {
  type?: KnowledgeQueryType;
  category?: string;
  keyword?: string;
  limit?: number;
}

export interface KnowledgeSearchHit {
  document: KnowledgeDocument;
  score: number;
  snippet: string;
}

export function filterDocuments(
  documents: readonly KnowledgeDocument[],
  filters: KnowledgeFilters,
): KnowledgeDocument[] {
  const keyword = filters.keyword?.toLowerCase();
  const category = filters.category?.toLowerCase();
  return documents.filter((doc) => {
    if (filters.type === "learning" && doc.entryType !== "learning") {
      return false;
    }
    if (filters.type === "knowhow" && doc.entryType !== "knowhow") {
      return false;
    }
    if (filters.type === "spec" && doc.collection !== "spec") {
      return false;
    }
    if (filters.type === "task" && doc.collection !== "task") {
      return false;
    }
    if (filters.type === "journal" && doc.collection !== "journal") {
      return false;
    }
    if (filters.type === "spec-entry" && doc.type !== "spec-entry") {
      return false;
    }
    if (filters.type === "markdown" && doc.type !== "markdown") {
      return false;
    }
    if (category && doc.category?.toLowerCase() !== category) {
      return false;
    }
    if (keyword && !doc.keywords.some((value) => value.toLowerCase() === keyword)) {
      return false;
    }
    return true;
  });
}

export function searchDocuments(
  documents: readonly KnowledgeDocument[],
  query: string,
  filters: KnowledgeFilters = {},
): KnowledgeSearchHit[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const hits: KnowledgeSearchHit[] = [];
  for (const doc of filterDocuments(documents, filters)) {
    const score = scoreDocument(doc, tokens);
    if (score <= 0) continue;
    hits.push({
      document: doc,
      score,
      snippet: snippetFor(doc, tokens),
    });
  }
  hits.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.document.relativePath.localeCompare(b.document.relativePath);
  });
  return hits.slice(0, filters.limit ?? 20);
}

export function tokenize(value: string): string[] {
  return [
    ...new Set(
      value
        .toLowerCase()
        .split(/[^\p{Letter}\p{Number}_-]+/u)
        .map((token) => token.trim())
        .filter(Boolean),
    ),
  ];
}

function scoreDocument(doc: KnowledgeDocument, tokens: readonly string[]): number {
  const title = doc.title.toLowerCase();
  const body = doc.body.toLowerCase();
  const path = doc.relativePath.toLowerCase();
  const keywords = doc.keywords.map((kw) => kw.toLowerCase());
  let score = 0;
  for (const token of tokens) {
    if (title.includes(token)) score += 8;
    if (keywords.includes(token)) score += 12;
    if (doc.category?.toLowerCase() === token) score += 6;
    if (path.includes(token)) score += 3;
    score += Math.min(countOccurrences(body, token), 10);
  }
  if (score > 0 && doc.type === "spec-entry") score += 2;
  return score;
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let index = 0;
  while (true) {
    index = haystack.indexOf(needle, index);
    if (index === -1) return count;
    count++;
    index += needle.length;
  }
}

function snippetFor(doc: KnowledgeDocument, tokens: readonly string[]): string {
  const body = doc.body.replace(/\s+/g, " ").trim();
  if (!body) return "";
  const lower = body.toLowerCase();
  let first = -1;
  for (const token of tokens) {
    const idx = lower.indexOf(token);
    if (idx !== -1 && (first === -1 || idx < first)) first = idx;
  }
  if (first === -1) return body.slice(0, 180);
  const start = Math.max(0, first - 70);
  const end = Math.min(body.length, first + 140);
  return `${start > 0 ? "..." : ""}${body.slice(start, end)}${end < body.length ? "..." : ""}`;
}
