import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();
const get = vi.fn();

vi.mock("axios", () => ({
  default: { create: () => ({ post, get }) },
}));

import {
  fetchCommunityCalls,
  fetchE4PSignatories,
  fetchNotionAgenda,
  fetchNotionFAQ,
  fetchNotionIdeas,
} from "./notionClient";

const locals = (env: Record<string, string>) => ({ runtime: { env } }) as unknown as App.Locals;
const rt = (text: string) => [{ plain_text: text }];

beforeEach(() => {
  post.mockReset();
  get.mockReset();
});

describe("missing credentials", () => {
  it.each([
    ["FAQ", () => fetchNotionFAQ(false, locals({})), "NOTION_FAQ_DB_ID"],
    ["ideas", () => fetchNotionIdeas(locals({})), "NOTION_IDEAS_DB_ID"],
    ["agenda", () => fetchNotionAgenda(locals({})), "NOTION_AGENDA_DB_ID"],
    ["signatories", () => fetchE4PSignatories(locals({})), "NOTION_SIGNATORIES_DB_ID"],
    ["calls", () => fetchCommunityCalls(locals({})), "NOTION_COMMUNITY_CALLS_DB_ID"],
  ])("%s throws the exact message", async (_name, run, dbVar) => {
    await expect(run()).rejects.toThrow(
      `Missing Notion credentials: NOTION_SECRET and ${dbVar} are required`
    );
  });
});

describe("fetchNotionFAQ", () => {
  const env = locals({ NOTION_SECRET: "s", NOTION_FAQ_DB_ID: "db" });

  it("sorts by position and defaults a missing position to 999999", async () => {
    post.mockResolvedValue({
      data: {
        results: [
          { id: "a", properties: { Question: { title: rt("A") }, Answer: {} } },
          {
            id: "b",
            properties: {
              Question: { title: rt("B") },
              Answer: { rich_text: rt("x") },
              Position: { number: 1 },
            },
          },
        ],
      },
    });
    const faqs = await fetchNotionFAQ(false, env);
    expect(faqs).toEqual([
      { id: "b", question: "B", answer: rt("x"), position: 1 },
      { id: "a", question: "A", answer: [], position: 999999 },
    ]);
  });

  it("filters on Visibility unless showAll", async () => {
    post.mockResolvedValue({ data: { results: [] } });
    await fetchNotionFAQ(false, env);
    expect(post).toHaveBeenLastCalledWith("databases/db/query", {
      filter: { property: "Visibility", checkbox: { equals: true } },
    });
    await fetchNotionFAQ(true, env);
    expect(post).toHaveBeenLastCalledWith("databases/db/query", {});
  });
});

describe("fetchNotionIdeas", () => {
  it("maps name, category and description with fallbacks", async () => {
    post.mockResolvedValue({
      data: {
        results: [
          {
            id: "1",
            properties: {
              Name: { title: rt("Idea") },
              Category: { select: { name: "Cat" } },
              Description: { rich_text: rt("d") },
            },
          },
          { id: "2", properties: {} },
        ],
      },
    });
    const ideas = await fetchNotionIdeas(locals({ NOTION_SECRET: "s", NOTION_IDEAS_DB_ID: "db" }));
    expect(ideas).toEqual([
      { id: "1", name: "Idea", category: "Cat", description: rt("d") },
      { id: "2", name: "", category: "", description: [] },
    ]);
  });
});

