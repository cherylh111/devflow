import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { Command } from "commander";

import { PATHS } from "../../constants/paths.js";
import { parseKeywordCsv } from "./spec-entry.js";
import {
  buildKnowledgeGraph,
  computeKnowledgeGraphHealth,
  detectKnowledgeHubs,
  detectKnowledgeOrphans,
} from "./graph.js";
import {
  suggestKnowledgeConnections,
  type KnowledgeConnectResult,
} from "./connect.js";
import { planKnowledgeCleanup } from "./cleanup.js";
import {
  createKnowledgeDigestIssues,
  createKnowledgeDigest,
  defaultDigestReportPath,
  writeKnowledgeDigestReport,
} from "./digest.js";
import {
  defaultKnowledgeReportPath,
  renderKnowledgeCleanupReportMarkdown,
  renderKnowledgeConnectReportMarkdown,
  writeKnowledgeReport,
} from "./reports.js";
import {
  applyRelatedLinks,
  appendLearning,
  ensureLearningStore,
  getKnowledgeHealth,
  getKnowledgeStats,
  LEARNINGS_RELATIVE_PATH,
  removeRelatedLinks,
  scanKnowledge,
  type KnowledgeDocument,
  type KnowledgeRelatedLinkApplyResult,
} from "./store.js";
import { filterDocuments, searchDocuments } from "./search.js";
import type { KnowledgeQueryType } from "./search.js";
import {
  appendKnowledgeEntry,
  createKnowledgeEntry,
  deleteKnowledgeDocument,
  removeKnowledgeEntry,
  updateKnowledgeEntry,
} from "./writer.js";

interface LearnOptions {
  category?: string;
  keywords?: string;
  source?: string;
  task?: string | boolean;
  package?: string;
  layer?: string;
  confidence?: string;
  limit?: string;
  json?: boolean;
}

interface ListOptions {
  category?: string;
  keyword?: string;
  type?: KnowledgeQueryType;
  tool?: boolean;
  limit?: string;
  json?: boolean;
}

type SearchOptions = ListOptions;

interface SpecsOptions {
  package?: string;
  layer?: string;
  category?: string;
  keyword?: string;
  tool?: boolean;
  limit?: string;
  json?: boolean;
}

interface SpecAddOptions {
  path?: string;
  package?: string;
  layer?: string;
  file?: string;
  category?: string;
  title: string;
  body?: string;
  bodyFile?: string;
  keywords?: string;
  source?: string;
  status?: string;
  related?: string;
  json?: boolean;
}

interface SpecInitOptions {
  json?: boolean;
}

interface SpecListOptions {
  package?: string;
  layer?: string;
  json?: boolean;
}

interface SpecStatusOptions {
  json?: boolean;
}

interface ShowOptions {
  json?: boolean;
}

interface LoadOptions {
  json?: boolean;
}

interface HealthOptions {
  json?: boolean;
}

interface StatsOptions {
  json?: boolean;
}

interface HubsOptions {
  limit?: string;
  json?: boolean;
}

interface ConnectOptions {
  scope?: string;
  minSimilarity?: string;
  max?: string;
  dryRun?: boolean;
  fix?: boolean;
  report?: string | boolean;
  learn?: boolean;
  json?: boolean;
}

interface CleanupOptions {
  type?: string;
  staleDays?: string;
  fix?: boolean;
  report?: string | boolean;
  json?: boolean;
}

interface DigestOptions {
  type?: string;
  recent?: string;
  format?: string;
  maxThemes?: string;
  createIssues?: boolean;
  report?: string | boolean;
  learn?: boolean;
  json?: boolean;
}

interface CreateOptions {
  type: string;
  slug: string;
  title: string;
  body?: string;
  bodyFile?: string;
  category?: string;
  keywords?: string;
  source?: string;
  status?: string;
  parent?: string;
  related?: string;
  json?: boolean;
}

interface UpdateOptions {
  title?: string;
  body?: string;
  bodyFile?: string;
  category?: string;
  keywords?: string;
  source?: string;
  status?: string;
  parent?: string;
  related?: string;
  json?: boolean;
}

interface AppendOptions {
  type?: string;
  title: string;
  body?: string;
  bodyFile?: string;
  category?: string;
  keywords?: string;
  source?: string;
  status?: string;
  json?: boolean;
}

interface RemoveOptions {
  json?: boolean;
}

interface KnowhowAddOptions {
  type: string;
  slug?: string;
  title: string;
  body?: string;
  bodyFile?: string;
  keywords?: string;
  lang?: string;
  sourceRef?: string;
  status?: string;
  assetType?: string;
  codePaths?: string;
  tool?: boolean;
  category?: string;
  related?: string;
  json?: boolean;
}

interface KnowhowListOptions {
  type?: string;
  keyword?: string;
  limit?: string;
  json?: boolean;
}

interface KnowhowSearchOptions {
  type?: string;
  limit?: string;
  json?: boolean;
}

interface KnowhowGetOptions {
  json?: boolean;
}

interface RecordedLearning {
  id: string;
  relativePath: string;
}

const KNOWHOW_TYPES = [
  "session",
  "tip",
  "template",
  "recipe",
  "reference",
  "decision",
  "asset",
  "blueprint",
  "document",
] as const;

const KNOWHOW_PREFIX_BY_TYPE: Record<string, string> = {
  session: "knw",
  tip: "tip",
  template: "tpl",
  recipe: "rcp",
  reference: "ref",
  decision: "dcs",
  asset: "ast",
  blueprint: "blp",
  document: "doc",
};

