import { describe, expect, it } from "vitest";
import {
  adjacentEntries,
  breadcrumbListSchema,
  entryFullTitle,
  entryHref,
  entryShortLabel,
  groupToc,
  sortEntries,
  type ReportTocItem,
} from "./reportNav";

const entries = [
  { slug: "appendix-a", order: 101 },
  { slug: "section-2", order: 2 },
  { slug: "executive-summary", order: 0 },
  { slug: "section-1", order: 1 },
];

describe("entryHref", () => {
  it("maps the executive summary to the index", () => {
    expect(entryHref("executive-summary")).toBe("/wikipedia-report-2026");
  });

  it("maps other slugs under the base path", () => {
    expect(entryHref("section-6")).toBe("/wikipedia-report-2026/section-6");
  });
});

describe("sortEntries", () => {
  it("orders by `order` without mutating the input", () => {
    const before = entries.map((e) => e.slug);
    expect(sortEntries(entries).map((e) => e.slug)).toEqual([
      "executive-summary",
      "section-1",
      "section-2",
      "appendix-a",
    ]);
    expect(entries.map((e) => e.slug)).toEqual(before);
  });
});

describe("adjacentEntries", () => {
  it("returns neighbours in reading order", () => {
    const { prev, next } = adjacentEntries(entries, "section-2");
    expect(prev?.slug).toBe("section-1");
    expect(next?.slug).toBe("appendix-a");
  });

  it("returns null at either end", () => {
    expect(adjacentEntries(entries, "executive-summary").prev).toBeNull();
    expect(adjacentEntries(entries, "appendix-a").next).toBeNull();
  });

  it("returns nulls for an unknown slug", () => {
    expect(adjacentEntries(entries, "nope")).toEqual({ prev: null, next: null });
  });
});

describe("groupToc", () => {
  const toc: ReportTocItem[] = [
    { title: "Orphan", depth: 3, id: "orphan" },
    { number: "6.1", title: "Core flaws", depth: 2, id: "s6-1" },
    { number: "6.1.1", title: "Invented group", depth: 3, id: "s6-1-1" },
    { number: "6.1.1.1", title: "Too deep", depth: 4, id: "s6-1-1-1" },
    { number: "6.1.2", title: "Second", depth: 3, id: "s6-1-2" },
    { number: "6.2", title: "Next", depth: 2, id: "s6-2" },
  ];

  it("nests depth-3 items under the preceding depth-2 item", () => {
    const groups = groupToc(toc);
    expect(groups.map((g) => g.id)).toEqual(["s6-1", "s6-2"]);
    expect(groups[0].children.map((c) => c.id)).toEqual(["s6-1-1", "s6-1-2"]);
    expect(groups[1].children).toEqual([]);
  });

  it("returns an empty list for an empty toc", () => {
    expect(groupToc([])).toEqual([]);
  });
});

describe("labels", () => {
  it("shortens section and appendix labels", () => {
    expect(entryShortLabel({ label: "Section 6" })).toBe("6");
    expect(entryShortLabel({ label: "Appendix E" })).toBe("E");
    expect(entryShortLabel({})).toBeUndefined();
  });

  it("prefixes the label to the title when present", () => {
    expect(entryFullTitle({ label: "Section 6", title: "The ADL report" })).toBe(
      "Section 6: The ADL report"
    );
    expect(entryFullTitle({ title: "Executive Summary" })).toBe("Executive Summary");
  });
});

describe("breadcrumbListSchema", () => {
  it("numbers crumbs from 1", () => {
    const schema = breadcrumbListSchema([
      { name: "Home", url: "https://example.org/" },
      { name: "Report", url: "https://example.org/r" },
    ]);
    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: "https://example.org/" },
      { "@type": "ListItem", position: 2, name: "Report", item: "https://example.org/r" },
    ]);
  });
});
