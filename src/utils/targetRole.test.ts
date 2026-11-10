import { describe, expect, it } from "vitest";
import {
  TARGET_ROLE_PARAM,
  clearTargetRole,
  currentTargetRole,
  membershipUrlForRole,
  parseTargetRoleId,
  rememberTargetRole,
} from "./targetRole";

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
  };
}

describe("parseTargetRoleId", () => {
  it("accepts a typical Hub id", () => {
    expect(parseTargetRoleId("cm3x9k2ab0001")).toBe("cm3x9k2ab0001");
    expect(parseTargetRoleId("3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d")).toBe(
      "3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"
    );
  });

  it("trims surrounding whitespace", () => {
    expect(parseTargetRoleId("  abc123 ")).toBe("abc123");
  });

  it("rejects missing, empty, non-string and oversized values", () => {
    expect(parseTargetRoleId(undefined)).toBe("");
    expect(parseTargetRoleId("")).toBe("");
    expect(parseTargetRoleId(42)).toBe("");
    expect(parseTargetRoleId({ id: "x" })).toBe("");
    expect(parseTargetRoleId("a".repeat(101))).toBe("");
  });

  it("rejects characters an id never contains", () => {
    expect(parseTargetRoleId("abc<script>")).toBe("");
    expect(parseTargetRoleId("../admin")).toBe("");
    expect(parseTargetRoleId("a b")).toBe("");
  });
});

describe("membershipUrlForRole", () => {
  it("adds the role id as a query parameter", () => {
    expect(membershipUrlForRole("abc123")).toBe(`/membership?${TARGET_ROLE_PARAM}=abc123`);
  });

  it("falls back to plain /membership for an invalid id", () => {
    expect(membershipUrlForRole("bad id")).toBe("/membership");
  });
});

describe("rememberTargetRole / currentTargetRole", () => {
  it("stores the role from the URL and reads it back later without the param", () => {
    const storage = memoryStorage();
    rememberTargetRole(`?${TARGET_ROLE_PARAM}=abc123`, storage);
    expect(currentTargetRole("", storage)).toBe("abc123");
  });

  it("prefers the role in the current URL over a stored one", () => {
    const storage = memoryStorage();
    rememberTargetRole(`?${TARGET_ROLE_PARAM}=old`, storage);
    expect(currentTargetRole(`?${TARGET_ROLE_PARAM}=new`, storage)).toBe("new");
  });

  it("keeps the stored role when the visitor returns without a param", () => {
    const storage = memoryStorage();
    rememberTargetRole(`?${TARGET_ROLE_PARAM}=abc123`, storage);
    rememberTargetRole("", storage);
    expect(currentTargetRole("", storage)).toBe("abc123");
  });

  it("ignores an invalid role in the URL and a tampered stored value", () => {
    const storage = memoryStorage();
    rememberTargetRole(`?${TARGET_ROLE_PARAM}=bad%20id`, storage);
    expect(currentTargetRole("", storage)).toBe("");
    storage.setItem("t4p:targetRoleId", "<tampered>");
    expect(currentTargetRole("", storage)).toBe("");
  });

  it("returns empty when there is no role anywhere", () => {
    expect(currentTargetRole("", memoryStorage())).toBe("");
  });

  it("survives storage that throws (private mode, blocked storage)", () => {
    const throwing = {
      ...memoryStorage(),
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    } as Storage;
    expect(() => rememberTargetRole(`?${TARGET_ROLE_PARAM}=abc`, throwing)).not.toThrow();
    expect(currentTargetRole(`?${TARGET_ROLE_PARAM}=abc`, throwing)).toBe("abc");
    expect(currentTargetRole("", throwing)).toBe("");
  });
});

describe("clearTargetRole", () => {
  it("forgets the stored role", () => {
    const storage = memoryStorage();
    rememberTargetRole(`?${TARGET_ROLE_PARAM}=abc123`, storage);
    clearTargetRole(storage);
    expect(currentTargetRole("", storage)).toBe("");
  });
});