export function registerKnowledgeCommand(program: Command): void {
  const knowledge = program
    .command("knowledge")
    .alias("wiki")
    .description("Capture, list, search, and inspect local DevFlow knowledge");

  registerLearnCommand(knowledge);
  registerSpecsCommand(knowledge);
  registerKnowhowCommand(program);

  program
    .command("learn <insight...>")
    .description("Capture a reusable learning into .devflow/spec/guides/learnings.md")
    .option("--category <name>", "Learning category")
    .option("--keywords <csv>", "Comma-separated keywords")
    .option("--source <name>", "Source label")
    .option("--task [ref]", "Attach a task ref; use --task current to resolve active task")
    .option("--package <name>", "Related package")
    .option("--layer <name>", "Related layer")
    .option("--confidence <value>", "Confidence label")
    .option("--limit <n>", "List/search row limit", "20")
    .option("--json", "Output JSON")
    .action(runLearnCommand);

  const specCommand = addSpecsOptions(
    program.command("spec").description("Load DevFlow spec knowledge by filters"),
  );
  specCommand.action(runSpecsCommand);
  registerSpecManagementCommands(specCommand);
  registerSpecAddCommand(specCommand);

  knowledge
    .command("list")
    .alias("ls")
    .description("List structured knowledge entries")
    .option("--category <name>", "Filter by category")
    .option("--keyword <word>", "Filter by exact keyword")
    .option("--type <type>", "learning|knowhow|spec|task|journal|spec-entry|markdown")
    .option("--tool", "Filter knowhow tool specs")
    .option("--limit <n>", "Maximum rows", "20")
    .option("--json", "Output JSON")
    .action((options: ListOptions) => {
      const cwd = process.cwd();
      const limit = parseLimit(options.limit);
      const rows = filterDocuments(scanKnowledge(cwd).documents, {
        category: options.tool ? undefined : options.category,
        keyword: options.keyword,
        type: options.type,
      })
        .filter((doc) => matchesToolFilter(doc, options.tool))
        .filter((doc) => matchesKnowledgeCategory(doc, options.category))
        .filter((doc) => doc.type === "spec-entry")
        .slice(0, limit);
      outputRows(cwd, rows, options.json);
    });

  knowledge
    .command("search <query...>")
    .description("Search specs, task artifacts, journals, and learning entries")
    .option("--category <name>", "Filter by category")
    .option("--keyword <word>", "Filter by exact keyword")
    .option("--type <type>", "learning|knowhow|spec|task|journal|spec-entry|markdown")
    .option("--tool", "Filter knowhow tool specs")
    .option("--limit <n>", "Maximum rows", "20")
    .option("--json", "Output JSON")
    .action((queryParts: string[], options: SearchOptions) => {
      const cwd = process.cwd();
      const query = queryParts.join(" ").trim();
      if (!query) die("usage: knowledge search <query>");
      const searchable = scanKnowledge(cwd).documents.filter((doc) =>
        matchesToolFilter(doc, options.tool),
      ).filter((doc) => matchesKnowledgeCategory(doc, options.category));
      const hits = searchDocuments(searchable, query, {
        category: options.tool ? undefined : options.category,
        keyword: options.keyword,
        type: options.type,
        limit: parseLimit(options.limit),
      });
      if (options.json) {
        console.log(JSON.stringify({ hits }, null, 2));
        return;
      }
      if (hits.length === 0) {
        console.log("(no matches)");
        return;
      }
      for (const hit of hits) {
        const doc = hit.document;
        console.log(
          `[${hit.score}] ${doc.id}  ${doc.title}  ${doc.relativePath}:${doc.line}`,
        );
        if (hit.snippet) console.log(`  ${hit.snippet}`);
      }
    });

  function registerSpecsCommand(parent: Command): void {
    addSpecsOptions(
      parent
        .command("specs")
        .description(
          "Load spec knowledge by package, layer, category, or keyword",
        ),
    ).action(runSpecsCommand);
  }

  addSpecsOptions(
    program.command("specs").description("Load DevFlow spec knowledge by filters"),
  ).action(runSpecsCommand);

  knowledge
    .command("show <id>")
    .alias("get")
    .description("Show a knowledge entry by id")
    .option("--json", "Output JSON")
    .action((id: string, options: ShowOptions) => {
      const cwd = process.cwd();
      const doc = scanKnowledge(cwd).documents.find((item) => item.id === id);
      if (!doc) die(`knowledge entry not found: ${id}`);
      if (options.json) {
        console.log(JSON.stringify({ document: doc }, null, 2));
        return;
      }
      console.log(`${doc.id}  [${doc.category ?? doc.type}]`);
      console.log(`Title: ${doc.title}`);
      console.log(`Path: ${doc.relativePath}:${doc.line}`);
      if (doc.keywords.length > 0) {
        console.log(`Keywords: ${doc.keywords.join(", ")}`);
      }
      console.log("");
      console.log(doc.body);
    });

  knowledge
    .command("load <ids...>")
    .description("Load one or more knowledge entries by id")
    .option("--json", "Output JSON")
    .action((ids: string[], options: LoadOptions) => {
      const cwd = process.cwd();
      const docs = scanKnowledge(cwd).documents;
      const byId = new Map(docs.map((doc) => [doc.id, doc]));
      const found = ids.flatMap((id) => {
        const doc = byId.get(id);
        return doc ? [doc] : [];
      });
      const missing = ids.filter((id) => !byId.has(id));
      if (options.json) {
        console.log(JSON.stringify({ entries: found, missing }, null, 2));
        return;
      }
      for (const id of missing) {
        console.error(chalk.yellow(`warning: not found: ${id}`));
      }
      if (found.length === 0) {
        die("no entries found for requested ids");
      }
      console.log(`# Knowledge Documents (${found.length} loaded)`);
      for (const doc of found) {
        console.log(`\n---\n\n## [${doc.category ?? doc.type}] ${doc.title}`);
        console.log(`\nSource: ${doc.relativePath}:${doc.line}\n`);
        console.log(doc.body);
      }
    });

  knowledge
    .command("create")
    .description("Create a structured local knowledge entry under .devflow/spec/wiki")
    .requiredOption("--type <type>", "Entry type, e.g. spec, learning, note")
    .requiredOption("--slug <slug>", "Kebab-case slug")
    .requiredOption("--title <title>", "Entry title")
    .option("--body <text>", "Inline body text")
    .option("--body-file <path>", "Read body text from a file")
    .option("--category <name>", "Entry category")
    .option("--keywords <csv>", "Comma-separated keywords")
    .option("--source <name>", "Source label")
    .option("--status <name>", "Entry status")
    .option("--parent <id>", "Parent knowledge id")
    .option("--related <csv>", "Comma-separated related ids")
    .option("--json", "Output JSON")
    .action((options: CreateOptions) => {
      const cwd = process.cwd();
      const result = withKnowledgeWrite(() =>
        createKnowledgeEntry(cwd, {
          type: options.type,
          slug: options.slug,
          title: options.title,
          body: readBodyOption(cwd, options.body, options.bodyFile),
          category: options.category,
          keywords: parseKeywordCsv(options.keywords),
          source: options.source,
          status: options.status,
          parent: options.parent,
          related: parseKeywordCsv(options.related),
        }),
      );
      outputWriteResult("Created", result, options.json);
    });

  knowledge
    .command("update <id>")
    .description("Update a structured local knowledge entry")
    .option("--title <title>", "New title")
    .option("--body <text>", "New body text")
    .option("--body-file <path>", "Read new body text from a file")
    .option("--category <name>", "Entry category")
    .option("--keywords <csv>", "Comma-separated keywords")
    .option("--source <name>", "Source label")
    .option("--status <name>", "Entry status")
    .option("--parent <id>", "Parent knowledge id")
    .option("--related <csv>", "Comma-separated related ids")
    .option("--json", "Output JSON")
    .action((id: string, options: UpdateOptions) => {
      const cwd = process.cwd();
      const result = withKnowledgeWrite(() =>
        updateKnowledgeEntry(cwd, id, {
          title: options.title,
          body:
            options.body !== undefined || options.bodyFile !== undefined
              ? readBodyOption(cwd, options.body, options.bodyFile)
              : undefined,
          category: options.category,
          keywords: options.keywords !== undefined ? parseKeywordCsv(options.keywords) : undefined,
          source: options.source,
          status: options.status,
          parent: options.parent,
          related: options.related !== undefined ? parseKeywordCsv(options.related) : undefined,
        }),
      );
      outputWriteResult("Updated", result, options.json);
    });

  knowledge
    .command("delete <id>")
    .alias("rm")
    .description("Delete a generated knowledge document or remove a structured entry")
    .option("--json", "Output JSON")
    .action((id: string, options: RemoveOptions) => {
      const cwd = process.cwd();
      const result = withKnowledgeWrite(() => deleteKnowledgeDocument(cwd, id));
      outputWriteResult("Deleted", result, options.json);
    });

  knowledge
    .command("append <container-id>")
    .description("Append a structured <spec-entry> to a markdown knowledge container")
    .option("--type <type>", "Entry type", "entry")
    .requiredOption("--title <title>", "Entry title")
    .option("--body <text>", "Inline body text")
    .option("--body-file <path>", "Read body text from a file")
    .option("--category <name>", "Entry category")
    .option("--keywords <csv>", "Comma-separated keywords")
    .option("--source <name>", "Source label", "manual")
    .option("--status <name>", "Entry status")
    .option("--json", "Output JSON")
    .action((containerId: string, options: AppendOptions) => {
      const cwd = process.cwd();
      const result = withKnowledgeWrite(() =>
        appendKnowledgeEntry(cwd, containerId, {
          type: options.type,
          title: options.title,
          body: readBodyOption(cwd, options.body, options.bodyFile),
          category: options.category,
          keywords: parseKeywordCsv(options.keywords),
          source: options.source,
          status: options.status,
        }),
      );
      outputWriteResult("Appended", result, options.json);
    });

  knowledge
    .command("remove-entry <id>")
    .description("Remove a structured <spec-entry> by id")
    .option("--json", "Output JSON")
    .action((id: string, options: RemoveOptions) => {
      const cwd = process.cwd();
      const result = withKnowledgeWrite(() => removeKnowledgeEntry(cwd, id));
      outputWriteResult("Removed", result, options.json);
    });
  function addSpecsOptions(command: Command): Command {
    return command
      .option("--package <name>", "Package spec directory name")
      .option("--layer <name>", "Layer directory name, e.g. backend or frontend")
      .option("--category <name>", "Filter structured entries by category")
      .option("--keyword <word>", "Filter structured entries by exact keyword")
      .option("--tool", "Include only tool-spec knowhow entries")
      .option("--limit <n>", "Maximum rows", "20")
      .option("--json", "Output JSON");
  }

  knowledge
    .command("health")
    .description("Check malformed spec entries and duplicate ids")
    .option("--json", "Output JSON")
    .action((options: HealthOptions) => {
      const cwd = process.cwd();
      const health = getKnowledgeHealth(cwd);
      if (options.json) {
        console.log(JSON.stringify(health, null, 2));
        return;
      }
      console.log(`Documents: ${health.documents}`);
      console.log(`Spec entries: ${health.specEntries}`);
      console.log(`Diagnostics: ${health.diagnostics.length}`);
      console.log(`Duplicate IDs: ${health.duplicateIds.length}`);
      console.log(`Empty docs: ${health.emptyDocuments.length}`);
      console.log(`Broken links: ${health.brokenLinks.length}`);
      for (const diagnostic of health.diagnostics) {
        console.log(
          `warning: ${relative(cwd, diagnostic.filePath)}:${diagnostic.line} ${diagnostic.message}`,
        );
      }
      for (const duplicate of health.duplicateIds) {
        const locations = duplicate.locations
          .map((loc) => `${relative(cwd, loc.filePath)}:${loc.line}`)
          .join(", ");
        console.log(`warning: duplicate id ${duplicate.id} at ${locations}`);
      }
      for (const empty of health.emptyDocuments) {
        console.log(`warning: empty document ${relative(cwd, empty.filePath)}`);
      }
      for (const link of health.brokenLinks) {
        console.log(
          `warning: broken link ${relative(cwd, link.filePath)}:${link.line} -> ${link.target}`,
        );
      }
    });

  knowledge
    .command("graph")
    .description("Dump local knowledge graph forward links, backlinks, and unresolved wikilinks")
    .action(() => {
      const docs = scanKnowledge(process.cwd()).documents;
      console.log(JSON.stringify(buildKnowledgeGraph(docs), null, 2));
    });

  knowledge
    .command("orphans")
    .description("List knowledge documents with no incoming or outgoing graph links")
    .option("--json", "Output JSON")
    .action((options: { json?: boolean }) => {
      const cwd = process.cwd();
      const docs = scanKnowledge(cwd).documents;
      const graph = buildKnowledgeGraph(docs);
      const ids = detectKnowledgeOrphans(graph, docs);
      const entries = docs.filter((doc) => ids.includes(doc.id));
      if (options.json) {
        console.log(JSON.stringify({ orphans: entries }, null, 2));
        return;
      }
      console.log(`Orphans: ${entries.length}`);
      for (const entry of entries) {
        console.log(
          `  [${entry.category ?? entry.collection}] ${entry.id}  ${entry.title}`,
        );
      }
    });

  knowledge
    .command("hubs")
    .description("List top knowledge graph hubs by incoming link count")
    .option("--limit <n>", "Maximum rows", "10")
    .option("--json", "Output JSON")
    .action((options: HubsOptions) => {
      const docs = scanKnowledge(process.cwd()).documents;
      const hubs = detectKnowledgeHubs(
        buildKnowledgeGraph(docs),
        parseLimit(options.limit),
      );
      if (options.json) {
        console.log(JSON.stringify({ hubs }, null, 2));
        return;
      }
      console.log(`Top ${hubs.length} hubs`);
      for (const hub of hubs) {
        console.log(`  ${hub.id}  (in: ${hub.inDegree})`);
      }
    });

  knowledge
    .command("backlinks <id>")
    .description("Show documents linking to this knowledge id or title")
    .option("--json", "Output JSON")
    .action((id: string, options: { json?: boolean }) => {
      outputLinkedDocuments("Backlinks", id, "backlinks", options.json);
    });

  knowledge
    .command("forward <id>")
    .description("Show documents this knowledge id or title links to")
    .option("--json", "Output JSON")
    .action((id: string, options: { json?: boolean }) => {
      outputLinkedDocuments("Forward links", id, "forward", options.json);
    });

  knowledge
    .command("graph-health")
    .description("Show graph connectivity health score")
    .option("--json", "Output JSON")
    .action((options: { json?: boolean }) => {
      const docs = scanKnowledge(process.cwd()).documents;
      const health = computeKnowledgeGraphHealth(buildKnowledgeGraph(docs), docs);
      if (options.json) {
        console.log(JSON.stringify(health, null, 2));
        return;
      }
      console.log(`Health Score: ${health.score}/100`);
      console.log(`  Entries:        ${health.totals.entries}`);
      console.log(`  Broken links:   ${health.totals.brokenLinks}`);
      console.log(`  Orphans:        ${health.totals.orphans}`);
      console.log(`  Missing titles: ${health.totals.missingTitles}`);
    });

  knowledge
    .command("connect")
    .description("Suggest related links that would improve local knowledge graph connectivity")
    .option("--scope <type>", "Limit to collection, entry type, category, or document shape")
    .option("--min-similarity <n>", "Minimum score from 0.0 to 1.0", "0.3")
    .option("--max <n>", "Maximum suggestions", "20")
    .option("--dry-run", "Preview suggestions without changing files", true)
    .option("--fix", "Apply suggested related metadata to structured spec-entry sources")
    .option("--report [path]", "Write a markdown report; defaults to the active task research dir")
    .option("--learn", "Record a reusable meta-learning about this connection pass")
    .option("--json", "Output JSON")
    .action((options: ConnectOptions) => {
      const cwd = process.cwd();
      const generatedAt = new Date().toISOString();
      const result = suggestKnowledgeConnections(scanKnowledge(cwd).documents, {
        scope: options.scope,
        minSimilarity: parseRatio(options.minSimilarity, 0.3),
        max: parseLimit(options.max),
      });
      const applyResult = options.fix
        ? applyRelatedLinks(
            cwd,
            result.suggestions.map((suggestion) => ({
              sourceId: suggestion.sourceId,
              targetId: suggestion.targetId,
            })),
          )
        : undefined;
      const reportPath = resolveKnowledgeReportPath(
        cwd,
        options.report,
        "knowledge-connections",
        options.scope ?? "all knowledge",
        generatedAt,
      );
      const report = reportPath
        ? writeKnowledgeReport(
            cwd,
            reportPath,
            renderKnowledgeConnectReportMarkdown({
              result,
              apply: applyResult,
              generatedAt,
              scope: options.scope,
            }),
          )
        : undefined;
      const learning = options.learn
        ? recordConnectLearning(cwd, result, applyResult, options.scope)
        : undefined;
      if (options.json) {
        console.log(JSON.stringify({ ...result, apply: applyResult, report, learning }, null, 2));
        return;
      }
      console.log("== Knowledge Connection Suggestions ==");
      console.log(
        `Baseline health: ${result.baseline.score}/100 | Orphans: ${result.baseline.totals.orphans} | Broken links: ${result.baseline.totals.brokenLinks}`,
      );
      console.log(
        `Projected health: ${result.projected.score}/100 (${signedDelta(result.projected.score - result.baseline.score)})`,
      );
      if (result.suggestions.length === 0) {
        console.log("(no suggestions)");
        if (report) {
          console.log("");
          console.log(`Report: ${report.relativePath}`);
        }
        if (learning) {
          console.log(`Learning: ${learning.id}`);
        }
        return;
      }
      console.log("");
      console.log("#  Score  Source -> Target  Reason");
      result.suggestions.forEach((suggestion, index) => {
        console.log(
          `${index + 1}. ${suggestion.score.toFixed(3)}  ${suggestion.sourceId} -> ${suggestion.targetId}  ${suggestion.reasons.join(" + ")}`,
        );
      });
      console.log("");
      if (applyResult) {
        console.log(
          `Applied: ${applyResult.applied.length} | Skipped: ${applyResult.skipped.length}`,
        );
        for (const skipped of applyResult.skipped) {
          console.log(
            `skipped: ${skipped.sourceId} -> ${skipped.targetId}: ${skipped.reason}`,
          );
        }
      } else {
        console.log("Dry run only. Re-run with --fix to apply structured related links.");
      }
      if (report) {
        console.log("");
        console.log(`Report: ${report.relativePath}`);
      }
      if (learning) {
        console.log(`Learning: ${learning.id}`);
      }
    });

  knowledge
    .command("cleanup")
    .description("Find knowledge graph cleanup issues and optionally remove broken related metadata")
    .option("--type <type>", "Limit to collection, entry type, category, or document shape")
    .option("--stale-days <n>", "Age threshold for stale draft entries", "90")
    .option("--fix", "Remove broken related metadata from structured spec-entry sources")
    .option("--report [path]", "Write a markdown report; defaults to the active task research dir")
    .option("--json", "Output JSON")
    .action((options: CleanupOptions) => {
      const cwd = process.cwd();
      const generatedAt = new Date().toISOString();
      const docs = filterKnowledgeByScope(scanKnowledge(cwd).documents, options.type);
      const plan = planKnowledgeCleanup(docs, {
        staleDays: parseLimit(options.staleDays),
      });
      const fix = options.fix
        ? removeRelatedLinks(cwd, plan.fixableBrokenRelated)
        : undefined;
      const afterFix = fix
        ? planKnowledgeCleanup(filterKnowledgeByScope(scanKnowledge(cwd).documents, options.type), {
            staleDays: parseLimit(options.staleDays),
          })
        : undefined;
      const reportPath = resolveKnowledgeReportPath(
        cwd,
        options.report,
        "knowledge-cleanup",
        options.type ?? "all knowledge",
        generatedAt,
      );
      const report = reportPath
        ? writeKnowledgeReport(
            cwd,
            reportPath,
            renderKnowledgeCleanupReportMarkdown({
              plan,
              fix,
              afterFix,
              generatedAt,
              scope: options.type,
            }),
          )
        : undefined;

      if (options.json) {
        console.log(JSON.stringify({ plan, fix, afterFix, report }, null, 2));
        return;
      }

      console.log("== Knowledge Cleanup ==");
      console.log(
        `Health: ${plan.baseline.score}/100 | Entries: ${plan.baseline.totals.entries} | Issues: ${plan.issues.length}`,
      );
      console.log(
        `Broken related: ${plan.counts["broken-related"]} | Broken wikilinks: ${plan.counts["broken-wikilink"]} | Orphans: ${plan.counts.orphan} | Empty: ${plan.counts["empty-body"]} | Stale drafts: ${plan.counts["stale-draft"]}`,
      );
      if (plan.issues.length === 0) {
        console.log("(no cleanup issues)");
        if (report) {
          console.log("");
          console.log(`Report: ${report.relativePath}`);
        }
        return;
      }
      for (const issue of plan.issues) {
        const target = issue.target ? ` -> ${issue.target}` : "";
        const suffix = issue.fixable ? " [fixable]" : "";
        console.log(
          `${issue.kind}: ${issue.id}${target} ${relative(cwd, issue.filePath)}:${issue.line}${suffix}`,
        );
      }
      if (fix) {
        console.log("");
        console.log(`Removed: ${fix.removed.length} | Skipped: ${fix.skipped.length}`);
        for (const skipped of fix.skipped) {
          console.log(`skipped: ${skipped.sourceId} -> ${skipped.target}: ${skipped.reason}`);
        }
        if (afterFix) {
          console.log(`Post-fix issues: ${afterFix.issues.length}`);
        }
      } else {
        console.log("");
        console.log("Dry run only. Re-run with --fix to remove broken structured related metadata.");
      }
      if (report) {
        console.log("");
        console.log(`Report: ${report.relativePath}`);
      }
    });

  knowledge
    .command("digest [topic...]")
    .description("Synthesize local knowledge into themes, gaps, and recommended actions")
    .option("--type <type>", "Limit to collection, entry type, category, or document shape")
    .option("--recent <days>", "Only include entries updated within this many days")
    .option("--format <mode>", "brief|full", "brief")
    .option("--max-themes <n>", "Maximum primary themes before grouping overflow", "5")
    .option("--create-issues", "Create structured knowledge-gap issue entries")
    .option("--report [path]", "Write a markdown report; defaults to the active task research dir")
    .option("--learn", "Record a reusable meta-learning about this digest")
    .option("--json", "Output JSON")
    .action((topicParts: string[], options: DigestOptions) => {
      const cwd = process.cwd();
      const topic = topicParts.join(" ").trim() || undefined;
      const digest = createKnowledgeDigest(scanKnowledge(cwd).documents, {
        topic,
        type: options.type,
        recentDays: parseOptionalLimit(options.recent),
        format: parseDigestFormat(options.format),
        maxThemes: parseLimit(options.maxThemes),
      });
      const reportPath = resolveDigestReportPath(cwd, options.report, digest);
      const report = reportPath
        ? writeKnowledgeDigestReport(cwd, digest, reportPath)
        : undefined;
      const issues = options.createIssues
        ? createKnowledgeDigestIssues(cwd, digest)
        : undefined;
      const learning = options.learn
        ? recordDigestLearning(cwd, digest)
        : undefined;

      if (options.json) {
        console.log(JSON.stringify({ digest, report, issues, learning }, null, 2));
        return;
      }

      console.log("== Knowledge Digest ==");
      console.log(
        `Scope: ${digest.scope} | Entries: ${digest.entries} | Health: ${digest.health}/100`,
      );
      console.log(`Themes: ${digest.themes.length} | Gaps: ${digest.gaps.length}`);
      for (const theme of digest.themes) {
        console.log(
          `- ${theme.name}: ${theme.entries.length} entries, health ${theme.health}/100`,
        );
      }
      if (digest.recommendedActions.length > 0) {
        console.log("");
        console.log("Recommended actions:");
        digest.recommendedActions.forEach((action, index) => {
          console.log(`${index + 1}. ${action}`);
        });
      }
      if (report) {
        console.log("");
        console.log(`Report: ${report.relativePath}`);
      }
      if (issues) {
        console.log(
          `Issues: ${issues.created.length} created | ${issues.skipped.length} skipped`,
        );
      }
      if (learning) {
        console.log(`Learning: ${learning.id}`);
      }
    });

  knowledge
    .command("stats")
    .description("Show local knowledge index statistics")
    .option("--json", "Output JSON")
    .action((options: StatsOptions) => {
      const stats = getKnowledgeStats(process.cwd());
      if (options.json) {
        console.log(JSON.stringify(stats, null, 2));
        return;
      }
      console.log(`Documents: ${stats.documents}`);
      console.log(`Spec entries: ${stats.specEntries}`);
      console.log("By type:");
      for (const [type, count] of Object.entries(stats.byType)) {
        console.log(`  ${type}: ${count}`);
      }
      console.log("By category:");
      for (const [category, count] of Object.entries(stats.byCategory)) {
        console.log(`  ${category}: ${count}`);
      }
      if (stats.topKeywords.length > 0) {
        console.log("Top keywords:");
        for (const item of stats.topKeywords) {
          console.log(`  ${item.keyword}: ${item.count}`);
        }
      }
      console.log("Connectivity:");
      console.log(`  Nodes: ${stats.connectivity.nodes}`);
      console.log(`  Links: ${stats.connectivity.links}`);
      console.log(`  Broken links: ${stats.connectivity.brokenLinks}`);
      console.log(`  Orphans: ${stats.connectivity.orphans}`);
      console.log(`  Average in-degree: ${stats.connectivity.averageInDegree}`);
      console.log(`  Average out-degree: ${stats.connectivity.averageOutDegree}`);
      console.log(
        `  Max hub: ${
          stats.connectivity.maxHub
            ? `${stats.connectivity.maxHub.id} (${stats.connectivity.maxHub.inDegree})`
            : "none"
        }`,
      );
      console.log("Growth:");
      for (const [week, count] of Object.entries(stats.growth.entriesByWeek)) {
        console.log(`  ${week}: ${count}`);
      }
    });
}

