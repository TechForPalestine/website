import { describe, expect, it } from "vitest";
import { isAuthorized, unauthorizedResponse } from "./basicAuth";

const locals = { runtime: { env: { ADMIN_USERNAME: "admin", ADMIN_PASSWORD: "p:ass" } } };

function requestWith(authorization?: string): Request {
  const headers = new Headers();
  if (authorization !== undefined) headers.set("Authorization", authorization);
  return new Request("https://example.test/admin", { headers });
}

const basic = (credentials: string) => `Basic ${btoa(credentials)}`;

describe("isAuthorized", () => {
  it("accepts correct credentials", () => {
    expect(isAuthorized(requestWith(basic("admin:p:ass")), locals)).toBe(true);
  });

  it("splits on the first colon so passwords may contain colons", () => {
    expect(isAuthorized(requestWith(basic("admin:p")), locals)).toBe(false);
  });

  it("rejects a wrong password", () => {
    expect(isAuthorized(requestWith(basic("admin:nope")), locals)).toBe(false);
  });

  it("rejects a wrong username", () => {
    expect(isAuthorized(requestWith(basic("root:p:ass")), locals)).toBe(false);
  });

  it("rejects a missing header", () => {
    expect(isAuthorized(requestWith(), locals)).toBe(false);
  });

  it("rejects a non-Basic scheme", () => {
    expect(isAuthorized(requestWith("Bearer abc"), locals)).toBe(false);
  });

  it("rejects invalid base64 without throwing", () => {
    expect(isAuthorized(requestWith("Basic !!!not-base64!!!"), locals)).toBe(false);
  });

  it("rejects credentials with no colon separator", () => {
    expect(isAuthorized(requestWith(basic("adminpass")), locals)).toBe(false);
  });

  it("fails closed when the admin env vars are not configured", () => {
    expect(isAuthorized(requestWith(basic(":")), { runtime: { env: {} } })).toBe(false);
  });
});

describe("unauthorizedResponse", () => {
  it("returns 401 with a Basic challenge", () => {
    const response = unauthorizedResponse();
    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toContain("Basic");
  });
});
