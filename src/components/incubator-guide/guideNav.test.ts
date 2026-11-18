import { describe, expect, it } from "vitest";
import { adjacentLinks, chapterHref, guideLinks, type GuideChapter } from "./guideNav";

const chapters: GuideChapter[] = [
  { slug: "launch", title: "Launch", description: "", order: 2 },
  { slug: "users", title: "Users", description: "", order: 1 },
  { slug: "team", title: "Team", description: "", order: 3 },
];

describe("guideLinks", () => {
  it("puts the overview first, then chapters by order", () => {
    expect(guideLinks(chapters).map((l) => l.href)).toEqual([
      "/incubator/guide",
      "/incubator/guide/users",
      "/incubator/guide/launch",
      "/incubator/guide/team",
    ]);
  });
});

describe("adjacentLinks", () => {
  it("links the overview forward to the first chapter only", () => {
    const { prev, next } = adjacentLinks(chapters, null);
    expect(prev).toBeNull();
    expect(next?.href).toBe(chapterHref("users"));
  });

  it("links the first chapter back to the overview", () => {
    const { prev, next } = adjacentLinks(chapters, "users");
    expect(prev?.href).toBe("/incubator/guide");
    expect(next?.slug).toBe("launch");
  });

  it("has no next page after the last chapter", () => {
    const { prev, next } = adjacentLinks(chapters, "team");
    expect(prev?.slug).toBe("launch");
    expect(next).toBeNull();
  });

  it("returns nothing for an unknown slug", () => {
    expect(adjacentLinks(chapters, "missing")).toEqual({ prev: null, next: null });
  });
});