function outputLinkedDocuments(
  label: string,
  id: string,
  direction: "backlinks" | "forward",
  json: boolean | undefined,
): void {
  const cwd = process.cwd();
  const docs = scanKnowledge(cwd).documents;
  const graph = buildKnowledgeGraph(docs);
  const resolvedId = resolveDocumentId(docs, id);
  if (!resolvedId) die(`knowledge entry not found: ${id}`);
  const linkedIds =
    direction === "backlinks"
      ? graph.backlinks[resolvedId] ?? []
      : graph.forwardLinks[resolvedId] ?? [];
  const byId = new Map(docs.map((doc) => [doc.id, doc]));
  const entries = linkedIds.flatMap((linkedId) => {
    const doc = byId.get(linkedId);
    return doc ? [doc] : [];
  });

  if (json) {
    console.log(JSON.stringify({ id: resolvedId, entries }, null, 2));
    return;
  }
  console.log(`${label} for ${resolvedId}: ${entries.length}`);
  for (const entry of entries) {
    console.log(`  ${entry.id}  ${entry.title}  ${entry.relativePath}:${entry.line}`);
  }
}

function resolveDocumentId(
  docs: readonly KnowledgeDocument[],
  idOrTitle: string,
): string | undefined {
  const exact = docs.find((doc) => doc.id === idOrTitle);
  if (exact) return exact.id;
  const byTitle = docs.find(
    (doc) => doc.title.toLowerCase() === idOrTitle.toLowerCase(),
  );
  return byTitle?.id;
}

