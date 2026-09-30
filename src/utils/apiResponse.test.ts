import { describe, expect, it } from "vitest";
import { jsonError, jsonResponse } from "./apiResponse";

describe("jsonResponse", () => {
  it("serialises the body with a JSON content type", async () => {
    const res = jsonResponse({ ok: true }, 201);
    expect(res.status).toBe(201);
    expect(res.headers.get("content-type")).toBe("application/json");
    expect(await res.json()).toEqual({ ok: true });
  });

  it("defaults to 200 and merges extra headers", () => {
    const res = jsonResponse({}, undefined, { "Access-Control-Allow-Origin": "https://x.example" });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("https://x.example");
  });
});

describe("jsonError", () => {
  it("uses the error key by default and adds no other headers", async () => {
    const res = jsonError(403, "Forbidden");
    expect(await res.json()).toEqual({ error: "Forbidden" });
    expect([...res.headers.keys()]).toEqual(["content-type"]);
  });

  it("supports the message key and custom headers", async () => {
    const res = jsonError(402, "nope", { key: "message", headers: { Vary: "Origin" } });
    expect(res.status).toBe(402);
    expect(await res.json()).toEqual({ message: "nope" });
    expect(res.headers.get("vary")).toBe("Origin");
  });
});
