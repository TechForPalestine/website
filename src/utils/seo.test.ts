import { describe, expect, it } from "vitest";
import {
  canonicalUrl,
  faqPageSchema,
  organizationSchema,
  ORGANIZATION_ID,
  onlineEventSchema,
  projectListSchema,
  projectSchema,
  serializeJsonLd,
  sitemapXml,
  stripTrailingSlash,
  truncateDescription,
  websiteSchema,
} from "./seo";
import type { ProjectItem } from "../types/projects";

const project = (overrides: Partial<ProjectItem> = {}): ProjectItem => ({
  id: 236,
  name: "Bias-Proof",
  description: "A media bias highlighting tool.",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-02-01T00:00:00Z",
  ...overrides,
});

describe("stripTrailingSlash", () => {
  it("removes one trailing slash from a path", () => {
    expect(stripTrailingSlash("/about/")).toBe("/about");
  });

  it("leaves the root path alone", () => {
    expect(stripTrailingSlash("/")).toBe("/");
  });

  it("leaves a path without a trailing slash alone", () => {
    expect(stripTrailingSlash("/about")).toBe("/about");
  });
});

describe("canonicalUrl", () => {
  it("gives /about and /about/ the same canonical", () => {
    expect(canonicalUrl("/about/")).toBe("https://techforpalestine.org/about");
    expect(canonicalUrl("/about")).toBe("https://techforpalestine.org/about");
  });

  it("keeps the homepage as the bare origin with a slash", () => {
    expect(canonicalUrl("/")).toBe("https://techforpalestine.org/");
  });

  it("uses the configured site when one is given", () => {
    expect(canonicalUrl("/faq/", new URL("https://example.org"))).toBe("https://example.org/faq");
  });
});

describe("truncateDescription", () => {
  it("returns short text unchanged, with whitespace collapsed", () => {
    expect(truncateDescription("What's new?\n\nJoin   us.")).toBe("What's new? Join us.");
  });

  it("cuts long text at a word boundary within the limit", () => {
    const out = truncateDescription("alpha beta gamma delta epsilon", 20);
    expect(out).toBe("alpha beta gamma…");
    expect(out.length).toBeLessThanOrEqual(20);
  });

  it("does not leave trailing punctuation before the ellipsis", () => {
    expect(truncateDescription("one two, three four five six", 12)).toBe("one two…");
  });
});