function filterKnowledgeByScope(
  docs: readonly KnowledgeDocument[],
  scope: string | undefined,
): KnowledgeDocument[] {
  if (!scope) return [...docs];
  const normalized = scope.toLowerCase();
  return docs.filter(
    (doc) =>
      doc.collection === normalized ||
      doc.type === normalized ||
      doc.entryType?.toLowerCase() === normalized ||
      doc.category?.toLowerCase() === normalized,
  );
}

function runSpecsCommand(options: SpecsOptions): void {
  const cwd = process.cwd();
  const docs = scanKnowledge(cwd).documents
    .filter((doc) => matchesSpecLoadDocument(doc, options))
    .slice(0, parseLimit(options.limit));

  if (options.json) {
    console.log(JSON.stringify({ entries: docs }, null, 2));
    return;
  }
  if (docs.length === 0) {
    console.log("(no spec matches)");
    return;
  }
  console.log(`# Spec Knowledge (${docs.length} loaded)`);
  for (const doc of docs) {
    console.log(`\n---\n\n## [${doc.category ?? doc.type}] ${doc.title}`);
    console.log(`\nSource: ${doc.relativePath}:${doc.line}\n`);
    console.log(doc.body);
  }
}

function registerSpecManagementCommands(command: Command): void {
  command
    .command("init")
    .description("Initialize the local .devflow/spec knowledge scaffold")
    .option("--json", "Output JSON")
    .action((options: SpecInitOptions, subcommand: Command) => {
      const cwd = process.cwd();
      const effectiveOptions = mergeParentOptions(options, subcommand);
      const result = withKnowledgeWrite(() => initializeSpecScaffold(cwd));
      if (effectiveOptions.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      console.log("Initialized spec knowledge scaffold");
      for (const file of result.files) {
        console.log(`  ${file}`);
      }
    });

  command
    .command("list")
    .alias("ls")
    .description("List markdown spec files under .devflow/spec")
    .option("--package <name>", "Package spec directory name")
    .option("--layer <name>", "Layer directory name, e.g. backend or frontend")
    .option("--json", "Output JSON")
    .action((options: SpecListOptions, subcommand: Command) => {
      const cwd = process.cwd();
      const effectiveOptions = mergeParentOptions(options, subcommand);
      const files = listSpecMarkdownFiles(cwd)
        .filter((relativePath) => matchesSpecFilePath(relativePath, effectiveOptions));
      if (effectiveOptions.json) {
        console.log(JSON.stringify({ files }, null, 2));
        return;
      }
      if (files.length === 0) {
        console.log("(no spec files)");
        return;
      }
      for (const file of files) console.log(file);
    });

  command
    .command("status")
    .description("Show local spec knowledge status")
    .option("--json", "Output JSON")
    .action((options: SpecStatusOptions, subcommand: Command) => {
      const cwd = process.cwd();
      const effectiveOptions = mergeParentOptions(options, subcommand);
      const files = listSpecMarkdownFiles(cwd);
      const health = getKnowledgeHealth(cwd);
      const specDocuments = scanKnowledge(cwd).documents.filter(
        (doc) => doc.collection === "spec",
      );
      const status = {
        specRoot: PATHS.SPEC,
        files: files.length,
        documents: specDocuments.length,
        specEntries: specDocuments.filter((doc) => doc.type === "spec-entry").length,
        diagnostics: health.diagnostics.length,
        duplicateIds: health.duplicateIds.length,
        brokenLinks: health.brokenLinks.length,
      };
      if (effectiveOptions.json) {
        console.log(JSON.stringify(status, null, 2));
        return;
      }
      console.log(`Spec root: ${status.specRoot}`);
      console.log(`Files: ${status.files}`);
      console.log(`Documents: ${status.documents}`);
      console.log(`Spec entries: ${status.specEntries}`);
      console.log(`Diagnostics: ${status.diagnostics}`);
      console.log(`Duplicate IDs: ${status.duplicateIds}`);
      console.log(`Broken links: ${status.brokenLinks}`);
    });
}

function mergeParentOptions<T extends {
  package?: string;
  layer?: string;
  json?: boolean;
}>(
  options: T,
  subcommand: Command,
): T {
  const parentOptions = (subcommand.parent?.opts() ?? {}) as Partial<T>;
  return {
    ...options,
    package: options.package ?? parentOptions.package,
    layer: options.layer ?? parentOptions.layer,
    json: options.json ?? parentOptions.json,
  };
}

function initializeSpecScaffold(cwd: string): { files: string[] } {
  const filePath = ensureLearningStore(cwd);
  return { files: [relative(cwd, filePath)] };
}

function listSpecMarkdownFiles(cwd: string): string[] {
  const specRoot = path.join(cwd, PATHS.SPEC);
  const files: string[] = [];
  walkSpecMarkdown(specRoot, files, cwd);
  return files.sort();
}

function walkSpecMarkdown(dir: string, files: string[], cwd: string): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkSpecMarkdown(filePath, files, cwd);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(relative(cwd, filePath));
    }
  }
}

