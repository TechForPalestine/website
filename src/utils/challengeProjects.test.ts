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

describe("pickChallengeProjects with a fallback", () => {
  const fallback = {
    pitch: "Independent news, by subscription.",
    websiteUrl: "https://example.org",
  };

  it("builds a card from the fallback when ProjectHub doesn't list the project", () => {
    const [card] = pickChallengeProjects([], [{ name: "Bulletin", fallback }]);
    expect(card).toMatchObject({
      name: "Bulletin",
      elevatorPitch: fallback.pitch,
      websiteUrl: fallback.websiteUrl,
    });
  });

  it("prefers the live ProjectHub record over the fallback", () => {
    const live = makeProject(7, "Bulletin");
    expect(pickChallengeProjects([live], [{ name: "Bulletin", fallback }])).toEqual([live]);
  });

  it("keeps display order across live and fallback cards", () => {
    const live = makeProject(8, "NewsCord");
    const picked = pickChallengeProjects(
      [live],
      [{ name: "Bulletin", fallback }, { name: "NewsCord" }]
    );
    expect(picked.map((p) => p.name)).toEqual(["Bulletin", "NewsCord"]);
  });
});
