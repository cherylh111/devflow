import { describe, expect, it } from "vitest";
import {
  SHARED_HOOKS_BY_PLATFORM,
  getSharedHookScripts,
  getSharedHookScriptsForPlatform,
  type SharedHookPlatform,
} from "../../src/templates/shared-hooks/index.js";

describe("shared-hooks capability table", () => {
  it("every capability-table entry names a real shared-hook file", () => {
    const realFiles = new Set(getSharedHookScripts().map((h) => h.name));
    for (const [platform, hooks] of Object.entries(
      SHARED_HOOKS_BY_PLATFORM,
    )) {
      for (const hook of hooks) {
        expect(
          realFiles.has(hook),
          `${platform} declares ${hook} but no such file exists under shared-hooks/`,
        ).toBe(true);
      }
    }
  });

  it("every platform in the table is a valid SharedHookPlatform", () => {
    const platforms = Object.keys(SHARED_HOOKS_BY_PLATFORM);
    expect(platforms).toContain("claude");
    expect(platforms).toContain("qoder");
    expect(platforms).toContain("codebuddy");
    expect(platforms.length).toBe(3);
  });

  it("claude gets session-start, inject-workflow-state, and inject-subagent-context", () => {
    const hooks = [...SHARED_HOOKS_BY_PLATFORM.claude];
    expect(hooks).toContain("session-start.py");
    expect(hooks).toContain("inject-workflow-state.py");
    expect(hooks).toContain("inject-subagent-context.py");
  });

  it("getSharedHookScriptsForPlatform returns exactly the declared set per platform", () => {
    for (const platform of Object.keys(
      SHARED_HOOKS_BY_PLATFORM,
    ) as SharedHookPlatform[]) {
      const names = getSharedHookScriptsForPlatform(platform)
        .map((h) => h.name)
        .sort();
      const declared = [...SHARED_HOOKS_BY_PLATFORM[platform]].sort();
      expect(names).toEqual(declared);
    }
  });
});