function matchesSpecFilePath(relativePath: string, options: SpecListOptions): boolean {
  const doc: Pick<KnowledgeDocument, "relativePath"> = { relativePath };
  return matchesSpecPath(doc.relativePath, options);
}

function matchesSpecLoadDocument(doc: KnowledgeDocument, options: SpecsOptions): boolean {
  if (options.tool) {
    return (
      isToolSpec(doc) &&
      matchesSpecToolCategory(doc, options.category) &&
      matchesKeyword(doc, options.keyword)
    );
  }
  if (isToolSpec(doc)) {
    return matchesSpecToolCategory(doc, options.category) && matchesKeyword(doc, options.keyword);
  }
  if (doc.collection !== "spec") return false;
  return (
    matchesKnowledgeCategory(doc, options.category) &&
    matchesKeyword(doc, options.keyword) &&
    matchesSpecPath(doc.relativePath, options)
  );
}

function matchesToolFilter(doc: KnowledgeDocument, tool: boolean | undefined): boolean {
  return !tool || isToolSpec(doc);
}

function isToolSpec(doc: KnowledgeDocument): boolean {
  return doc.entryType === "knowhow" && doc.attrs?.tool === "true";
}

function matchesKnowledgeCategory(
  doc: KnowledgeDocument,
  category: string | undefined,
): boolean {
  if (!category) return true;
  const normalized = category.toLowerCase();
  return (
    doc.category?.toLowerCase() === normalized ||
    stringAttr(doc.attrs?.spec_category)?.toLowerCase() === normalized
  );
}

function matchesSpecToolCategory(
  doc: KnowledgeDocument,
  category: string | undefined,
): boolean {
  if (!category) return true;
  return stringAttr(doc.attrs?.spec_category)?.toLowerCase() === category.toLowerCase();
}

function matchesKeyword(doc: KnowledgeDocument, keyword: string | undefined): boolean {
  if (!keyword) return true;
  const normalized = keyword.toLowerCase();
  return doc.keywords.some((value) => value.toLowerCase() === normalized);
}

