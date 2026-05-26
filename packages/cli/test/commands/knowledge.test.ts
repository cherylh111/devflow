import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Command } from "commander";
import { afterEach, describe, expect, it } from "vitest";

import {
  applyRelatedLinks,
  appendLearning,
  getKnowledgeHealth,
  getKnowledgeStats,
  LEARNINGS_RELATIVE_PATH,
  removeRelatedLinks,
  scanKnowledge,
} from "../../src/commands/knowledge/store.js";
import {
  buildKnowledgeGraph,
  computeKnowledgeGraphHealth,
  detectKnowledgeHubs,
  detectKnowledgeOrphans,
} from "../../src/commands/knowledge/graph.js";
import { suggestKnowledgeConnections } from "../../src/commands/knowledge/connect.js";
import { planKnowledgeCleanup } from "../../src/commands/knowledge/cleanup.js";
import {
  createKnowledgeDigestIssues,
  createKnowledgeDigest,
  defaultDigestReportPath,
  renderKnowledgeDigestMarkdown,
  writeKnowledgeDigestReport,
} from "../../src/commands/knowledge/digest.js";
import {
  defaultKnowledgeReportPath,
  renderKnowledgeCleanupReportMarkdown,
  renderKnowledgeConnectReportMarkdown,
  writeKnowledgeReport,
} from "../../src/commands/knowledge/reports.js";
import { filterDocuments, searchDocuments } from "../../src/commands/knowledge/search.js";
import { parseSpecEntries } from "../../src/commands/knowledge/spec-entry.js";
import {
  appendKnowledgeEntry,
  createKnowledgeEntry,
  deleteKnowledgeDocument,
  removeKnowledgeEntry,
  updateKnowledgeEntry,
} from "../../src/commands/knowledge/writer.js";
import { registerKnowledgeCommand } from "../../src/commands/knowledge/index.js";