describe("serializeJsonLd", () => {
  it("escapes characters that could close the script element", () => {
    const out = serializeJsonLd({ text: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
    expect(JSON.parse(out)).toEqual({ text: "</script><script>alert(1)</script>" });
  });

  it("escapes ampersands and line separators", () => {
    const out = serializeJsonLd({ text: "a & b\u2028c\u2029" });
    expect(out).not.toMatch(/[&\u2028\u2029]/);
    expect(JSON.parse(out)).toEqual({ text: "a & b\u2028c\u2029" });
  });
});

describe("organizationSchema", () => {
  it("describes T4P as a 501(c)(3) nonprofit with its EIN", () => {
    const schema = organizationSchema();
    expect(schema["@type"]).toBe("NonprofitOrganization");
    expect(schema["@id"]).toBe(ORGANIZATION_ID);
    expect(schema.taxID).toBe("99-3441367");
    expect(schema.nonprofitStatus).toBe("Nonprofit501c3");
    expect(schema.founder).toMatchObject({ "@type": "Person", name: "Paul Biggar" });
  });

  it("merges page-specific extras without letting them replace core identity", () => {
    const schema = organizationSchema({ name: "Impostor", contactPoint: { email: "x@y.z" } });
    expect(schema.name).toBe("Tech for Palestine");
    expect(schema.contactPoint).toEqual({ email: "x@y.z" });
  });
});

describe("websiteSchema", () => {
  it("links the site to the organization", () => {
    expect(websiteSchema()).toMatchObject({
      "@type": "WebSite",
      publisher: { "@id": ORGANIZATION_ID, name: "Tech for Palestine" },
    });
  });
});

describe("faqPageSchema", () => {
  it("emits one Question per item with its plain-text answer", () => {
    const schema = faqPageSchema([
      { question: "What is T4P?", answer: "A nonprofit." },
      { question: "How do I join?", answer: "Become a member." },
    ]);
    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity).toHaveLength(2);
    expect(schema.mainEntity[0]).toEqual({
      "@type": "Question",
      name: "What is T4P?",
      acceptedAnswer: { "@type": "Answer", text: "A nonprofit." },
    });
  });

  it("drops items missing a question or an answer", () => {
    const schema = faqPageSchema([
      { question: "", answer: "orphan" },
      { question: "Unanswered?", answer: "  " },
      { question: "Kept?", answer: "Yes." },
    ]);
    expect(schema.mainEntity.map((q) => q.name)).toEqual(["Kept?"]);
  });
});

describe("projectSchema", () => {
  it("describes the project at its canonical URL with breadcrumbs", () => {
    const [work, breadcrumbs] = projectSchema(project({ leadName: "Jane Doe" }));
    expect(work).toMatchObject({
      "@type": "CreativeWork",
      name: "Bias-Proof",
      url: "https://techforpalestine.org/projects/bias-proof-236",
      description: "A media bias highlighting tool.",
      creator: { "@type": "Person", name: "Jane Doe" },
      sourceOrganization: { "@id": ORGANIZATION_ID, name: "Tech for Palestine" },
    });
    expect(breadcrumbs.itemListElement.map((item) => item.name)).toEqual([
      "Home",
      "Projects",
      "Bias-Proof",
    ]);
  });

  it("only links to a safe http(s) website", () => {
    const [unsafe] = projectSchema(project({ websiteUrl: "javascript:alert(1)" }));
    expect(unsafe).not.toHaveProperty("sameAs");
    const [safe] = projectSchema(project({ websiteUrl: "https://biasproof.org" }));
    expect(safe.sameAs).toBe("https://biasproof.org/");
  });
});

describe("projectListSchema", () => {
  it("lists every project URL in order", () => {
    const schema = projectListSchema([project(), project({ id: 7, name: "Boycat" })]);
    expect(schema["@type"]).toBe("ItemList");
    expect(schema.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        url: "https://techforpalestine.org/projects/bias-proof-236",
        name: "Bias-Proof",
      },
      {
        "@type": "ListItem",
        position: 2,
        url: "https://techforpalestine.org/projects/boycat-7",
        name: "Boycat",
      },
    ]);
  });
});

describe("onlineEventSchema", () => {
  const base = {
    name: "November 2026 Community Call",
    description: "What's new at T4P?",
    startIso: "2026-11-20T17:00:00.000Z",
    durationMinutes: 60,
    pageUrl: "https://techforpalestine.org/community-call",
  };

  it("describes a free online event with start and end times", () => {
    expect(onlineEventSchema({ ...base, streamUrl: "https://youtube.com/live/x" })).toMatchObject({
      "@type": "Event",
      startDate: "2026-11-20T17:00:00.000Z",
      endDate: "2026-11-20T18:00:00.000Z",
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      location: { "@type": "VirtualLocation", url: "https://youtube.com/live/x" },
      organizer: { "@id": ORGANIZATION_ID, name: "Tech for Palestine" },
    });
  });

  it("falls back to the page URL when there is no safe stream URL", () => {
    const schema = onlineEventSchema({ ...base, streamUrl: "javascript:alert(1)" });
    expect(schema?.location).toEqual({
      "@type": "VirtualLocation",
      url: "https://techforpalestine.org/community-call",
    });
  });

  it("returns null for an unparseable start time", () => {
    expect(onlineEventSchema({ ...base, startIso: "" })).toBeNull();
  });
});

describe("sitemapXml", () => {
  it("renders a urlset with escaped locations and optional lastmod", () => {
    const xml = sitemapXml([
      { loc: "https://techforpalestine.org/projects/a-1", lastmod: "2026-02-01T00:00:00Z" },
      { loc: "https://techforpalestine.org/projects/b-2?x=1&y=2" },
    ]);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain(
      "<url><loc>https://techforpalestine.org/projects/a-1</loc><lastmod>2026-02-01</lastmod></url>"
    );
    expect(xml).toContain("<loc>https://techforpalestine.org/projects/b-2?x=1&amp;y=2</loc>");
  });

  it("omits an unparseable lastmod", () => {
    const xml = sitemapXml([{ loc: "https://techforpalestine.org/x", lastmod: "not a date" }]);
    expect(xml).not.toContain("<lastmod>");
  });
});