function stringAttr(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function matchesSpecPath(docPath: string, options: SpecsOptions): boolean {
  const parts = docPath.split("/");
  const specIndex = parts.indexOf("spec");
  if (specIndex === -1) return false;
  const afterSpec = parts.slice(specIndex + 1);
  if (options.package && afterSpec[0] !== options.package) {
    return false;
  }
  if (options.layer) {
    const layerIndex = options.package ? 1 : afterSpec.indexOf(options.layer);
    if (afterSpec[layerIndex] !== options.layer) return false;
  }
  return true;
}

function registerSpecAddCommand(command: Command): void {
  command
    .command("add [body...]")
    .description("Append a structured spec entry to a .devflow/spec markdown file")
    .requiredOption("--title <title>", "Entry title")
    .option("--path <path>", "Target markdown path under .devflow/spec")
    .option("--package <name>", "Package spec directory name")
    .option("--layer <name>", "Layer directory name, e.g. backend or frontend")
    .option("--file <name>", "Spec markdown filename")
    .option("--category <name>", "Entry category", "spec")
    .option("--body <text>", "Inline body text")
    .option("--body-file <path>", "Read body text from a file")
    .option("--keywords <csv>", "Comma-separated keywords")
    .option("--source <name>", "Source label", "spec-add")
    .option("--status <status>", "Entry status")
    .option("--related <csv>", "Comma-separated related knowledge ids")
    .option("--json", "Output JSON")
    .action((bodyParts: string[], options: SpecAddOptions, subcommand: Command) => {
      const cwd = process.cwd();
      const effectiveOptions = mergeSpecAddParentOptions(options, subcommand);
      const body = resolveSpecAddBody(cwd, bodyParts, effectiveOptions);
      if (!body.trim()) die("spec add requires --body, --body-file, or body arguments");
      const target = withKnowledgeWrite(() => ensureSpecAddTarget(cwd, effectiveOptions));
      const result = withKnowledgeWrite(() =>
        appendKnowledgeEntry(cwd, target.containerId, {
          type: "spec",
          title: effectiveOptions.title,
          body,
          category: effectiveOptions.category,
          keywords: parseKeywordCsv(effectiveOptions.keywords),
          source: effectiveOptions.source,
          status: effectiveOptions.status,
          related: parseCsvOption(effectiveOptions.related),
        }),
      );
      outputWriteResult("Added spec entry", result, effectiveOptions.json);
    });
}

function mergeSpecAddParentOptions(
  options: SpecAddOptions,
  subcommand: Command,
): SpecAddOptions {
  const parentOptions = (subcommand.parent?.opts() ?? {}) as Partial<SpecAddOptions>;
  return {
    ...options,
    package: options.package ?? parentOptions.package,
    layer: options.layer ?? parentOptions.layer,
    category:
      parentOptions.category && options.category === "spec"
        ? parentOptions.category
        : options.category ?? parentOptions.category,
    json: options.json ?? parentOptions.json,
  };
}

function resolveSpecAddBody(
  cwd: string,
  bodyParts: readonly string[],
  options: SpecAddOptions,
): string {
  if (bodyParts.length > 0 && (options.body !== undefined || options.bodyFile !== undefined)) {
    die("use body arguments, --body, or --body-file, not more than one");
  }
  if (bodyParts.length > 0) return bodyParts.join(" ");
  return readBodyOption(cwd, options.body, options.bodyFile);
}

function ensureSpecAddTarget(
  cwd: string,
  options: SpecAddOptions,
): { containerId: string; relativePath: string; filePath: string } {
  const relativePath = resolveSpecAddRelativePath(options);
  const filePath = safeSpecMarkdownPath(cwd, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, `# ${titleFromSpecFile(relativePath)}\n`, "utf-8");
  }
  return {
    containerId: `file:${relativePath}`,
    relativePath,
    filePath,
  };
}

function resolveSpecAddRelativePath(options: SpecAddOptions): string {
  if (options.path) {
    const normalized = normalizeSpecRelativeOption(options.path);
    return normalized.startsWith(`${PATHS.SPEC}/`)
      ? normalized
      : `${PATHS.SPEC}/${normalized}`;
  }
  if (options.file) {
    const normalizedFile = normalizeSpecRelativeOption(options.file);
    if (normalizedFile.includes("/")) {
      die("--file must be a markdown filename, not a path; use --path for nested targets");
    }
    const parts: string[] = [PATHS.SPEC];
    if (options.package) parts.push(safeSpecSegment(options.package, "package"));
    if (options.layer) parts.push(safeSpecSegment(options.layer, "layer"));
    if (!options.package && !options.layer) {
      die("spec add with --file requires --layer or --package");
    }
    parts.push(normalizedFile);
    return parts.join("/");
  }
  if (options.category === "learning") return LEARNINGS_RELATIVE_PATH;
  die("spec add requires --path, or --layer/--file; category learning defaults to learnings.md");
}

function normalizeSpecRelativeOption(value: string): string {
  const normalized = value.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized) die("target path is required");
  if (!normalized.endsWith(".md")) die("target path must be a markdown file");
  return normalized;
}

function safeSpecMarkdownPath(cwd: string, relativePath: string): string {
  const specRoot = path.resolve(cwd, PATHS.SPEC);
  const filePath = path.resolve(cwd, relativePath);
  const relativeToSpec = path.relative(specRoot, filePath);
  if (
    relativeToSpec === "" ||
    relativeToSpec.startsWith("..") ||
    path.isAbsolute(relativeToSpec)
  ) {
    throw new Error(`target path must stay under ${PATHS.SPEC}`);
  }
  if (!filePath.endsWith(".md")) {
    throw new Error("target path must be a markdown file");
  }
  return filePath;
}

function safeSpecSegment(value: string, field: string): string {
  const segment = value.trim();
  if (!/^[A-Za-z0-9._-]+$/.test(segment) || segment === "." || segment === "..") {
    die(`${field} must be a safe path segment`);
  }
  return segment;
}

function titleFromSpecFile(relativePath: string): string {
  const basename = path.basename(relativePath, ".md");
  return basename
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Spec";
}

function registerLearnCommand(parent: Command): void {
  parent
    .command("learn <insight...>")
    .description("Capture a reusable learning into .devflow/spec/guides/learnings.md")
    .option("--category <name>", "Learning category")
    .option("--keywords <csv>", "Comma-separated keywords")
    .option("--source <name>", "Source label", "manual")
    .option("--task [ref]", "Attach a task ref; use --task current to resolve active task")
    .option("--package <name>", "Related package")
    .option("--layer <name>", "Related layer")
    .option("--confidence <value>", "Confidence label")
    .option("--limit <n>", "List/search row limit", "20")
    .option("--json", "Output JSON")
    .action(runLearnCommand);
}

