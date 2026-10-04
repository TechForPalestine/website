import { afterEach, describe, expect, it, vi } from "vitest";
import { getEnv, getKv, getRuntimeCtx } from "./getEnv";

const NAME = "T4P_TEST_ENV_VAR";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getEnv", () => {
  it("returns undefined when the variable is set nowhere", () => {
    expect(getEnv(NAME)).toBeUndefined();
  });

  it("reads the Cloudflare runtime env first", () => {
    vi.stubEnv(NAME, "from-process");
    const locals = { runtime: { env: { [NAME]: "from-cloudflare" } } };
    expect(getEnv(NAME, locals)).toBe("from-cloudflare");
  });

  it("falls back to the process environment when the runtime env lacks the name", () => {
    vi.stubEnv(NAME, "from-process");
    expect(getEnv(NAME, { runtime: { env: {} } })).toBe("from-process");
  });

  it("tolerates locals without a runtime", () => {
    vi.stubEnv(NAME, "from-process");
    expect(getEnv(NAME, {})).toBe("from-process");
  });

  it("treats an empty runtime value as unset and falls through", () => {
    vi.stubEnv(NAME, "from-process");
    expect(getEnv(NAME, { runtime: { env: { [NAME]: "" } } })).toBe("from-process");
  });

  it("prefers import.meta.env over process.env when the runtime lacks the name", () => {
    vi.stubEnv(NAME, "from-meta-and-process");
    expect(getEnv(NAME, undefined)).toBe("from-meta-and-process");
  });

  it("tolerates null and non-object locals", () => {
    vi.stubEnv(NAME, "from-process");
    expect(getEnv(NAME, null)).toBe("from-process");
    expect(getEnv(NAME, "nope")).toBe("from-process");
  });
});

describe("getRuntimeCtx", () => {
  it("returns the runtime ctx when present", () => {
    const ctx = { waitUntil: () => {} };
    expect(getRuntimeCtx({ runtime: { ctx } })).toBe(ctx);
  });

  it("returns undefined without a runtime or locals", () => {
    expect(getRuntimeCtx({})).toBeUndefined();
    expect(getRuntimeCtx(undefined)).toBeUndefined();
  });
});

describe("getKv", () => {
  it("returns the DROPPED_CONVERSIONS binding when present", () => {
    const kv = { get: async () => null };
    expect(getKv({ runtime: { env: { DROPPED_CONVERSIONS: kv } } })).toBe(kv);
  });

  it("returns undefined when unbound", () => {
    expect(getKv({ runtime: { env: {} } })).toBeUndefined();
    expect(getKv(undefined)).toBeUndefined();
  });
});
