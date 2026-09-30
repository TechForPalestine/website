import { afterEach, describe, expect, it, vi } from "vitest";
import { getEnv } from "./getEnv";

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
});