function registerKnowhowCommand(program: Command): void {
  const knowhow = program
    .command("knowhow")
    .alias("kh")
    .description("Create, list, search, and load reusable knowhow entries");

  knowhow
    .command("add")
    .description("Create a reusable knowhow entry")
    .requiredOption("--type <type>", "session|tip|template|recipe|reference|decision|asset|blueprint|document")
    .requiredOption("--title <title>", "Entry title")
    .option("--slug <slug>", "Kebab-case slug; generated from type, time, and title when omitted")
    .option("--body <text>", "Inline body text")
    .option("--body-file <path>", "Read body text from a file")
    .option("--keywords <csv>", "Comma-separated keywords")
    .option("--lang <lang>", "Programming language for template entries")
    .option("--source-ref <ref>", "Original source reference for reference entries")
    .option("--status <status>", "Decision status: proposed|accepted|superseded")
    .option("--asset-type <type>", "Asset subtype for asset entries")
    .option("--code-paths <csv>", "Comma-separated code paths for asset or blueprint entries")
    .option("--tool", "Mark this knowhow entry as a tool spec")
    .option("--category <name>", "Consumer/spec category for tool discovery")
    .option("--related <csv>", "Comma-separated related knowledge ids")
    .option("--json", "Output JSON")
    .action((options: KnowhowAddOptions) => {
      const cwd = process.cwd();
      const subtype = normalizeKnowhowType(options.type);
      validateKnowhowOptions(subtype, options);
      if (options.body === undefined && options.bodyFile === undefined) {
        die("knowhow add requires --body or --body-file");
      }
      const body = readBodyOption(cwd, options.body, options.bodyFile);
      const keywords = [
        subtype,
        ...parseKeywordCsv(options.keywords),
      ];
      const slug = options.slug?.trim()
        ? slugToken(options.slug)
        : defaultKnowhowSlug(subtype, options.title);
      const result = withKnowledgeWrite(() =>
        createKnowledgeEntry(cwd, {
          type: "knowhow",
          slug,
          title: options.title,
          body,
          category: subtype,
          keywords,
          source: "knowhow",
          status: options.status,
          related: parseKeywordCsv(options.related),
          attrs: knowhowAttrs(options),
        }),
      );
      outputWriteResult("Created", result, options.json);
    });

  knowhow
    .command("list")
    .alias("ls")
    .description("List knowhow entries")
    .option("--type <type>", "Filter by knowhow subtype")
    .option("--keyword <word>", "Filter by exact keyword")
    .option("--limit <n>", "Maximum rows", "20")
    .option("--json", "Output JSON")
    .action((options: KnowhowListOptions) => {
      const cwd = process.cwd();
      const rows = knowhowDocuments(cwd, options.type, options.keyword)
        .slice(0, parseLimit(options.limit));
      outputRows(cwd, rows, options.json);
    });

  knowhow
    .command("search <query...>")
    .description("Search knowhow entries")
    .option("--type <type>", "Filter by knowhow subtype")
    .option("--limit <n>", "Maximum rows", "20")
    .option("--json", "Output JSON")
    .action((queryParts: string[], options: KnowhowSearchOptions) => {
      const cwd = process.cwd();
      const query = queryParts.join(" ").trim();
      if (!query) die("usage: knowhow search <query>");
      const hits = searchDocuments(
        knowhowDocuments(cwd, options.type),
        query,
        { limit: parseLimit(options.limit) },
      );
      if (options.json) {
        console.log(JSON.stringify({ hits }, null, 2));
        return;
      }
      if (hits.length === 0) {
        console.log("(no matches)");
        return;
      }
      for (const hit of hits) {
        const doc = hit.document;
        console.log(
          `[${hit.score}] ${doc.id}  [${doc.category ?? doc.type}] ${doc.title}  ${relative(cwd, doc.filePath)}:${doc.line}`,
        );
        if (hit.snippet) console.log(`  ${hit.snippet}`);
      }
    });

  const get = (id: string, options: KnowhowGetOptions): void => {
    const cwd = process.cwd();
    const doc = scanKnowledge(cwd).documents.find((item) => item.id === id);
    if (doc?.entryType !== "knowhow") die(`knowhow entry not found: ${id}`);
    if (options.json) {
      console.log(JSON.stringify({ document: doc }, null, 2));
      return;
    }
    console.log(`${doc.id}  [${doc.category ?? doc.type}]`);
    console.log(`Title: ${doc.title}`);
    console.log(`Path: ${relative(cwd, doc.filePath)}:${doc.line}`);
    if (doc.keywords.length > 0) {
      console.log(`Keywords: ${doc.keywords.join(", ")}`);
    }
    if (doc.status) console.log(`Status: ${doc.status}`);
    console.log("");
    console.log(doc.body);
  };

  knowhow
    .command("get <id>")
    .alias("show")
    .description("View a knowhow entry")
    .option("--json", "Output JSON")
    .action(get);
}

function normalizeKnowhowType(value: string): string {
  const normalized = value.toLowerCase().trim();
  if (!KNOWHOW_TYPES.includes(normalized as (typeof KNOWHOW_TYPES)[number])) {
    die(`unknown knowhow type: ${value}. Expected one of: ${KNOWHOW_TYPES.join(", ")}`);
  }
  return normalized;
}

function validateKnowhowOptions(type: string, options: KnowhowAddOptions): void {
  if (options.lang && type !== "template") {
    die("--lang is only valid for knowhow type template");
  }
  if (options.sourceRef && type !== "reference") {
    die("--source-ref is only valid for knowhow type reference");
  }
  if (options.status && type !== "decision") {
    die("--status is only valid for knowhow type decision");
  }
  if (options.assetType && type !== "asset") {
    die("--asset-type is only valid for knowhow type asset");
  }
  if (options.codePaths && type !== "asset" && type !== "blueprint") {
    die("--code-paths is only valid for knowhow type asset or blueprint");
  }
}

function knowhowAttrs(options: KnowhowAddOptions): Record<string, string | string[] | undefined> {
  return {
    lang: options.lang,
    source_ref: options.sourceRef,
    asset_type: options.assetType,
    code_paths: parseKeywordCsv(options.codePaths),
    tool: options.tool ? "true" : undefined,
    spec_category: options.category,
  };
}

function knowhowDocuments(
  cwd: string,
  type: string | undefined,
  keyword?: string,
): KnowledgeDocument[] {
  const subtype = type ? normalizeKnowhowType(type) : undefined;
  return filterDocuments(scanKnowledge(cwd).documents, {
    type: "knowhow",
    category: subtype,
    keyword,
  });
}

function defaultKnowhowSlug(type: string, title: string): string {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    "-",
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");
  return slugToken(`${KNOWHOW_PREFIX_BY_TYPE[type] ?? "knw"}-${stamp}-${title}`);
}

function slugToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "entry";
}

function runLearnCommand(insightParts: string[], options: LearnOptions): void {
  const cwd = process.cwd();
  const mode = insightParts[0]?.toLowerCase();
  if (mode === "list" || mode === "ls") {
    const docs = filterDocuments(scanKnowledge(cwd).documents, {
      type: "learning",
      category: options.category,
      keyword: firstKeyword(options.keywords),
    }).slice(0, parseLimit(options.limit));
    outputRows(cwd, docs, options.json);
    return;
  }
  if (mode === "search") {
    const query = insightParts.slice(1).join(" ").trim();
    if (!query) die("usage: learn search <query>");
    const hits = searchDocuments(scanKnowledge(cwd).documents, query, {
      type: "learning",
      category: options.category,
      keyword: firstKeyword(options.keywords),
      limit: parseLimit(options.limit),
    });
    if (options.json) {
      console.log(JSON.stringify({ hits }, null, 2));
      return;
    }
    if (hits.length === 0) {
      console.log("(no matches)");
      return;
    }
    for (const hit of hits) {
      const doc = hit.document;
      console.log(
        `[${hit.score}] ${doc.id}  [${doc.category ?? doc.type}] ${doc.title}  ${relative(cwd, doc.filePath)}:${doc.line}`,
      );
      if (hit.snippet) console.log(`  ${hit.snippet}`);
    }
    return;
  }
  if (mode === "show") {
    const id = insightParts[1];
    if (!id) die("usage: learn show <id>");
    const doc = scanKnowledge(cwd).documents.find((item) => item.id === id);
    if (doc?.entryType !== "learning") die(`learning not found: ${id}`);
    if (options.json) {
      console.log(JSON.stringify({ document: doc }, null, 2));
      return;
    }
    console.log(`${doc.id}  [${doc.category ?? doc.type}]`);
    console.log(`Title: ${doc.title}`);
    console.log(`Path: ${relative(cwd, doc.filePath)}:${doc.line}`);
    if (doc.keywords.length > 0) {
      console.log(`Keywords: ${doc.keywords.join(", ")}`);
    }
    if (doc.source) console.log(`Source: ${doc.source}`);
    if (doc.date) console.log(`Captured: ${doc.date}`);
    console.log("");
    console.log(doc.body);
    return;
  }

  const isTip = mode === "tip";
  const captureParts = isTip ? insightParts.slice(1) : insightParts;
  const captureInsight = captureParts.join(" ").trim();
  if (!captureInsight) die(isTip ? "usage: learn tip <insight>" : "usage: knowledge learn <insight>");
  const task = resolveTaskOption(cwd, options.task);
  const explicitKeywords = parseKeywordCsv(options.keywords);
  const keywords = isTip
    ? [...new Set(["tip", ...explicitKeywords])]
    : explicitKeywords;
  const category = options.category ?? (isTip ? "tip" : inferLearningCategory(captureInsight));
  const source = options.source ?? (isTip ? "tip" : "manual");
  const confidence = options.confidence ?? (isTip ? "low" : "medium");
  const result = appendLearning(cwd, {
    insight: captureInsight,
    category,
    keywords,
    source,
    task,
    package: options.package,
    layer: options.layer,
    confidence,
  });

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          id: result.id,
          filePath: result.filePath,
          relativePath: relative(cwd, result.filePath),
          attrs: result.entry.attrs,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(chalk.green(`Captured learning: ${result.id}`));
  console.log(`Path: ${relative(cwd, result.filePath)}`);
}

