import { describe, expect, it } from "vitest";
import {
  ALL_MANAGED_DIRS,
  CONFIG_DIRS,
  PLATFORM_IDS,
  PLATFORM_MANAGED_DIRS,
  collectPlatformTemplates,
  getInitToolChoices,
  getPlatformManagedPaths,
  getPlatformsWithPythonHooks,
  isManagedPath,
  isManagedRootDir,
  resolveCliFlag,
} from "../../src/configurators/index.js";
import { AI_TOOLS, type AITool } from "../../src/types/ai-tools.js";

// =============================================================================
// Derived Constants
// =============================================================================

describe("PLATFORM_IDS", () => {
  it("contains all AI_TOOLS keys", () => {
    const aiToolKeys = Object.keys(AI_TOOLS);
    expect(PLATFORM_IDS).toEqual(expect.arrayContaining(aiToolKeys));
    expect(PLATFORM_IDS).toHaveLength(aiToolKeys.length);
  });
});

describe("CONFIG_DIRS", () => {
  it("has same length as PLATFORM_IDS", () => {
    expect(CONFIG_DIRS).toHaveLength(PLATFORM_IDS.length);
  });

  it("maps to AI_TOOLS configDir values in order", () => {
    for (let i = 0; i < PLATFORM_IDS.length; i++) {
      expect(CONFIG_DIRS[i]).toBe(AI_TOOLS[PLATFORM_IDS[i]].configDir);
    }
  });
});

describe("ALL_MANAGED_DIRS", () => {
  it("starts with .devflow", () => {
    expect(ALL_MANAGED_DIRS[0]).toBe(".devflow");
  });

  it("contains .devflow plus all managed dirs", () => {
    expect(ALL_MANAGED_DIRS).toEqual([
      ".devflow",
      ...new Set(PLATFORM_MANAGED_DIRS),
    ]);
  });

  it("has no duplicates", () => {
    const unique = new Set(ALL_MANAGED_DIRS);
    expect(unique.size).toBe(ALL_MANAGED_DIRS.length);
  });
});

// =============================================================================
// isManagedPath — MC/DC + boundary value testing
// =============================================================================

describe("isManagedPath", () => {
  // Positive: sub-path match (startsWith(d + "/") = true, === d = false)
  it("matches platform config sub-paths", () => {
    expect(isManagedPath(".claude/commands/foo.md")).toBe(true);
    expect(isManagedPath(".qoder/commands/bar.md")).toBe(true);
    expect(isManagedPath(".codebuddy/agents/check.md")).toBe(true);
  });

  // Positive: exact match (startsWith(d + "/") = false, === d = true)
  it("matches exact managed directory names", () => {
    expect(isManagedPath(".claude")).toBe(true);
    expect(isManagedPath(".qoder")).toBe(true);
    expect(isManagedPath(".codebuddy")).toBe(true);
    expect(isManagedPath(".devflow")).toBe(true);
  });

  // Positive: .devflow hardcoded paths
  it("matches .devflow sub-paths", () => {
    expect(isManagedPath(".devflow/spec")).toBe(true);
    expect(isManagedPath(".devflow/tasks/some-task")).toBe(true);
  });

  // Boundary: prefix-similar but NOT a sub-path (no / separator after name)
  it("rejects prefix-similar non-sub-paths", () => {
    expect(isManagedPath(".claude-backup")).toBe(false);
    expect(isManagedPath(".devflow-old")).toBe(false);
    expect(isManagedPath(".qoder-backup")).toBe(false);
  });

  // Boundary: empty string
  it("rejects empty string", () => {
    expect(isManagedPath("")).toBe(false);
  });

  // Boundary: path traversal
  it("rejects path traversal", () => {
    expect(isManagedPath("../.claude")).toBe(false);
    expect(isManagedPath("../.devflow/spec")).toBe(false);
  });

  // Boundary: unrelated directories
  it("rejects unrelated directories", () => {
    expect(isManagedPath(".vscode")).toBe(false);
    expect(isManagedPath(".git")).toBe(false);
    expect(isManagedPath("node_modules")).toBe(false);
    expect(isManagedPath("src/configurators")).toBe(false);
  });

  // Windows path separator (bug fix verification)
  it("matches Windows-style backslash paths", () => {
    expect(isManagedPath(".claude\\commands\\foo.md")).toBe(true);
    expect(isManagedPath(".devflow\\spec\\backend")).toBe(true);
    expect(isManagedPath(".qoder\\commands\\bar.md")).toBe(true);
  });

  // Mixed separators
  it("matches mixed separator paths", () => {
    expect(isManagedPath(".claude\\commands/foo.md")).toBe(true);
  });
});

