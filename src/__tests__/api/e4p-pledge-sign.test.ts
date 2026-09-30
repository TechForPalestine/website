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
const { POST } = await import("../../pages/api/e4p-pledge-sign");

const LOCALS = {
  runtime: {
    env: { NOTION_SECRET: "s", NOTION_SIGNATORIES_DB_ID: "db" },
    ctx: { waitUntil: vi.fn() },
  },
} as unknown as App.Locals;

const VALID: Record<string, string> = {
  name: "Ada",
  email: "ada@example.org",
  company: "Co",
  position: "Eng",
  linkedin: "https://linkedin.com/in/ada",
  agreement: "on",
};

function call(fields: Record<string, string>, origin: string | null = ORIGIN) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  const headers: Record<string, string> = {};
  if (origin) headers.Origin = origin;
  const request = new Request("https://techforpalestine.org/api/e4p-pledge-sign", {
    method: "POST",
    headers,
    body: form,
  });
  return POST({ request, locals: LOCALS } as never);
}

describe("POST /api/e4p-pledge-sign", () => {
  beforeEach(() => {
    create.mockReset();
    create.mockResolvedValue({ id: "abcd-ef01" });
  });
  afterEach(() => vi.clearAllMocks());

  it("403 for a foreign origin, without CORS headers", async () => {
    const res = await snapshot(await call(VALID, "https://evil.example"));
    expect(res).toMatchObject({ status: 403, headers: JSON_ONLY, json: { error: "Forbidden" } });
    expect(create).not.toHaveBeenCalled();
  });

  it("400 when a field is missing", async () => {
    const res = await snapshot(await call({ ...VALID, company: "" }));
    expect(res).toMatchObject({
      status: 400,
      headers: JSON_ACAO,
      json: { error: "All fields are required and agreement must be checked" },
    });
  });

  it("400 when the agreement is not checked", async () => {
    const rest = { ...VALID };
    delete rest.agreement;
    const res = await snapshot(await call(rest));
    expect(res.status).toBe(400);
  });

  it("400 for an invalid email", async () => {
    const res = await snapshot(await call({ ...VALID, email: "nope" }));
    expect(res).toMatchObject({
      status: 400,
      headers: JSON_ACAO,
      json: { error: "Invalid email address" },
    });
  });

  it("400 for an invalid LinkedIn URL", async () => {
    const res = await snapshot(await call({ ...VALID, linkedin: "not a url" }));
    expect(res).toMatchObject({
      status: 400,
      headers: JSON_ACAO,
      json: { error: "Invalid LinkedIn URL" },
    });
  });

  it("400 when a text field is too long", async () => {
    const res = await snapshot(await call({ ...VALID, position: "x".repeat(2001) }));
    expect(res).toMatchObject({
      status: 400,
      headers: JSON_ACAO,
      json: { error: "Field 'position' exceeds maximum length of 2000 characters" },
    });
  });

  it("201 with POST-only CORS headers and the signatory payload", async () => {
    const res = await snapshot(await call(VALID));
    expect(res).toMatchObject({
      status: 201,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": ORIGIN,
        "access-control-allow-methods": "POST",
        "access-control-allow-headers": "Content-Type",
      },
      json: {
        success: true,
        message: "Pledge signed successfully",
        signatory: {
          id: "abcd-ef01",
          url: "https://notion.so/abcdef01",
          name: "Ada",
          company: "Co",
          position: "Eng",
        },
      },
    });
    const props = create.mock.lastCall![0].properties;
    expect(props.Name).toEqual({ title: [{ text: { content: "Ada" } }] });
    expect(props.Email).toEqual({ email: "ada@example.org" });
    expect(props.Company).toEqual({ rich_text: [{ text: { content: "Co" } }] });
    expect(props.Position).toEqual({ rich_text: [{ text: { content: "Eng" } }] });
    expect(props["LinkedIn URL"]).toEqual({ url: "https://linkedin.com/in/ada" });
    expect(props.Approved).toEqual({ checkbox: false });
    expect(Object.keys(props).sort()).toEqual([
      "Approved",
      "Company",
      "Email",
      "LinkedIn URL",
      "Name",
      "Position",
      "Signed At",
    ]);
  });

  it("500 generic message and ACAO only when Notion fails", async () => {
    create.mockRejectedValue(new Error("secret detail"));
    const res = await snapshot(await call(VALID));
    expect(res).toMatchObject({
      status: 500,
      headers: JSON_ACAO,
      json: { error: "Failed to process pledge" },
    });
    expect(res.text).not.toContain("secret detail");
    expect(reportError).toHaveBeenCalledWith(expect.any(Error), { context: "e4p-pledge-sign" });
  });
});