function recordConnectLearning(
  cwd: string,
  result: KnowledgeConnectResult,
  applyResult: KnowledgeRelatedLinkApplyResult | undefined,
  scope: string | undefined,
): RecordedLearning {
  const applied = applyResult?.applied.length ?? 0;
  const skipped = applyResult?.skipped.length ?? 0;
  const healthDelta = result.projected.score - result.baseline.score;
  const topSuggestion = result.suggestions[0];
  const insight = [
    `Wiki connect reviewed ${result.suggestions.length} suggestions for ${scope ?? "all knowledge"}.`,
    `Baseline health ${result.baseline.score}/100, projected health ${result.projected.score}/100 (${signedDelta(healthDelta)}).`,
    `Applied ${applied} structured related links and skipped ${skipped}.`,
    topSuggestion
      ? `Top suggestion: ${topSuggestion.sourceId} -> ${topSuggestion.targetId} (${topSuggestion.reasons.join(", ")}).`
      : "No connection suggestions were found.",
  ].join("\n\n");
  const learning = appendLearning(cwd, {
    insight,
    title: `Wiki connect synthesis for ${scope ?? "all knowledge"}`,
    category: "technique",
    keywords: ["wiki-connect", "knowledge-graph", "connectivity"],
    source: "wiki-connect",
    confidence: "medium",
  });
  return {
    id: learning.id,
    relativePath: relative(cwd, learning.filePath),
  };
}

function recordDigestLearning(
  cwd: string,
  digest: ReturnType<typeof createKnowledgeDigest>,
): RecordedLearning {
  const topTheme = digest.themes[0];
  const gapKinds = [...new Set(digest.gaps.map((gap) => gap.kind))].join(", ") || "none";
  const insight = [
    `Wiki digest synthesized ${digest.entries} entries for ${digest.scope}.`,
    `It found ${digest.themes.length} themes, ${digest.gaps.length} gaps, and health ${digest.health}/100.`,
    topTheme
      ? `Top theme: ${topTheme.name} (${topTheme.entries.length} entries, health ${topTheme.health}/100).`
      : "No themes matched this digest scope.",
    `Gap kinds: ${gapKinds}.`,
  ].join("\n\n");
  const learning = appendLearning(cwd, {
    insight,
    title: `Wiki digest synthesis for ${digest.scope}`,
    category: "technique",
    keywords: ["wiki-digest", "knowledge-synthesis", slugKeyword(digest.scope)],
    source: "wiki-digest",
    confidence: "medium",
    now: new Date(digest.generatedAt),
  });
  return {
    id: learning.id,
    relativePath: relative(cwd, learning.filePath),
  };
}

function inferLearningCategory(insight: string): string {
  const lower = insight.toLowerCase();
  const rules: { category: string; keywords: string[] }[] = [
    {
      category: "antipattern",
      keywords: ["avoid", "don't", "never", "anti-pattern", "antipattern", "bug", "broken", "fails", "wrong"],
    },
    {
      category: "gotcha",
      keywords: ["gotcha", "surprise", "unexpected", "hidden", "easy to miss", "watch out", "footgun"],
    },
    {
      category: "decision",
      keywords: ["decided", "chose", "rationale", "trade-off", "tradeoff", "instead of", "rejected"],
    },
    {
      category: "tool",
      keywords: ["library", "package", "tool", "cli", "framework", "version"],
    },
    {
      category: "pattern",
      keywords: ["pattern", "convention", "always", "should", "use", "prefer", "standardize"],
    },
  ];
  return rules.find((rule) => rule.keywords.some((keyword) => lower.includes(keyword)))?.category ?? "technique";
}

function slugKeyword(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "all-knowledge";
}

function firstKeyword(value: string | undefined): string | undefined {
  return parseKeywordCsv(value)[0];
}

function parseCsvOption(value: string | undefined): string[] | undefined {
  const parsed = parseKeywordCsv(value);
  return parsed.length > 0 ? parsed : undefined;
}

function outputRows(
  cwd: string,
  rows: readonly KnowledgeDocument[],
  json: boolean | undefined,
): void {
  if (json) {
    console.log(JSON.stringify({ entries: rows }, null, 2));
    return;
  }
  if (rows.length === 0) {
    console.log("(no entries)");
    return;
  }
  for (const row of rows) {
    const tags = row.keywords.length > 0 ? `  #${row.keywords.join(",")}` : "";
    console.log(
      `${row.id}  [${row.category ?? row.type}] ${row.title}  ${relative(cwd, row.filePath)}:${row.line}${tags}`,
    );
  }
}

function outputWriteResult(
  verb: string,
  result: { id: string; relativePath: string },
  json: boolean | undefined,
): void {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(`${verb}: ${result.id}`);
  console.log(`Path: ${result.relativePath}`);
}

function withKnowledgeWrite<T>(operation: () => T): T {
  try {
    return operation();
  } catch (error) {
    die(error instanceof Error ? error.message : String(error));
  }
}

function readBodyOption(
  cwd: string,
  body: string | undefined,
  bodyFile: string | undefined,
): string {
  if (bodyFile === undefined) return body ?? "";
  if (body !== undefined) die("use either --body or --body-file, not both");
  const filePath = path.isAbsolute(bodyFile) ? bodyFile : path.join(cwd, bodyFile);
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    die(`body file could not be read: ${bodyFile}`);
  }
}

function resolveTaskOption(
  cwd: string,
  value: string | boolean | undefined,
): string | undefined {
  if (value === undefined || value === false) return undefined;
  if (value === true || value === "current") {
    return resolveCurrentTask(cwd);
  }
  return value;
}

function resolveCurrentTask(cwd: string): string | undefined {
  const runtimeDir = path.join(cwd, PATHS.WORKFLOW, ".runtime", "sessions");
  const explicitKey =
    process.env.DEVFLOW_CONTEXT_ID ?? process.env.TRELLIS_CONTEXT_ID;
  if (explicitKey) {
    const task = readSessionTask(path.join(runtimeDir, `${safeKey(explicitKey)}.json`));
    if (task) return taskName(task);
  }
  let files: string[];
  try {
    files = fs.readdirSync(runtimeDir).filter((file) => file.endsWith(".json"));
  } catch {
    return undefined;
  }
  if (files.length !== 1) return undefined;
  const task = readSessionTask(path.join(runtimeDir, files[0] ?? ""));
  return task ? taskName(task) : undefined;
}

function readSessionTask(filePath: string): string | undefined {
  try {
    const content = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
    const raw = JSON.parse(content) as {
      current_task?: unknown;
    };
    return typeof raw.current_task === "string" ? raw.current_task : undefined;
  } catch {
    return undefined;
  }
}

function taskName(taskRef: string): string {
  return path.basename(taskRef.replace(/\\/g, "/"));
}

function safeKey(raw: string): string {
  return raw.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^[._-]+|[._-]+$/g, "");
}

function relative(cwd: string, filePath: string): string {
  return path.relative(cwd, filePath).replace(/\\/g, "/");
}

function parseLimit(value: string | undefined): number {
  const limit = Number(value ?? 20);
  return Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 20;
}

function parseOptionalLimit(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const limit = Number(value);
  return Number.isFinite(limit) && limit >= 0 ? Math.floor(limit) : undefined;
}

function parseRatio(value: string | undefined, fallback: number): number {
  const ratio = Number(value ?? fallback);
  if (!Number.isFinite(ratio)) return fallback;
  return Math.max(0, Math.min(1, ratio));
}

function parseDigestFormat(value: string | undefined): "brief" | "full" {
  return value === "full" ? "full" : "brief";
}

function resolveDigestReportPath(
  cwd: string,
  value: string | boolean | undefined,
  digest: ReturnType<typeof createKnowledgeDigest>,
): string | undefined {
  if (value === undefined || value === false) return undefined;
  if (typeof value === "string") return value;
  const reportPath = defaultDigestReportPath(resolveCurrentTask(cwd), digest);
  if (!reportPath) die("--report requires an active task or an explicit report path");
  return reportPath;
}

function resolveKnowledgeReportPath(
  cwd: string,
  value: string | boolean | undefined,
  kind: string,
  scope: string,
  generatedAt: string,
): string | undefined {
  if (value === undefined || value === false) return undefined;
  if (typeof value === "string") return value;
  const reportPath = defaultKnowledgeReportPath(
    resolveCurrentTask(cwd),
    kind,
    scope,
    generatedAt,
  );
  if (!reportPath) die("--report requires an active task or an explicit report path");
  return reportPath;
}

function signedDelta(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

function die(message: string): never {
  console.error(chalk.red(`Error: ${message}`));
  process.exit(2);
}
