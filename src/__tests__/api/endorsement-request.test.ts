import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JSON_ACAO, JSON_ONLY, ORIGIN, snapshot } from "./helpers";

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@notionhq/client", () => ({
  Client: class {
    pages = { create };
  },
}));
vi.mock("@sentry/astro", () => ({ flush: vi.fn().mockResolvedValue(true) }));
vi.mock("../../lib/report-error", () => ({ reportError: vi.fn() }));

const { reportError } = await import("../../lib/report-error");
const { POST } = await import("../../pages/api/endorsement-request");

const LOCALS = {
  runtime: {
    env: { NOTION_SECRET: "s", NOTION_ENDORSEMENTS_DB_ID: "db" },
    ctx: { waitUntil: vi.fn() },
  },
} as unknown as App.Locals;

const VALID = {
  contactName: "Ada",
  contactEmail: "ada@example.org",
  organizationName: "Org",
  organizationWebsite: "https://org.example",
  campaignName: "Camp",
  request: "Please endorse",
  campaignPurpose: "Purpose",
  campaignLink: "https://camp.example",
  notableSupporters: "Some",
  isT4PProject: false,
};

function call(body: unknown, origin: string | null = ORIGIN, locals = LOCALS) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (origin) headers.Origin = origin;
  const request = new Request("https://techforpalestine.org/api/endorsement-request", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return POST({ request, locals } as never);
}

describe("POST /api/endorsement-request", () => {
  beforeEach(() => {
    create.mockReset();
    create.mockResolvedValue({ id: "p" });
  });
  afterEach(() => vi.clearAllMocks());

  it("403 for a foreign origin, without CORS headers, before parsing", async () => {
    const res = await snapshot(await call(VALID, "https://evil.example"));
    expect(res).toMatchObject({ status: 403, headers: JSON_ONLY, json: { error: "Forbidden" } });
    expect(create).not.toHaveBeenCalled();
  });

  it("403 for a missing origin", async () => {
    const res = await snapshot(await call(VALID, null));
    expect(res.status).toBe(403);
  });

  it("400 when a required field is missing", async () => {
    const res = await snapshot(await call({ ...VALID, campaignLink: "" }));
    expect(res).toMatchObject({
      status: 400,
      headers: JSON_ACAO,
      json: { error: "All required fields must be filled" },
    });
  });

  it("400 for an invalid email", async () => {
    const res = await snapshot(await call({ ...VALID, contactEmail: "nope" }));
    expect(res).toMatchObject({
      status: 400,
      headers: JSON_ACAO,
      json: { error: "Invalid email address" },
    });
  });

  it("400 for an invalid organization website", async () => {
    const res = await snapshot(await call({ ...VALID, organizationWebsite: "not a url" }));
    expect(res).toMatchObject({
      status: 400,
      headers: JSON_ACAO,
      json: { error: "Invalid organization website URL" },
    });
  });

  it("400 for an invalid campaign link", async () => {
    const res = await snapshot(await call({ ...VALID, campaignLink: "not a url" }));
    expect(res).toMatchObject({
      status: 400,
      headers: JSON_ACAO,
      json: { error: "Invalid campaign link URL" },
    });
  });

  it("accepts non-http schemes that new URL() parses", async () => {
    const res = await snapshot(await call({ ...VALID, campaignLink: "ftp://x.example" }));
    expect(res.status).toBe(201);
  });

  it("400 when a text field is too long, naming the first offender", async () => {
    const res = await snapshot(
      await call({ ...VALID, request: "x".repeat(2001), campaignPurpose: "y".repeat(2001) })
    );
    expect(res).toMatchObject({
      status: 400,
      headers: JSON_ACAO,
      json: { error: "Field 'request' exceeds maximum length of 2000 characters" },
    });
  });

  it("accepts a field of exactly 2000 characters", async () => {
    const res = await snapshot(await call({ ...VALID, request: "x".repeat(2000) }));
    expect(res.status).toBe(201);
  });

  it("201 with POST-only CORS headers and writes the Notion properties", async () => {
    const res = await snapshot(await call(VALID));
    expect(res).toMatchObject({
      status: 201,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": ORIGIN,
        "access-control-allow-methods": "POST",
        "access-control-allow-headers": "Content-Type",
      },
      json: { success: true, message: "Endorsement request submitted successfully" },
    });
    expect(create.mock.lastCall![0].parent).toEqual({ database_id: "db" });
    const props = create.mock.lastCall![0].properties;
    expect(props["Contact Name"]).toEqual({ title: [{ text: { content: "Ada" } }] });
    expect(props["Contact Email"]).toEqual({ email: "ada@example.org" });
    expect(props["Org Name"]).toEqual({ rich_text: [{ text: { content: "Org" } }] });
    expect(props["Org Website"]).toEqual({ url: "https://org.example" });
    expect(props["Campaign Link"]).toEqual({ url: "https://camp.example" });
    expect(props["Notable Supporters"]).toEqual({ rich_text: [{ text: { content: "Some" } }] });
    expect(props["Is T4P Project"]).toEqual({ checkbox: false });
    expect(Object.keys(props).sort()).toEqual([
      "Campaign Link",
      "Campaign Name",
      "Campaign Purpose",
      "Contact Email",
      "Contact Name",
      "Is T4P Project",
      "Notable Supporters",
      "Org Name",
      "Org Website",
      "Request",
      "Submitted At",
    ]);
  });

  it("defaults notableSupporters to an empty string", async () => {
    const rest: Record<string, unknown> = { ...VALID };
    delete rest.notableSupporters;
    await call(rest);
    expect(create.mock.lastCall![0].properties["Notable Supporters"]).toEqual({
      rich_text: [{ text: { content: "" } }],
    });
  });

  it("500 with a generic message and ACAO only when Notion fails", async () => {
    create.mockRejectedValue(new Error("secret detail"));
    const res = await snapshot(await call(VALID));
    expect(res).toMatchObject({
      status: 500,
      headers: JSON_ACAO,
      json: { error: "Failed to process endorsement request" },
    });
    expect(res.text).not.toContain("secret detail");
    expect(reportError).toHaveBeenCalledWith(expect.any(Error), {
      context: "endorsement-request",
    });
  });

  it("500 when the database id is not configured", async () => {
    const locals = { runtime: { env: { NOTION_SECRET: "s" } } } as unknown as App.Locals;
    const res = await snapshot(await call(VALID, ORIGIN, locals));
    expect(res.status).toBe(500);
  });

  it("500 for a malformed JSON body", async () => {
    const res = await snapshot(await call("{nope"));
    expect(res).toMatchObject({ status: 500, headers: JSON_ACAO });
  });
});
