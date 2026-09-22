import { describe, expect, it, vi } from "vitest";
import { claimTransaction } from "./transactionReplay";

function fakeKv(existing: string | null = null) {
  return {
    get: vi.fn().mockResolvedValue(existing),
    put: vi.fn().mockResolvedValue(undefined),
    list: vi.fn(),
  } as unknown as KVNamespace;
}

describe("claimTransaction", () => {
  it("allows a transaction id that has not been seen", async () => {
    const kv = fakeKv(null);
    await expect(claimTransaction(kv, "555001")).resolves.toBe(true);
    expect(kv.put).toHaveBeenCalledWith("qgiv-txn:555001", expect.any(String), {
      expirationTtl: 2592000,
    });
  });

  it("refuses a replayed transaction id", async () => {
    const kv = fakeKv("2026-09-22T00:00:00.000Z");
    await expect(claimTransaction(kv, "555001")).resolves.toBe(false);
  });

  it("allows the request when KV is unavailable, since verification already passed", async () => {
    await expect(claimTransaction(undefined, "555001")).resolves.toBe(true);
  });

  it("allows the request when KV throws, rather than losing a real member", async () => {
    const kv = {
      get: vi.fn().mockRejectedValue(new Error("kv down")),
      put: vi.fn(),
      list: vi.fn(),
    } as unknown as KVNamespace;
    await expect(claimTransaction(kv, "555001")).resolves.toBe(true);
  });
});