// =============================================================================
// isManagedRootDir
// =============================================================================

describe("isManagedRootDir", () => {
  it("matches all platform config dirs", () => {
    for (const dir of CONFIG_DIRS) {
      expect(isManagedRootDir(dir)).toBe(true);
    }
  });

  it("matches .devflow", () => {
    expect(isManagedRootDir(".devflow")).toBe(true);
  });

  it("matches shared agent skills layer", () => {
    expect(isManagedRootDir(".claude")).toBe(true);
  });

  it("matches qoder config dir", () => {
    expect(isManagedRootDir(".qoder")).toBe(true);
  });

  it("matches codebuddy config dir", () => {
    expect(isManagedRootDir(".codebuddy")).toBe(true);
  });

  it("rejects sub-paths (not a root dir)", () => {
    expect(isManagedRootDir(".claude/commands")).toBe(false);
    expect(isManagedRootDir(".devflow/spec")).toBe(false);
  });

  it("rejects unrelated directories", () => {
    expect(isManagedRootDir(".vscode")).toBe(false);
    expect(isManagedRootDir(".git")).toBe(false);
    expect(isManagedRootDir("src")).toBe(false);
  });
});

// =============================================================================
// resolveCliFlag — boundary value testing
// =============================================================================

describe("resolveCliFlag", () => {
  it("resolves all known flags to correct platform IDs", () => {
    for (const id of PLATFORM_IDS) {
      const flag = AI_TOOLS[id].cliFlag;
      expect(resolveCliFlag(flag)).toBe(id);
    }
  });

  it("returns undefined for unknown flag", () => {
    expect(resolveCliFlag("unknown")).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(resolveCliFlag("")).toBeUndefined();
  });

  it("returns undefined for flag with -- prefix", () => {
    expect(resolveCliFlag("--claude")).toBeUndefined();
    expect(resolveCliFlag("--cursor")).toBeUndefined();
  });

  it("is case-sensitive", () => {
    expect(resolveCliFlag("Claude")).toBeUndefined();
    expect(resolveCliFlag("CLAUDE")).toBeUndefined();
    expect(resolveCliFlag("Cursor")).toBeUndefined();
  });

  it("does not match platform IDs directly (claude-code != claude)", () => {
    // "claude-code" is the AITool ID, "claude" is the cliFlag
    expect(resolveCliFlag("claude-code")).toBeUndefined();
  });
});

// =============================================================================
// getInitToolChoices
// =============================================================================

describe("getInitToolChoices", () => {
  const choices = getInitToolChoices();

  it("returns one entry per platform", () => {
    expect(choices).toHaveLength(PLATFORM_IDS.length);
  });

  it("each entry has required fields", () => {
    for (const choice of choices) {
      expect(choice).toHaveProperty("key");
      expect(choice).toHaveProperty("name");
      expect(choice).toHaveProperty("defaultChecked");
      expect(choice).toHaveProperty("platformId");
      expect(typeof choice.key).toBe("string");
      expect(typeof choice.name).toBe("string");
      expect(typeof choice.defaultChecked).toBe("boolean");
    }
  });

  it("each key roundtrips through resolveCliFlag", () => {
    for (const choice of choices) {
      expect(resolveCliFlag(choice.key)).toBe(choice.platformId);
    }
  });

  it("[CR#3] key is a CliFlag (matches AI_TOOLS cliFlag values)", () => {
    const validFlags = Object.values(AI_TOOLS).map((t) => t.cliFlag);
    for (const choice of choices) {
      expect(validFlags).toContain(choice.key);
    }
  });
});

