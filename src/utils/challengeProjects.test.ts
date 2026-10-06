import { describe, expect, it } from "vitest";
import type { ProjectItem } from "../types/projects";
import { normalizeProjectName, pickChallengeProjects } from "./challengeProjects";

function makeProject(id: number, name: string): ProjectItem {
  return {
    id,
    name,
    description: `${name} description`,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };
}

describe("normalizeProjectName", () => {
  it("ignores case, punctuation and spacing", () => {
    expect(normalizeProjectName("  Thaura.AI ")).toBe("thauraai");
    expect(normalizeProjectName("Tribe-X")).toBe("tribex");
    expect(normalizeProjectName("Migrate Off  Vercel")).toBe("migrateoffvercel");
  });
});

describe("pickChallengeProjects", () => {
  const projects = [
    makeProject(1, "Spotify Export"),
    makeProject(2, "Thaura"),
    makeProject(3, "Unrelated Project"),
    makeProject(4, "UpScrolled"),
  ];

  it("returns matches in the order of the wanted list, not the source list", () => {
    const picked = pickChallengeProjects(projects, [
      { name: "UpScrolled" },
      { name: "Spotify Export" },
    ]);
    expect(picked.map((p) => p.id)).toEqual([4, 1]);
  });

  it("matches on an alias when the ProjectHub name differs", () => {
    const picked = pickChallengeProjects(projects, [{ name: "Thaura.ai", aliases: ["Thaura"] }]);
    expect(picked.map((p) => p.id)).toEqual([2]);
  });

  it("skips wanted projects that ProjectHub does not have", () => {
    const picked = pickChallengeProjects(projects, [
      { name: "Boycott Shopify" },
      { name: "UpScrolled" },
    ]);
    expect(picked.map((p) => p.id)).toEqual([4]);
  });

  it("does not match on a partial name", () => {
    const picked = pickChallengeProjects(projects, [{ name: "Spotify" }]);
    expect(picked).toEqual([]);
  });

  it("never returns the same project twice", () => {
    const picked = pickChallengeProjects(projects, [
      { name: "Thaura" },
      { name: "Thaura.ai", aliases: ["Thaura"] },
    ]);
    expect(picked.map((p) => p.id)).toEqual([2]);
  });

  it("returns an empty list when there are no projects", () => {
    expect(pickChallengeProjects([], [{ name: "UpScrolled" }])).toEqual([]);
  });
});