describe("fetchNotionAgenda", () => {
  it("resolves the first moderator relation and lists speakers sorted by name", async () => {
    post.mockResolvedValue({
      data: {
        results: [
          {
            id: "i1",
            properties: {
              Title: { title: rt("Talk") },
              Description: { rich_text: rt("desc") },
              Time: { rich_text: rt("9am") },
              Moderator: { relation: [{ id: "m2" }, { id: "m1" }] },
            },
          },
          { id: "i2", properties: { Title: { title: rt("Solo") } } },
        ],
      },
    });
    get.mockImplementation(async (path: string) => {
      if (path === "pages/m1") {
        return {
          data: {
            properties: {
              Name: { title: rt("Zed") },
              Title: { rich_text: rt("CTO") },
              "Speaker bio": { rich_text: [{ plain_text: "a" }, { plain_text: "b" }] },
              Photo: { files: [{ type: "external", external: { url: "https://x.test/p.jpg" } }] },
            },
          },
        };
      }
      return { data: { properties: { Name: { title: rt("Amy") } } } };
    });

    const { agendaItems, speakers } = await fetchNotionAgenda(
      locals({ NOTION_SECRET: "s", NOTION_AGENDA_DB_ID: "db" })
    );
    expect(speakers.map((s: { name: string }) => s.name)).toEqual(["Amy", "Zed"]);
    expect(speakers[1]).toEqual({
      id: "m1",
      name: "Zed",
      title: "CTO",
      bio: "ab",
      photo: "https://x.test/p.jpg",
    });
    expect(speakers[0].photo).toBe("/images/default.jpg");
    expect(agendaItems[0].moderator?.name).toBe("Amy");
    expect(agendaItems[1]).toEqual({
      id: "i2",
      title: "Solo",
      description: "",
      time: "",
      moderator: null,
    });
  });

  it("drops a speaker whose page fails to load", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    post.mockResolvedValue({
      data: {
        results: [{ id: "i", properties: { Moderator: { relation: [{ id: "m" }] } } }],
      },
    });
    get.mockRejectedValue(new Error("boom"));
    const { agendaItems, speakers } = await fetchNotionAgenda(
      locals({ NOTION_SECRET: "s", NOTION_AGENDA_DB_ID: "db" })
    );
    expect(speakers).toEqual([]);
    expect(agendaItems[0].moderator).toBeUndefined();
  });
});

describe("fetchE4PSignatories", () => {
  it("applies || fallbacks", async () => {
    post.mockResolvedValue({
      data: {
        results: [
          {
            id: "1",
            properties: {
              Name: { title: rt("N") },
              Company: { rich_text: rt("C") },
              Position: { rich_text: rt("P") },
              "LinkedIn URL": { url: "https://l.test" },
              "Signed At": { date: { start: "2026-01-01" } },
              Approved: { checkbox: true },
            },
          },
          { id: "2", properties: {} },
        ],
      },
    });
    const rows = await fetchE4PSignatories(
      locals({ NOTION_SECRET: "s", NOTION_SIGNATORIES_DB_ID: "db" })
    );
    expect(rows[0]).toEqual({
      id: "1",
      name: "N",
      company: "C",
      position: "P",
      linkedinUrl: "https://l.test",
      signedAt: "2026-01-01",
      approved: true,
    });
    expect(rows[1]).toEqual({
      id: "2",
      name: "",
      company: "",
      position: "",
      linkedinUrl: "",
      signedAt: "",
      approved: false,
    });
  });
});

describe("fetchCommunityCalls", () => {
  it("drops dateless rows, sanitizes URLs, defaults the title and sorts newest first", async () => {
    post.mockResolvedValue({
      data: {
        results: [
          {
            id: "old",
            properties: {
              Date: { date: { start: "2026-01-01T10:00:00.000Z" } },
              Title: { title: rt("Old") },
              "YouTube URL": { url: "https://y.test/1" },
            },
          },
          {
            id: "new",
            properties: {
              Date: { date: { start: "2026-03-01T10:00:00.000Z" } },
              Description: { rich_text: [{ plain_text: "he" }, { plain_text: "llo" }] },
              "X URL": { url: "javascript:alert(1)" },
            },
          },
          { id: "nodate", properties: { Title: { title: rt("None") } } },
        ],
      },
    });
    const calls = await fetchCommunityCalls(
      locals({ NOTION_SECRET: "s", NOTION_COMMUNITY_CALLS_DB_ID: "db" })
    );
    expect(calls.map((c) => c.id)).toEqual(["new", "old"]);
    expect(calls[0].title).toBe("Community Call");
    expect(calls[0].description).toBe("hello");
    expect(calls[0].xUrl).toBe("");
    expect(calls[1].youtubeUrl).toBe("https://y.test/1");
    expect(calls[1].startUtcIso).toBe("2026-01-01T10:00:00.000Z");
  });
});
