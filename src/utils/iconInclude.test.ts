import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ICON_INCLUDE } from "./iconInclude.mjs";

const SETS = Object.keys(ICON_INCLUDE);
const ICON_NAME = new RegExp(`\\b(${SETS.join("|")}|bi):([a-z0-9-]+)`, "g");
const SOURCE_EXT = /\.(astro|ts|tsx|js|jsx|mjs|svelte)$/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return SOURCE_EXT.test(name) && !name.includes(".test.") ? [path] : [];
  });
}

describe("ICON_INCLUDE", () => {
  it("lists every icon referenced in src/", () => {
    const missing = new Set<string>();
    for (const file of sourceFiles("src")) {
      for (const [, set, icon] of readFileSync(file, "utf8").matchAll(ICON_NAME)) {
        if (!ICON_INCLUDE[set]?.includes(icon)) missing.add(`${set}:${icon} (${file})`);
      }
    }
    expect([...missing]).toEqual([]);
  });

  // Loads every installed icon set (tens of MB of JSON), which can outrun
  // the default 5s timeout when the whole suite runs in parallel.
  it("only names icons that exist in their installed sets", { timeout: 30_000 }, async () => {
    for (const [set, icons] of Object.entries(ICON_INCLUDE)) {
      const { icons: available } = (await import(`@iconify-json/${set}/icons.json`)).default;
      expect(
        icons.filter((icon) => !(icon in available)),
        set
      ).toEqual([]);
    }
  });
});