// =============================================================================
// getPlatformsWithPythonHooks
// =============================================================================

describe("getPlatformsWithPythonHooks", () => {
  const result = getPlatformsWithPythonHooks();

  it("returns only platforms with hasPythonHooks: true", () => {
    for (const id of result) {
      expect(AI_TOOLS[id].hasPythonHooks).toBe(true);
    }
  });

  it("includes all platforms with hasPythonHooks: true", () => {
    const expected = PLATFORM_IDS.filter((id) => AI_TOOLS[id].hasPythonHooks);
    expect(result).toEqual(expected);
  });

  it("returns a subset of PLATFORM_IDS", () => {
    for (const id of result) {
      expect(PLATFORM_IDS).toContain(id);
    }
  });
});

// =============================================================================
// collectPlatformTemplates — path consistency
// =============================================================================

describe("collectPlatformTemplates", () => {
  const SKILL_ROOTS: Record<AITool, string> = {
    "claude-code": ".claude/skills",
    qoder: ".qoder/skills",
    codebuddy: ".codebuddy/skills",
  };

  it("does not throw for any platform", () => {
    for (const id of PLATFORM_IDS) {
      expect(() => collectPlatformTemplates(id)).not.toThrow();
    }
  });

  it("returns Map or undefined for each platform", () => {
    for (const id of PLATFORM_IDS) {
      const result = collectPlatformTemplates(id);
      expect(result === undefined || result instanceof Map).toBe(true);
    }
  });

  it("all returned paths start with platform configDir", () => {
    for (const id of PLATFORM_IDS) {
      const result = collectPlatformTemplates(id);
      if (result) {
        const managedPaths = getPlatformManagedPaths(id);
        for (const [filePath] of result) {
          expect(
            managedPaths.some(
              (managedPath) =>
                filePath === managedPath ||
                filePath.startsWith(managedPath + "/"),
            ),
          ).toBe(true);
        }
      }
    }
  });

  it("platforms with collectTemplates return non-empty Map", () => {
    for (const id of PLATFORM_IDS) {
      const result = collectPlatformTemplates(id);
      if (result !== undefined) {
        expect(result.size).toBeGreaterThan(0);
      }
    }
  });

  it("tracks bundled devflow-meta files for every skill-writing platform", () => {
    for (const [id, skillRoot] of Object.entries(SKILL_ROOTS)) {
      const result = collectPlatformTemplates(id as AITool);
      expect(result, `${id} should have template tracking`).toBeInstanceOf(Map);
      expect(result?.has(`${skillRoot}/devflow-meta/SKILL.md`)).toBe(true);
      expect(
        result?.has(
          `${skillRoot}/devflow-meta/references/local-architecture/overview.md`,
        ),
      ).toBe(true);
    }
  });

  it("tracks auto-run command templates for every command-writing platform", () => {
    const expectedPaths: Record<AITool, string> = {
      "claude-code": ".claude/commands/devflow/auto-run.md",
      qoder: ".qoder/commands/devflow-auto-run.md",
      codebuddy: ".codebuddy/commands/devflow/auto-run.md",
    };

    for (const [id, commandPath] of Object.entries(expectedPaths)) {
      const result = collectPlatformTemplates(id as AITool);
      expect(result, `${id} should have template tracking`).toBeInstanceOf(Map);
      expect(result?.has(commandPath)).toBe(true);
      expect(result?.get(commandPath)).toContain("Auto Run Task Queue");
    }
  });

  // POSIX-key invariant: collector keys feed the cross-platform hash
  // dictionary in `.template-hashes.json`, which must be identical
  // regardless of host OS. Backslash separators (Windows `path.join`)
  // would silently corrupt the hash store and make every file appear
  // "modified" after a cross-OS round-trip.
  it("returned Map keys never contain backslash (POSIX-only)", () => {
    for (const id of PLATFORM_IDS) {
      const result = collectPlatformTemplates(id);
      if (!result) continue;
      for (const [filePath] of result) {
        expect(filePath).not.toMatch(/\\/);
      }
    }
  });
});