describe("knowledge store", () => {
  let tmpDir: string | undefined;

  afterEach(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
    tmpDir = undefined;
  });

  function makeTmp(): string {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "devflow-knowledge-"));
    return tmpDir;
  }

  function runKnowledgeCli(cwd: string, args: string[]): string {
    const previousCwd = process.cwd();
    const previousLog = console.log;
    const previousError = console.error;
    const previousExit = process.exit;
    const lines: string[] = [];
    const program = new Command();
    program
      .name("devflow")
      .exitOverride()
      .configureOutput({
        writeOut: (value) => lines.push(value.trimEnd()),
        writeErr: (value) => lines.push(value.trimEnd()),
      });
    console.log = (value?: unknown, ...rest: unknown[]) => {
      lines.push([value, ...rest].map((part) => String(part)).join(" "));
    };
    console.error = (value?: unknown, ...rest: unknown[]) => {
      lines.push([value, ...rest].map((part) => String(part)).join(" "));
    };
    process.exit = ((code?: string | number | null | undefined) => {
      throw new Error(`${lines.join("\n")}\nprocess.exit ${code}`.trim());
    }) as typeof process.exit;
    try {
      process.chdir(cwd);
      registerKnowledgeCommand(program);
      program.parse(["node", "devflow", ...args], { from: "node" });
    } finally {
      console.log = previousLog;
      console.error = previousError;
      process.exit = previousExit;
      process.chdir(previousCwd);
    }
    return lines.filter(Boolean).join("\n");
  }

  it("captures a learning as a spec-entry in .devflow/spec/guides/learnings.md", () => {
    const cwd = makeTmp();
    const result = appendLearning(cwd, {
      insight: "Windows hooks need explicit UTF-8 stdout handling.",
      keywords: ["windows,encoding"],
      task: "05-14-fork-devflow",
      now: new Date("2026-05-26T00:00:00Z"),
      id: "DFL-20260526-test0001",
    });

    expect(path.relative(cwd, result.filePath).replace(/\\/g, "/")).toBe(
      LEARNINGS_RELATIVE_PATH,
    );
    const raw = fs.readFileSync(result.filePath, "utf-8");
    expect(raw).toContain("<spec-entry");
    expect(raw).toContain('id="DFL-20260526-test0001"');
    expect(raw).toContain('task="05-14-fork-devflow"');

    const parsed = parseSpecEntries(raw, result.filePath);
    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries[0]?.attrs.keywords).toEqual([
      "windows",
      "encoding",
    ]);
  });

  it("scans and searches learning entries with keyword-weighted results", () => {
    const cwd = makeTmp();
    appendLearning(cwd, {
      insight: "Session fallback must refuse to guess when multiple windows exist.",
      keywords: ["session", "fallback"],
      now: new Date("2026-05-26T00:00:00Z"),
      id: "DFL-20260526-session1",
    });
    appendLearning(cwd, {
      insight: "Template hash tracking must avoid user-owned runtime files.",
      keywords: ["template", "hash"],
      now: new Date("2026-05-26T00:00:00Z"),
      id: "DFL-20260526-hash0001",
    });

    const scan = scanKnowledge(cwd);
    const hits = searchDocuments(scan.documents, "fallback session", {
      type: "learning",
    });

    expect(hits[0]?.document.id).toBe("DFL-20260526-session1");
    expect(hits[0]?.snippet).toContain("Session fallback");
  });

  it("does not return unrelated spec-entry documents from search base scoring alone", () => {
    const cwd = makeTmp();
    appendLearning(cwd, {
      insight: "Digest reports should be searchable by topic.",
      keywords: ["digest"],
      now: new Date("2026-05-26T00:00:00Z"),
      id: "DFL-20260526-digest02",
    });
    appendLearning(cwd, {
      insight: "Parser conventions are unrelated to digest reports.",
      keywords: ["parser"],
      now: new Date("2026-05-26T00:00:00Z"),
      id: "DFL-20260526-parser02",
    });

    const hits = searchDocuments(scanKnowledge(cwd).documents, "missingtopic", {
      type: "learning",
    });

    expect(hits).toEqual([]);
  });

  it("treats learning type as the entry type, not only the category", () => {
    const cwd = makeTmp();
    appendLearning(cwd, {
      insight: "Non-default categories are still learning entries.",
      category: "gotcha",
      keywords: ["category"],
      now: new Date("2026-05-26T00:00:00Z"),
      id: "DFL-20260526-gotcha01",
    });

    const docs = scanKnowledge(cwd).documents;
    const rows = filterDocuments(docs, {
      type: "learning",
      category: "gotcha",
    });

    expect(rows.map((doc) => doc.id)).toContain("DFL-20260526-gotcha01");
  });

  it("classifies spec, task, and journal documents for semantic type filters", () => {
    const cwd = makeTmp();
    fs.mkdirSync(path.join(cwd, ".devflow", "spec", "backend"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(cwd, ".devflow", "tasks", "05-26-demo"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(cwd, ".devflow", "workspace", "alice"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(cwd, ".devflow", "spec", "backend", "index.md"),
      "# Backend\n\nAuth token rule.",
      "utf-8",
    );
    fs.writeFileSync(
      path.join(cwd, ".devflow", "tasks", "05-26-demo", "prd.md"),
      "# Demo PRD\n\nAuth task detail.",
      "utf-8",
    );
    fs.writeFileSync(
      path.join(cwd, ".devflow", "workspace", "alice", "journal-1.md"),
      "# Journal\n\nAuth journal detail.",
      "utf-8",
    );

    const docs = scanKnowledge(cwd).documents;

    expect(filterDocuments(docs, { type: "spec" }).map((doc) => doc.title)).toContain(
      "Backend",
    );
    expect(filterDocuments(docs, { type: "task" }).map((doc) => doc.title)).toContain(
      "Demo PRD",
    );
    expect(filterDocuments(docs, { type: "journal" }).map((doc) => doc.title)).toContain(
      "Journal",
    );
    expect(searchDocuments(docs, "auth", { type: "spec" })).toHaveLength(1);
  });

  it("adds structured spec entries without breaking top-level spec loading", () => {
    const cwd = makeTmp();

    const addOutput = runKnowledgeCli(cwd, [
      "spec",
      "add",
      "--layer",
      "backend",
      "--file",
      "quality-guidelines.md",
      "--title",
      "Auth Token Rule",
      "--category",
      "quality",
      "--keywords",
      "auth,token",
      "--json",
      "Validate auth tokens before loading user context.",
    ]);

    const filePath = path.join(
      cwd,
      ".devflow",
      "spec",
      "backend",
      "quality-guidelines.md",
    );
    const raw = fs.readFileSync(filePath, "utf-8");
    const docs = scanKnowledge(cwd).documents;
    const specEntries = filterDocuments(docs, {
      type: "spec-entry",
      category: "quality",
    });
    const loadOutput = runKnowledgeCli(cwd, [
      "spec",
      "--category",
      "quality",
      "--keyword",
      "auth",
    ]);

    expect(JSON.parse(addOutput)).toEqual({
      id: "spec-001",
      filePath,
      relativePath: ".devflow/spec/backend/quality-guidelines.md",
    });
    expect(raw).toContain("# Quality Guidelines");
    expect(raw).toContain('type="spec"');
    expect(raw).toContain('category="quality"');
    expect(raw).toContain("Validate auth tokens before loading user context.");
    expect(specEntries.map((doc) => doc.id)).toEqual(["spec-001"]);
    expect(loadOutput).toContain("# Spec Knowledge (1 loaded)");
    expect(loadOutput).toContain("Auth Token Rule");
  });

  it("initializes, lists, and reports status for local spec files", () => {
    const cwd = makeTmp();

    const init = JSON.parse(
      runKnowledgeCli(cwd, ["spec", "init", "--json"]),
    ) as { files: string[] };
    const list = JSON.parse(
      runKnowledgeCli(cwd, ["spec", "list", "--layer", "guides", "--json"]),
    ) as { files: string[] };
    const status = JSON.parse(
      runKnowledgeCli(cwd, ["spec", "status", "--json"]),
    ) as {
      specRoot: string;
      files: number;
      documents: number;
      specEntries: number;
      diagnostics: number;
    };

    expect(init.files).toEqual([".devflow/spec/guides/learnings.md"]);
    expect(list.files).toEqual([".devflow/spec/guides/learnings.md"]);
    expect(status).toMatchObject({
      specRoot: ".devflow/spec",
      files: 1,
      documents: 1,
      specEntries: 0,
      diagnostics: 0,
    });
  });

  it("rejects spec add targets outside .devflow/spec", () => {
    const cwd = makeTmp();

    expect(() =>
      runKnowledgeCli(cwd, [
        "spec",
        "add",
        "--path",
        "../outside.md",
        "--title",
        "Outside",
        "--body",
        "Do not write outside the spec root.",
      ]),
    ).toThrow("target path must stay under .devflow/spec");
    expect(fs.existsSync(path.join(cwd, ".devflow", "outside.md"))).toBe(false);
  });

  it("reports malformed blocks and duplicate spec-entry IDs in health", () => {
    const cwd = makeTmp();
    const learningsPath = path.join(cwd, LEARNINGS_RELATIVE_PATH);
    fs.mkdirSync(path.dirname(learningsPath), { recursive: true });
    fs.writeFileSync(
      learningsPath,
      `<spec-entry id="dup" type="learning" category="learning" keywords="x" source="test" date="2026-05-26">
### One
</spec-entry>

<spec-entry id="dup" type="learning" category="learning" keywords="y" source="test" date="2026-05-26">
### Two
</spec-entry>

<spec-entry id="bad" type="learning">
### Missing close
`,
      "utf-8",
    );

    const health = getKnowledgeHealth(cwd);

    expect(health.duplicateIds).toHaveLength(1);
    expect(health.duplicateIds[0]?.id).toBe("dup");
    expect(health.diagnostics.length).toBeGreaterThan(0);
    expect(health.diagnostics.map((d) => d.message).join("\n")).toContain(
      "missing closing",
    );
  });

  it("reports empty markdown documents and broken local markdown links", () => {
    const cwd = makeTmp();
    const specDir = path.join(cwd, ".devflow", "spec", "guides");
    fs.mkdirSync(specDir, { recursive: true });
    fs.writeFileSync(path.join(specDir, "empty.md"), "# Empty\n", "utf-8");
    fs.writeFileSync(
      path.join(specDir, "links.md"),
      "# Links\n\nSee [missing](./missing.md) and [external](https://example.com).\n",
      "utf-8",
    );

    const health = getKnowledgeHealth(cwd);

    expect(health.emptyDocuments.map((item) => path.basename(item.filePath))).toContain(
      "empty.md",
    );
    expect(health.brokenLinks).toEqual([
      expect.objectContaining({ target: "./missing.md", line: 3 }),
    ]);
  });

  it("builds a graph from related metadata and body wikilinks", () => {
    const cwd = makeTmp();
    fs.mkdirSync(path.join(cwd, ".devflow", "spec", "guides"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(cwd, ".devflow", "spec", "guides", "graph.md"),
      `<spec-entry id="entry-a" type="learning" category="learning" keywords="a" source="test" date="2026-05-26" related="entry-b">
### Entry A

See [[Entry C]] and [[missing-entry]].
</spec-entry>

<spec-entry id="entry-b" type="learning" category="learning" keywords="b" source="test" date="2026-05-26">
### Entry B
</spec-entry>

<spec-entry id="entry-c" type="learning" category="learning" keywords="c" source="test" date="2026-05-26">
### Entry C
</spec-entry>
`,
      "utf-8",
    );

    const docs = scanKnowledge(cwd).documents.filter(
      (doc) => doc.type === "spec-entry",
    );
    const graph = buildKnowledgeGraph(docs);

    expect(graph.forwardLinks["entry-a"]).toEqual(["entry-b", "entry-c"]);
    expect(graph.backlinks["entry-b"]).toEqual(["entry-a"]);
    expect(graph.backlinks["entry-c"]).toEqual(["entry-a"]);
    expect(graph.brokenLinks).toEqual([
      { sourceId: "entry-a", target: "missing-entry" },
    ]);
  });

  it("does not duplicate spec-entry wikilinks through the containing markdown file", () => {
    const cwd = makeTmp();
    fs.mkdirSync(path.join(cwd, ".devflow", "spec", "guides"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(cwd, ".devflow", "spec", "guides", "graph.md"),
      `<spec-entry id="entry-a" type="learning" category="learning" keywords="a" source="test" date="2026-05-26">
### Entry A

See [[Entry B]].
</spec-entry>

<spec-entry id="entry-b" type="learning" category="learning" keywords="b" source="test" date="2026-05-26">
### Entry B
</spec-entry>
`,
      "utf-8",
    );

    const docs = scanKnowledge(cwd).documents;
    const graph = buildKnowledgeGraph(docs);

    expect(graph.backlinks["entry-b"]).toEqual(["entry-a"]);
    expect(graph.forwardLinks["file:.devflow/spec/guides/graph.md"]).toBeUndefined();
    expect(detectKnowledgeOrphans(graph, docs)).toEqual([]);
  });

  it("detects graph orphans, hubs, and graph health", () => {
    const cwd = makeTmp();
    fs.mkdirSync(path.join(cwd, ".devflow", "spec", "guides"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(cwd, ".devflow", "spec", "guides", "graph.md"),
      `<spec-entry id="hub" type="learning" category="learning" keywords="hub" source="test" date="2026-05-26">
### Hub
</spec-entry>

<spec-entry id="linked-one" type="learning" category="learning" keywords="one" source="test" date="2026-05-26" related="hub">
### Linked One
</spec-entry>

<spec-entry id="linked-two" type="learning" category="learning" keywords="two" source="test" date="2026-05-26">
### Linked Two

See [[Hub]].
</spec-entry>

<spec-entry id="orphan" type="learning" category="learning" keywords="orphan" source="test" date="2026-05-26">
### Orphan
</spec-entry>
`,
      "utf-8",
    );

    const docs = scanKnowledge(cwd).documents.filter(
      (doc) => doc.type === "spec-entry",
    );
    const graph = buildKnowledgeGraph(docs);
    const health = computeKnowledgeGraphHealth(graph, docs);

    expect(detectKnowledgeHubs(graph, 1)).toEqual([
      { id: "hub", inDegree: 2 },
    ]);
    expect(detectKnowledgeOrphans(graph, docs)).toEqual(["orphan"]);
    expect(health.totals).toMatchObject({
      entries: 4,
      brokenLinks: 0,
      orphans: 1,
    });
    expect(health.score).toBe(99);
  });

  it("reports stats with connectivity and weekly growth", () => {
    const cwd = makeTmp();
    fs.mkdirSync(path.join(cwd, ".devflow", "spec", "guides"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(cwd, ".devflow", "spec", "guides", "stats.md"),
      `<spec-entry id="hub" type="spec" category="debug" keywords="auth" source="test" date="2026-05-26">
### Hub
</spec-entry>

<spec-entry id="linked-one" type="learning" category="debug" keywords="auth" source="test" date="2026-05-27" related="hub">
### Linked One
</spec-entry>

<spec-entry id="linked-two" type="learning" category="debug" keywords="auth" source="test" date="2026-06-03" related="hub">
### Linked Two
</spec-entry>

<spec-entry id="orphan" type="learning" category="debug" keywords="cache" source="test" date="2026-06-03">
### Orphan
</spec-entry>
`,
      "utf-8",
    );

    const stats = getKnowledgeStats(cwd);

    expect(stats.connectivity).toEqual({
      nodes: 4,
      links: 2,
      brokenLinks: 0,
      orphans: 1,
      averageInDegree: 0.5,
      averageOutDegree: 0.5,
      maxHub: { id: "hub", inDegree: 2 },
    });
    expect(stats.growth.entriesByWeek).toEqual({
      "2026-W22": 2,
      "2026-W23": 2,
    });
  });

  it("suggests orphan rescue links from shared keywords and category", () => {
    const cwd = makeTmp();
    fs.mkdirSync(path.join(cwd, ".devflow", "spec", "guides"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(cwd, ".devflow", "spec", "guides", "connect.md"),
      `<spec-entry id="orphan-auth" type="learning" category="debug" keywords="auth,token" source="test" date="2026-05-26">
### Auth Token Orphan
</spec-entry>

<spec-entry id="spec-auth" type="spec" category="debug" keywords="auth,token,security" source="test" date="2026-05-26">
### Auth Token Spec
</spec-entry>
`,
      "utf-8",
    );

    const result = suggestKnowledgeConnections(scanKnowledge(cwd).documents, {
      max: 5,
    });

    expect(result.suggestions).toContainEqual(
      expect.objectContaining({
        sourceId: "orphan-auth",
        targetId: "spec-auth",
      }),
    );
    expect(result.suggestions[0]?.reasons.join(" ")).toContain("orphan rescue");
    expect(result.projected.score).toBeGreaterThan(result.baseline.score);
  });

  it("suggests missing reverse links for one-way related metadata", () => {
    const cwd = makeTmp();
    fs.mkdirSync(path.join(cwd, ".devflow", "spec", "guides"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(cwd, ".devflow", "spec", "guides", "connect.md"),
      `<spec-entry id="source" type="learning" category="debug" keywords="cache" source="test" date="2026-05-26" related="target">
### Cache Source
</spec-entry>

<spec-entry id="target" type="learning" category="debug" keywords="cache" source="test" date="2026-05-26">
### Cache Target
</spec-entry>
`,
      "utf-8",
    );

    const result = suggestKnowledgeConnections(scanKnowledge(cwd).documents);

    expect(result.suggestions).toContainEqual(
      expect.objectContaining({
        sourceId: "target",
        targetId: "source",
        reasons: expect.arrayContaining(["missing reverse link"]),
      }),
    );
  });

  it("suggests two-hop transitive links when endpoints share a concept", () => {
    const cwd = makeTmp();
    fs.mkdirSync(path.join(cwd, ".devflow", "spec", "guides"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(cwd, ".devflow", "spec", "guides", "connect.md"),
      `<spec-entry id="a" type="learning" category="debug" keywords="retry" source="test" date="2026-05-26" related="b">
### Retry A
</spec-entry>

<spec-entry id="b" type="learning" category="debug" keywords="middle" source="test" date="2026-05-26" related="c">
### Middle B
</spec-entry>

<spec-entry id="c" type="learning" category="debug" keywords="retry" source="test" date="2026-05-26">
### Retry C
</spec-entry>
`,
      "utf-8",
    );

    const result = suggestKnowledgeConnections(scanKnowledge(cwd).documents);

    expect(result.suggestions).toContainEqual(
      expect.objectContaining({
        sourceId: "a",
        targetId: "c",
        reasons: expect.arrayContaining(["two-hop transitive link"]),
      }),
    );
  });

  it("suggests type bridges and respects scope filters", () => {
    const cwd = makeTmp();
    fs.mkdirSync(path.join(cwd, ".devflow", "spec", "guides"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(cwd, ".devflow", "spec", "guides", "connect.md"),
      `<spec-entry id="learning-auth" type="learning" category="debug" keywords="auth" source="test" date="2026-05-26">
### Auth Debug Lesson
</spec-entry>

<spec-entry id="spec-auth" type="spec" category="debug" keywords="auth" source="test" date="2026-05-26">
### Auth Debug Spec
</spec-entry>

<spec-entry id="task-auth" type="task" category="debug" keywords="auth" source="test" date="2026-05-26">
### Auth Debug Task
</spec-entry>
`,
      "utf-8",
    );

    const all = suggestKnowledgeConnections(scanKnowledge(cwd).documents);
    const scoped = suggestKnowledgeConnections(scanKnowledge(cwd).documents, {
      scope: "learning",
    });

    expect(all.suggestions).toContainEqual(
      expect.objectContaining({
        sourceId: "learning-auth",
        targetId: "spec-auth",
        reasons: expect.arrayContaining(["type bridge"]),
      }),
    );
    expect(scoped.suggestions).toEqual([]);
  });

  it("applies related links to structured spec-entry sources", () => {
    const cwd = makeTmp();
    const filePath = path.join(cwd, ".devflow", "spec", "guides", "connect.md");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      `<spec-entry id="source" type="learning" category="debug" keywords="cache" source="test" date="2026-05-26">
### Cache Source
</spec-entry>

<spec-entry id="target" type="learning" category="debug" keywords="cache" source="test" date="2026-05-26">
### Cache Target
</spec-entry>
`,
      "utf-8",
    );

    const result = applyRelatedLinks(cwd, [
      { sourceId: "source", targetId: "target" },
    ]);
    const parsed = parseSpecEntries(fs.readFileSync(filePath, "utf-8"), filePath);

    expect(result.applied).toEqual([
      expect.objectContaining({ sourceId: "source", targetId: "target" }),
    ]);
    expect(result.skipped).toEqual([]);
    expect(parsed.entries.find((entry) => entry.attrs.id === "source")?.attrs.related).toBe(
      "target",
    );
  });

  it("skips duplicate and missing related link writes", () => {
    const cwd = makeTmp();
    const filePath = path.join(cwd, ".devflow", "spec", "guides", "connect.md");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      `<spec-entry id="source" type="learning" category="debug" keywords="cache" source="test" date="2026-05-26" related="target">
### Cache Source
</spec-entry>

<spec-entry id="target" type="learning" category="debug" keywords="cache" source="test" date="2026-05-26">
### Cache Target
</spec-entry>
`,
      "utf-8",
    );

    const result = applyRelatedLinks(cwd, [
      { sourceId: "source", targetId: "target" },
      { sourceId: "source", targetId: "missing" },
      { sourceId: "missing", targetId: "target" },
    ]);

    expect(result.applied).toEqual([]);
    expect(result.skipped).toEqual([
      { sourceId: "source", targetId: "target", reason: "link already exists" },
      { sourceId: "source", targetId: "missing", reason: "target entry not found" },
      {
        sourceId: "missing",
        targetId: "target",
        reason: "source is not a structured spec-entry",
      },
    ]);
  });

  it("plans cleanup issues for broken related links, wikilinks, orphans, empty bodies, and stale drafts", () => {
    const cwd = makeTmp();
    const filePath = path.join(cwd, ".devflow", "spec", "guides", "cleanup.md");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      `<spec-entry id="broken-related" type="learning" category="debug" keywords="cleanup" source="test" date="2026-05-26" related="missing-entry">
### Broken Related
</spec-entry>

<spec-entry id="broken-wikilink" type="learning" category="debug" keywords="cleanup" source="test" date="2026-05-26">
### Broken Wikilink

See [[missing-wiki]].
</spec-entry>

<spec-entry id="orphan-entry" type="learning" category="debug" keywords="orphan" source="test" date="2026-05-26">
### Orphan Entry
</spec-entry>

<spec-entry id="empty-entry" type="learning" category="debug" keywords="empty" source="test" date="2026-05-26">
</spec-entry>

<spec-entry id="draft-entry" type="draft" category="draft" keywords="draft" source="test" date="2026-01-01">
### Old Draft
</spec-entry>

<spec-entry id="status-draft-entry" type="learning" category="debug" keywords="draft" source="test" date="2026-01-01" status="draft">
### Old Status Draft
</spec-entry>
`,
      "utf-8",
    );

    const plan = planKnowledgeCleanup(scanKnowledge(cwd).documents, {
      now: new Date("2026-05-26T00:00:00Z"),
      staleDays: 90,
    });

    expect(plan.counts["broken-related"]).toBe(1);
    expect(plan.counts["broken-wikilink"]).toBe(1);
    expect(plan.counts.orphan).toBeGreaterThan(0);
    expect(plan.counts["empty-body"]).toBe(1);
    expect(plan.counts["stale-draft"]).toBe(2);
    expect(plan.fixableBrokenRelated).toEqual([
      { sourceId: "broken-related", target: "missing-entry" },
    ]);
    expect(
      plan.issues.find((issue) => issue.kind === "broken-wikilink")?.fixable,
    ).toBe(false);
  });

  it("removes broken structured related links without touching body wikilinks", () => {
    const cwd = makeTmp();
    const filePath = path.join(cwd, ".devflow", "spec", "guides", "cleanup.md");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      `<spec-entry id="source" type="learning" category="debug" keywords="cleanup" source="test" date="2026-05-26" related="missing,target">
### Source

See [[missing-wiki]].
</spec-entry>

<spec-entry id="target" type="learning" category="debug" keywords="cleanup" source="test" date="2026-05-26">
### Target
</spec-entry>
`,
      "utf-8",
    );

    const result = removeRelatedLinks(cwd, [
      { sourceId: "source", target: "missing" },
    ]);
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = parseSpecEntries(raw, filePath);
    const source = parsed.entries.find((entry) => entry.attrs.id === "source");

    expect(result.removed).toEqual([
      expect.objectContaining({ sourceId: "source", target: "missing" }),
    ]);
    expect(result.skipped).toEqual([]);
    expect(source?.attrs.related).toBe("target");
    expect(raw).toContain("[[missing-wiki]]");
  });

  it("creates a topic-scoped digest with themes, gaps, and unlinked insights", () => {
    const cwd = makeTmp();
    const filePath = path.join(cwd, ".devflow", "spec", "guides", "digest.md");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      `<spec-entry id="spec-auth" type="spec" category="security" keywords="auth,token" source="test" date="2026-05-26">
### Auth Token Spec

Auth tokens need validation.
</spec-entry>

<spec-entry id="learning-auth" type="learning" category="debug" keywords="auth,token" source="test" date="2026-05-26">
### Auth Token Learning

TODO: connect this lesson after the implementation settles.
</spec-entry>

<spec-entry id="cache-note" type="learning" category="performance" keywords="cache" source="test" date="2026-05-26">
### Cache Note

Cache behavior is unrelated.
</spec-entry>
`,
      "utf-8",
    );

    const digest = createKnowledgeDigest(scanKnowledge(cwd).documents, {
      topic: "auth",
      now: new Date("2026-05-26T00:00:00Z"),
    });

    expect(digest.scope).toBe("auth");
    expect(digest.entries).toBe(2);
    expect(digest.themes.map((theme) => theme.name)).toContain("Auth");
    expect(digest.gaps.map((gap) => gap.kind)).toEqual(
      expect.arrayContaining(["orphan", "todo-marker"]),
    );
    expect(digest.unlinkedInsights.map((entry) => entry.id)).toContain(
      "learning-auth",
    );
    expect(digest.heatmap.learning.Auth).toBe(1);
    expect(digest.heatmap.spec.Auth).toBe(1);
  });

  it("renders and writes digest reports to task research paths", () => {
    const cwd = makeTmp();
    appendLearning(cwd, {
      insight: "Digest reports should persist synthesis into task research.",
      keywords: ["digest", "report"],
      now: new Date("2026-05-26T00:00:00Z"),
      id: "DFL-20260526-digest01",
    });
    const digest = createKnowledgeDigest(scanKnowledge(cwd).documents, {
      topic: "digest",
      now: new Date("2026-05-26T00:00:00Z"),
    });
    const reportPath = defaultDigestReportPath("05-14-fork-devflow", digest);

    expect(digest.entries).toBe(1);
    expect(digest.themes.flatMap((theme) => theme.entries).map((entry) => entry.id)).not.toContain(
      "file:.devflow/spec/guides/learnings.md",
    );
    expect(reportPath).toBe(
      ".devflow/tasks/05-14-fork-devflow/research/knowledge-digest-digest-2026-05-26.md",
    );
    const result = writeKnowledgeDigestReport(cwd, digest, reportPath ?? "");
    const markdown = fs.readFileSync(result.filePath, "utf-8");

    expect(result.relativePath).toBe(reportPath);
    expect(markdown).toBe(renderKnowledgeDigestMarkdown(digest));
    expect(markdown).toContain("# Knowledge Digest: digest");
    expect(markdown).toContain("## Coverage Heatmap");
    expect(markdown).toContain("## Recommended Actions");
  });

  it("creates structured knowledge-gap issues from digest gaps once", () => {
    const cwd = makeTmp();
    const filePath = path.join(cwd, ".devflow", "spec", "guides", "digest.md");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      `<spec-entry id="learning-auth" type="learning" category="debug" keywords="auth,token" source="test" date="2026-05-26">
### Auth Token Learning

TODO: connect this lesson after the implementation settles.
</spec-entry>
`,
      "utf-8",
    );
    const digest = createKnowledgeDigest(scanKnowledge(cwd).documents, {
      topic: "auth",
      now: new Date("2026-05-26T00:00:00Z"),
    });

    const first = createKnowledgeDigestIssues(cwd, digest);
    const second = createKnowledgeDigestIssues(cwd, digest);
    const docs = scanKnowledge(cwd).documents;
    const rescannedDigest = createKnowledgeDigest(docs, {
      topic: "auth",
      now: new Date("2026-05-26T00:00:00Z"),
    });
    const afterRescan = createKnowledgeDigestIssues(cwd, rescannedDigest);
    const finalDocs = scanKnowledge(cwd).documents;

    expect(first.created.length).toBeGreaterThan(0);
    expect(first.created[0]?.id).toMatch(/^issue-knowledge-gap-auth-/);
    expect(first.created[0]?.relativePath).toMatch(
      /^\.devflow\/spec\/wiki\/issue\/knowledge-gap-auth-/,
    );
    expect(second.created).toEqual([]);
    expect(second.skipped.length).toBe(first.created.length);
    expect(docs.filter((doc) => doc.entryType === "issue")).toHaveLength(
      first.created.length,
    );
    expect(rescannedDigest.themes.flatMap((theme) => theme.entries).map((entry) => entry.id)).not.toEqual(
      expect.arrayContaining(first.created.map((item) => item.id)),
    );
    expect(afterRescan.created).toEqual([]);
    expect(afterRescan.skipped.length).toBe(first.created.length);
    expect(finalDocs.filter((doc) => doc.entryType === "issue")).toHaveLength(
      first.created.length,
    );
  });

  it("keeps generated digest learnings searchable but out of future digest input", () => {
    const cwd = makeTmp();
    appendLearning(cwd, {
      insight: "Auth token implementation lessons should be synthesized.",
      keywords: ["auth", "token"],
      source: "manual",
      now: new Date("2026-05-26T00:00:00Z"),
      id: "DFL-20260526-auth0001",
    });
    appendLearning(cwd, {
      insight: "Wiki digest synthesized auth token knowledge.",
      keywords: ["wiki-digest", "auth"],
      source: "wiki-digest",
      now: new Date("2026-05-26T00:00:00Z"),
      id: "DFL-20260526-digestmeta",
    });

    const docs = scanKnowledge(cwd).documents;
    const digest = createKnowledgeDigest(docs, {
      topic: "auth",
      now: new Date("2026-05-26T00:00:00Z"),
    });
    const searchIds = searchDocuments(docs, "digest synthesized", {
      type: "learning",
    }).map((hit) => hit.document.id);

    expect(searchIds).toContain("DFL-20260526-digestmeta");
    expect(digest.entries).toBe(1);
    expect(digest.themes.flatMap((theme) => theme.entries).map((entry) => entry.id)).toEqual([
      "DFL-20260526-auth0001",
    ]);
  });

  it("renders and writes connection reports to task research paths", () => {
    const cwd = makeTmp();
    fs.mkdirSync(path.join(cwd, ".devflow", "spec", "guides"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(cwd, ".devflow", "spec", "guides", "connect.md"),
      `<spec-entry id="orphan-auth" type="learning" category="debug" keywords="auth,token" source="test" date="2026-05-26">
### Auth Token Orphan
</spec-entry>

<spec-entry id="spec-auth" type="spec" category="debug" keywords="auth,token,security" source="test" date="2026-05-26">
### Auth Token Spec
</spec-entry>
`,
      "utf-8",
    );
    const result = suggestKnowledgeConnections(scanKnowledge(cwd).documents, {
      max: 5,
    });
    const reportPath = defaultKnowledgeReportPath(
      "05-14-fork-devflow",
      "knowledge-connections",
      "all knowledge",
      "2026-05-26T00:00:00.000Z",
    );
    const markdown = renderKnowledgeConnectReportMarkdown({
      result,
      generatedAt: "2026-05-26T00:00:00.000Z",
    });
    const write = writeKnowledgeReport(cwd, reportPath ?? "", markdown);

    expect(reportPath).toBe(
      ".devflow/tasks/05-14-fork-devflow/research/knowledge-connections-all-knowledge-2026-05-26.md",
    );
    expect(write.relativePath).toBe(reportPath);
    expect(fs.readFileSync(write.filePath, "utf-8")).toBe(markdown);
    expect(markdown).toContain("# Knowledge Connection Report: all knowledge");
    expect(markdown).toContain("## Suggestions");
    expect(markdown).toContain("orphan-auth");
  });

  it("renders and writes cleanup reports with before and after counts", () => {
    const cwd = makeTmp();
    const filePath = path.join(cwd, ".devflow", "spec", "guides", "cleanup.md");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      `<spec-entry id="source" type="learning" category="debug" keywords="cleanup" source="test" date="2026-05-26" related="missing,target">
### Source
</spec-entry>

<spec-entry id="target" type="learning" category="debug" keywords="cleanup" source="test" date="2026-05-26">
### Target
</spec-entry>
`,
      "utf-8",
    );
    const plan = planKnowledgeCleanup(scanKnowledge(cwd).documents);
    const fix = removeRelatedLinks(cwd, plan.fixableBrokenRelated);
    const afterFix = planKnowledgeCleanup(scanKnowledge(cwd).documents);
    const markdown = renderKnowledgeCleanupReportMarkdown({
      plan,
      fix,
      afterFix,
      generatedAt: "2026-05-26T00:00:00.000Z",
      scope: "debug",
    });
    const reportPath = defaultKnowledgeReportPath(
      "05-14-fork-devflow",
      "knowledge-cleanup",
      "debug",
      "2026-05-26T00:00:00.000Z",
    );
    const write = writeKnowledgeReport(cwd, reportPath ?? "", markdown);

    expect(reportPath).toBe(
      ".devflow/tasks/05-14-fork-devflow/research/knowledge-cleanup-debug-2026-05-26.md",
    );
    expect(write.relativePath).toBe(reportPath);
    expect(fs.readFileSync(write.filePath, "utf-8")).toBe(markdown);
    expect(markdown).toContain("# Knowledge Cleanup Report: debug");
    expect(markdown).toContain("broken-related");
    expect(markdown).toContain("Removed: 1");
  });

  it("creates, updates, appends, and removes structured knowledge entries safely", () => {
    const cwd = makeTmp();
    const created = createKnowledgeEntry(cwd, {
      type: "note",
      slug: "auth-token",
      title: "Auth Token Note",
      body: "Initial auth body.",
      category: "debug",
      keywords: ["auth,token"],
      source: "test",
      now: new Date("2026-05-26T00:00:00Z"),
    });

    expect(created.id).toBe("note-auth-token");
    expect(created.relativePath).toBe(".devflow/spec/wiki/note/auth-token.md");
    expect(scanKnowledge(cwd).documents.map((doc) => doc.id)).toContain(
      "note-auth-token",
    );

    const updated = updateKnowledgeEntry(cwd, "note-auth-token", {
      title: "Updated Auth Token Note",
      body: "Updated body.",
      status: "draft",
      related: ["entry-001"],
    });
    const updatedRaw = fs.readFileSync(updated.filePath, "utf-8");

    expect(updatedRaw).toContain("### Updated Auth Token Note");
    expect(updatedRaw).toContain('status="draft"');
    expect(updatedRaw).toContain('related="entry-001"');

    const appended = appendKnowledgeEntry(cwd, "note-auth-token", {
      type: "entry",
      title: "Child Entry",
      body: "Child body.",
      category: "debug",
      keywords: ["child"],
      source: "test",
      now: new Date("2026-05-26T00:00:00Z"),
    });

    expect(appended.id).toBe("entry-002");
    expect(scanKnowledge(cwd).documents.map((doc) => doc.id)).toContain(
      "entry-002",
    );

    const removed = removeKnowledgeEntry(cwd, "entry-002");
    const afterRemove = fs.readFileSync(removed.filePath, "utf-8");

    expect(afterRemove).not.toContain('id="entry-002"');

    const deleted = deleteKnowledgeDocument(cwd, "note-auth-token");

    expect(deleted.relativePath).toBe(".devflow/spec/wiki/note/auth-token.md");
    expect(fs.existsSync(deleted.filePath)).toBe(false);
  });

  it("stores knowhow-style extended attrs in structured wiki entries", () => {
    const cwd = makeTmp();
    const created = createKnowledgeEntry(cwd, {
      type: "knowhow",
      slug: "rcp-auth-setup",
      title: "Auth Setup Recipe",
      body: "Use this when wiring auth middleware.",
      category: "recipe",
      keywords: ["recipe", "auth"],
      source: "knowhow",
      attrs: {
        tool: "true",
        spec_category: "coding",
        code_paths: ["src/auth.ts", "src/middleware.ts"],
      },
      now: new Date("2026-05-26T00:00:00Z"),
    });

    const docs = scanKnowledge(cwd).documents;
    const doc = docs.find((item) => item.id === created.id);
    const knowhowRows = filterDocuments(docs, { type: "knowhow" });
    const hits = searchDocuments(docs, "middleware", { type: "knowhow" });
    const toolRows = JSON.parse(
      runKnowledgeCli(cwd, [
        "wiki",
        "list",
        "--tool",
        "--category",
        "coding",
        "--json",
      ]),
    ) as { entries: { id: string }[] };
    const specRows = JSON.parse(
      runKnowledgeCli(cwd, [
        "spec",
        "--category",
        "coding",
        "--keyword",
        "auth",
        "--json",
      ]),
    ) as { entries: { id: string; entryType?: string }[] };

    expect(created.id).toBe("knowhow-rcp-auth-setup");
    expect(created.relativePath).toBe(".devflow/spec/wiki/knowhow/rcp-auth-setup.md");
    expect(doc?.entryType).toBe("knowhow");
    expect(doc?.category).toBe("recipe");
    expect(doc?.attrs?.tool).toBe("true");
    expect(doc?.attrs?.spec_category).toBe("coding");
    expect(doc?.attrs?.code_paths).toEqual(["src/auth.ts", "src/middleware.ts"]);
    expect(knowhowRows.map((item) => item.id)).toEqual(["knowhow-rcp-auth-setup"]);
    expect(hits.map((hit) => hit.document.id)).toEqual(["knowhow-rcp-auth-setup"]);
    expect(toolRows.entries.map((item) => item.id)).toEqual([
      "knowhow-rcp-auth-setup",
    ]);
    expect(specRows.entries.map((item) => item.id)).toEqual([
      "knowhow-rcp-auth-setup",
    ]);
    expect(specRows.entries[0]?.entryType).toBe("knowhow");
  });

  it("refuses to delete arbitrary markdown outside the generated wiki area", () => {
    const cwd = makeTmp();
    const filePath = path.join(cwd, ".devflow", "spec", "guides", "manual.md");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "# Manual\n\nUser-owned spec content.", "utf-8");

    expect(() => deleteKnowledgeDocument(cwd, "file:.devflow/spec/guides/manual.md")).toThrow(
      "refusing to delete markdown outside .devflow/spec/wiki",
    );
    expect(fs.existsSync(filePath)).toBe(true);
  });
});
