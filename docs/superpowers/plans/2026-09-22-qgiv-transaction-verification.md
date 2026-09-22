# Qgiv Transaction Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/api/membership-complete` and `/api/donation-complete` prove a payment really happened, by reading the transaction back from Qgiv server-side, instead of trusting a spoofable `Origin` header and a client-supplied email.

**Architecture:** A new server-only module `src/utils/qgivVerify.ts` looks a transaction up via Qgiv's Transactions reporting API using `QGIV_API_TOKEN`. Both endpoints stop accepting `email`/`firstName`/`lastName`/`tier` from the request body and accept only `transactionId`; every value they act on is read from Qgiv's response. Each endpoint carries its own `formId` allowlist, so a donation transaction cannot be replayed against the membership endpoint to obtain a Hub invite. Any verification failure — invalid id, unknown transaction, non-`Accepted` status, disallowed form, network timeout, missing token — fails closed and reports to Sentry. A KV guard makes each transaction id single-use.

**Tech Stack:** Astro v5 SSR on Cloudflare Pages, TypeScript, Vitest (added by this plan), Cloudflare KV (`DROPPED_CONVERSIONS`, already bound), Sentry via `reportError`.

**Spec:** No separate spec file — this was a bounded change designed in conversation. The agreed design is restated in full under "Design Reference" below; that section is the spec this plan argues from.

## Global Constraints

- Package manager is **pnpm**. Never `npm install`, `yarn`, or `npx astro`.
- All secrets resolve through `getEnv(name, locals)` from `src/utils/getEnv.ts`. Never read `process.env` directly.
- Never return raw error objects or stack traces to clients. Generic message to the client, detail via `reportError` server-side only.
- Never log a full email address. Use the existing `` `[redacted]@${email.split("@")[1]}` `` form.
- Commit messages use conventional format with a scope: `fix(security): ...`. **No attribution or `Co-Authored-By` trailer on commits.**
- Do **not** run `pnpm build`, `pnpm check`, or `pnpm format` unless a step explicitly says to. Running Vitest is explicitly part of this plan and is expected.
- Do **not** start a dev server or curl live pages. The user verifies running behaviour themselves.
- `-new` pages (including `src/pages/donate-new.astro`) are dead code. Do not edit them.
- CSP: no inline `style=""` attributes, no new external script origins.

---

## Design Reference

### Verified form allowlist

| formId    | Qgiv form name            | Allowed at          | Effect                                            |
| --------- | ------------------------- | ------------------- | ------------------------------------------------- |
| `1116610` | Pilot Membership Form     | membership-complete | EmailOctopus tag `member` **+ Hub invite** (paid) |
| `1158315` | Supporting Members Form   | membership-complete | EmailOctopus tag `Supporting Member`, no invite   |
| `1094620` | T4P Website Donation Form | donation-complete   | EmailOctopus tag `donor`                          |
| `1122160` | Test Form                 | **nowhere**         | Deliberately excluded                             |

### Qgiv response fields (confirmed against the live API)

`id`, `formId`, `transStatus`, `contactEmail`, `firstName`, `lastName`, `value`, `optedIn`, `isRecurring`, `form` (an **object** `{id, name}`, not a string — read top-level `formId` instead).

### Rules

- Success status is exactly `"Accepted"`. `"Declined"` and `"Error"` also occur and must be refused.
- **No `isRecurring` gate.** The deleted webhook required `"y"`; that would silently deny a one-time membership payment. Form id + `Accepted` is the authorization check.
- The returned record's `id` must equal the requested `transactionId`.
- `donation-complete` must additionally require `optedIn === true` from the **verified** record. `donate.astro` checks this client-side today, which is spoofable.
- Fail closed on every failure mode, including timeout.
- `Origin` checks stay exactly as they are, as defence in depth against drive-by cross-site calls.

---

### Task 1: Vitest setup and pure verification logic

**Files:**

- Create: `vitest.config.ts`
- Create: `src/utils/qgivVerify.ts`
- Create: `src/utils/qgivVerify.test.ts`
- Modify: `package.json` (add `test` script + `vitest` devDependency)

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces:
  - `isValidTransactionId(value: unknown): value is string`
  - `MEMBERSHIP_FORMS: Record<string, { tag: string; hubInvite: boolean }>`
  - `DONATION_FORMS: Record<string, { tag: string }>`
  - `QGIV_API_BASE: string`

- [ ] **Step 1: Install Vitest**

```bash
pnpm add -D vitest@^3
```

- [ ] **Step 2: Add the test script**

In `package.json`, inside `"scripts"`, add after `"check": "astro check",`:

```json
    "test": "vitest run",
    "test:watch": "vitest",
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Write the failing test**

Create `src/utils/qgivVerify.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DONATION_FORMS, MEMBERSHIP_FORMS, isValidTransactionId } from "./qgivVerify";

describe("isValidTransactionId", () => {
  it("accepts a plain numeric Qgiv id", () => {
    expect(isValidTransactionId("1094620")).toBe(true);
  });

  it("rejects a non-string", () => {
    expect(isValidTransactionId(1094620)).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidTransactionId("")).toBe(false);
  });

  it("rejects path traversal, which would escape the API URL", () => {
    expect(isValidTransactionId("../../admin/api")).toBe(false);
  });

  it("rejects a value longer than 64 characters", () => {
    expect(isValidTransactionId("1".repeat(65))).toBe(false);
  });
});

describe("form allowlists", () => {
  it("grants a Hub invite only to the Pilot Membership Form", () => {
    expect(MEMBERSHIP_FORMS["1116610"]).toEqual({ tag: "member", hubInvite: true });
  });

  it("tags supporting members without a Hub invite", () => {
    expect(MEMBERSHIP_FORMS["1158315"]).toEqual({
      tag: "Supporting Member",
      hubInvite: false,
    });
  });

  it("does not let a donation form reach the membership endpoint", () => {
    expect(MEMBERSHIP_FORMS["1094620"]).toBeUndefined();
  });

  it("does not let a membership form reach the donation endpoint", () => {
    expect(DONATION_FORMS["1116610"]).toBeUndefined();
  });

  it("excludes the Qgiv Test Form from both allowlists", () => {
    expect(MEMBERSHIP_FORMS["1122160"]).toBeUndefined();
    expect(DONATION_FORMS["1122160"]).toBeUndefined();
  });
});
```

- [ ] **Step 5: Run the test and verify it fails**

Run: `pnpm test`
Expected: FAIL — cannot resolve `./qgivVerify`.

- [ ] **Step 6: Write the minimal implementation**

Create `src/utils/qgivVerify.ts`:

```ts
/**
 * Server-side verification of Qgiv transactions.
 *
 * `/api/membership-complete` and `/api/donation-complete` grant real
 * privileges — a paid Hub invite and a mailing-list write. Both were once
 * gated only by an `Origin` header, which any HTTP client sets at will, so
 * the caller could name any email address and any tier. Everything those
 * endpoints act on now comes from Qgiv's own record of the transaction.
 *
 * The form allowlists live here, in one auditable place, and are deliberately
 * split per endpoint: a real $5 donation id must not be replayable against
 * the membership endpoint to obtain a paid-tier Hub invite.
 */

export const QGIV_API_BASE = "https://secure.qgiv.com/admin/api/reporting/transactions";

/** Qgiv ids are numeric today; the pattern stays permissive but bounded, since
 * this value is interpolated into the request path. */
const TRANSACTION_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** Qgiv also returns "Declined" and "Error" for real transactions. */
export const ACCEPTED_STATUS = "Accepted";

export const MEMBERSHIP_FORMS: Record<string, { tag: string; hubInvite: boolean }> = {
  // Pilot Membership Form
  "1116610": { tag: "member", hubInvite: true },
  // Supporting Members Form — funds the work, but does not join teams or the
  // member chat, so deliberately no Hub invite.
  "1158315": { tag: "Supporting Member", hubInvite: false },
};

export const DONATION_FORMS: Record<string, { tag: string }> = {
  // T4P Website Donation Form
  "1094620": { tag: "donor" },
};

export function isValidTransactionId(value: unknown): value is string {
  return typeof value === "string" && TRANSACTION_ID_PATTERN.test(value);
}
```

- [ ] **Step 7: Run the test and verify it passes**

Run: `pnpm test`
Expected: PASS — 10 tests.

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts src/utils/qgivVerify.ts src/utils/qgivVerify.test.ts
git commit -m "test: add vitest and the Qgiv form allowlist"
```

---

### Task 2: Transaction lookup against the Qgiv API

**Files:**

- Modify: `src/utils/qgivVerify.ts`
- Modify: `src/utils/qgivVerify.test.ts`

**Interfaces:**

- Consumes: `isValidTransactionId`, `QGIV_API_BASE`, `ACCEPTED_STATUS` from Task 1.
- Produces:
  - `interface VerifiedTransaction { id: string; formId: string; email: string; firstName: string; lastName: string; amount: string; optedIn: boolean }`
  - `type VerifyFailure = "invalid-id" | "not-configured" | "lookup-failed" | "not-accepted" | "form-not-allowed"`
  - `type VerifyResult = { ok: true; transaction: VerifiedTransaction } | { ok: false; reason: VerifyFailure }`
  - `verifyQgivTransaction(transactionId: unknown, allowedFormIds: readonly string[], locals: App.Locals): Promise<VerifyResult>`

- [ ] **Step 1: Write the failing tests**

Append to `src/utils/qgivVerify.test.ts`:

```ts
import { afterEach, beforeEach, vi } from "vitest";
import { QGIV_API_BASE, verifyQgivTransaction } from "./qgivVerify";

const LOCALS = { runtime: { env: { QGIV_API_TOKEN: "test-token" } } } as unknown as App.Locals;
const MEMBERSHIP_IDS = ["1116610", "1158315"] as const;

function qgivResponse(overrides: Record<string, unknown> = {}) {
  return {
    transactions: [
      {
        id: "555001",
        formId: "1116610",
        form: { id: "1116610", name: "Pilot Membership Form" },
        transStatus: "Accepted",
        contactEmail: "payer@example.org",
        firstName: "Ada",
        lastName: "Lovelace",
        value: "25.00",
        optedIn: true,
        isRecurring: "y",
        ...overrides,
      },
    ],
  };
}

function mockFetchJson(payload: unknown, ok = true) {
  return vi.fn().mockResolvedValue({ ok, json: async () => payload } as Response);
}

describe("verifyQgivTransaction", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetchJson(qgivResponse()));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the transaction Qgiv reports, not anything the caller sent", async () => {
    const result = await verifyQgivTransaction("555001", MEMBERSHIP_IDS, LOCALS);
    expect(result).toEqual({
      ok: true,
      transaction: {
        id: "555001",
        formId: "1116610",
        email: "payer@example.org",
        firstName: "Ada",
        lastName: "Lovelace",
        amount: "25.00",
        optedIn: true,
      },
    });
  });

  it("sends the token in the request body, never in the URL", async () => {
    const fetchMock = mockFetchJson(qgivResponse());
    vi.stubGlobal("fetch", fetchMock);

    await verifyQgivTransaction("555001", MEMBERSHIP_IDS, LOCALS);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${QGIV_API_BASE}/555001.json`);
    expect(String(url)).not.toContain("test-token");
    expect(init.method).toBe("POST");
    expect(String(init.body)).toContain("token=test-token");
  });

  it("refuses a malformed id without calling Qgiv at all", async () => {
    const fetchMock = mockFetchJson(qgivResponse());
    vi.stubGlobal("fetch", fetchMock);

    const result = await verifyQgivTransaction("../secrets", MEMBERSHIP_IDS, LOCALS);

    expect(result).toEqual({ ok: false, reason: "invalid-id" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed when the token is not configured", async () => {
    const result = await verifyQgivTransaction("555001", MEMBERSHIP_IDS, {
      runtime: { env: {} },
    } as unknown as App.Locals);
    expect(result).toEqual({ ok: false, reason: "not-configured" });
  });

  it("refuses a declined payment", async () => {
    vi.stubGlobal("fetch", mockFetchJson(qgivResponse({ transStatus: "Declined" })));
    const result = await verifyQgivTransaction("555001", MEMBERSHIP_IDS, LOCALS);
    expect(result).toEqual({ ok: false, reason: "not-accepted" });
  });

  it("refuses a transaction from a form the endpoint does not serve", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchJson(qgivResponse({ formId: "1094620", form: { id: "1094620" } }))
    );
    const result = await verifyQgivTransaction("555001", MEMBERSHIP_IDS, LOCALS);
    expect(result).toEqual({ ok: false, reason: "form-not-allowed" });
  });

  it("refuses the Qgiv Test Form", async () => {
    vi.stubGlobal("fetch", mockFetchJson(qgivResponse({ formId: "1122160" })));
    const result = await verifyQgivTransaction("555001", MEMBERSHIP_IDS, LOCALS);
    expect(result).toEqual({ ok: false, reason: "form-not-allowed" });
  });

  it("refuses a record whose id does not match the one requested", async () => {
    vi.stubGlobal("fetch", mockFetchJson(qgivResponse({ id: "999999" })));
    const result = await verifyQgivTransaction("555001", MEMBERSHIP_IDS, LOCALS);
    expect(result).toEqual({ ok: false, reason: "lookup-failed" });
  });

  it("fails closed on a non-ok response", async () => {
    vi.stubGlobal("fetch", mockFetchJson({}, false));
    const result = await verifyQgivTransaction("555001", MEMBERSHIP_IDS, LOCALS);
    expect(result).toEqual({ ok: false, reason: "lookup-failed" });
  });

  it("fails closed when the network throws or times out", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    const result = await verifyQgivTransaction("555001", MEMBERSHIP_IDS, LOCALS);
    expect(result).toEqual({ ok: false, reason: "lookup-failed" });
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `pnpm test`
Expected: FAIL — `verifyQgivTransaction` is not exported.

- [ ] **Step 3: Write the implementation**

Append to `src/utils/qgivVerify.ts`:

```ts
import { getEnv } from "./getEnv";

const VERIFY_TIMEOUT_MS = 5000;

export interface VerifiedTransaction {
  id: string;
  formId: string;
  email: string;
  firstName: string;
  lastName: string;
  amount: string;
  optedIn: boolean;
}

export type VerifyFailure =
  | "invalid-id"
  | "not-configured"
  | "lookup-failed"
  | "not-accepted"
  | "form-not-allowed";

export type VerifyResult =
  | { ok: true; transaction: VerifiedTransaction }
  | { ok: false; reason: VerifyFailure };

/**
 * Qgiv wraps the transaction differently across its reporting routes, so walk
 * the payload for the record rather than assuming a shape. Requiring the id to
 * match is what stops a wrapper response smuggling a different transaction
 * through.
 */
function findTransaction(value: unknown, id: string): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findTransaction(item, id);
      if (found) return found;
    }
    return null;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("formId" in record && "transStatus" in record && String(record.id) === id) {
      return record;
    }
    for (const nested of Object.values(record)) {
      const found = findTransaction(nested, id);
      if (found) return found;
    }
  }

  return null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

export async function verifyQgivTransaction(
  transactionId: unknown,
  allowedFormIds: readonly string[],
  locals: App.Locals
): Promise<VerifyResult> {
  if (!isValidTransactionId(transactionId)) return { ok: false, reason: "invalid-id" };

  const token = getEnv("QGIV_API_TOKEN", locals);
  if (!token) return { ok: false, reason: "not-configured" };

  let payload: unknown;
  try {
    const response = await fetch(`${QGIV_API_BASE}/${transactionId}.json`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }).toString(),
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    });
    if (!response.ok) return { ok: false, reason: "lookup-failed" };
    payload = await response.json();
  } catch {
    return { ok: false, reason: "lookup-failed" };
  }

  const record = findTransaction(payload, transactionId);
  if (!record) return { ok: false, reason: "lookup-failed" };

  if (asString(record.transStatus) !== ACCEPTED_STATUS) {
    return { ok: false, reason: "not-accepted" };
  }

  const formId = asString(record.formId);
  if (!allowedFormIds.includes(formId)) return { ok: false, reason: "form-not-allowed" };

  return {
    ok: true,
    transaction: {
      id: transactionId,
      formId,
      email: asString(record.contactEmail),
      firstName: asString(record.firstName),
      lastName: asString(record.lastName),
      amount: asString(record.value),
      optedIn: record.optedIn === true || record.optedIn === "y",
    },
  };
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `pnpm test`
Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/utils/qgivVerify.ts src/utils/qgivVerify.test.ts
git commit -m "feat(security): look Qgiv transactions up server-side"
```

---

### Task 3: Single-use transaction guard

**Files:**

- Create: `src/utils/transactionReplay.ts`
- Create: `src/utils/transactionReplay.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `claimTransaction(kv: KVNamespace | undefined, transactionId: string): Promise<boolean>` — resolves `true` when the caller may proceed, `false` when this id has already been used.

- [ ] **Step 1: Write the failing test**

Create `src/utils/transactionReplay.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm test src/utils/transactionReplay.test.ts`
Expected: FAIL — cannot resolve `./transactionReplay`.

- [ ] **Step 3: Write the implementation**

Create `src/utils/transactionReplay.ts`:

```ts
/**
 * Makes a verified Qgiv transaction id single-use.
 *
 * Replay is a lesser harm than forgery — a replayed id only ever re-invites
 * the person who genuinely paid — so this guard deliberately fails *open*:
 * a KV outage must not cost a real member their invite, whereas a failed
 * payment verification must always fail closed.
 */
const REPLAY_KEY_PREFIX = "qgiv-txn:";
const REPLAY_TTL_SECONDS = 60 * 60 * 24 * 30;

export async function claimTransaction(
  kv: KVNamespace | undefined,
  transactionId: string
): Promise<boolean> {
  if (!kv) return true;

  try {
    const key = `${REPLAY_KEY_PREFIX}${transactionId}`;
    if (await kv.get(key)) return false;
    await kv.put(key, new Date().toISOString(), { expirationTtl: REPLAY_TTL_SECONDS });
    return true;
  } catch {
    return true;
  }
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/transactionReplay.ts src/utils/transactionReplay.test.ts
git commit -m "feat(security): make verified Qgiv transaction ids single-use"
```

---

### Task 4: Rewrite `/api/membership-complete`

**Files:**

- Modify: `src/pages/api/membership-complete.ts` (replace lines 18–131; keep the `OPTIONS` handler and `ORIGIN_POLICY` as they are)
- Create: `src/pages/api/membership-complete.test.ts`

**Interfaces:**

- Consumes: `verifyQgivTransaction`, `MEMBERSHIP_FORMS` (Task 2); `claimTransaction` (Task 3).
- Produces: a `POST` handler that accepts `{ transactionId }` only.

- [ ] **Step 1: Write the failing test**

Create `src/pages/api/membership-complete.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../utils/qgivVerify", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/qgivVerify")>();
  return { ...actual, verifyQgivTransaction: vi.fn() };
});
vi.mock("../../lib/report-error", () => ({ reportError: vi.fn() }));

const { verifyQgivTransaction } = await import("../../utils/qgivVerify");
const { POST } = await import("./membership-complete");

const LOCALS = {
  runtime: { env: { HUB_API_URL: "https://hub.test", HUB_API_KEY: "k", EO_API_KEY: "eo" } },
} as unknown as App.Locals;

function request(body: unknown, origin = "https://techforpalestine.org") {
  return new Request("https://techforpalestine.org/api/membership-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
}

function call(body: unknown, origin?: string) {
  return POST({ request: request(body, origin), locals: LOCALS } as never);
}

describe("POST /api/membership-complete", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("refuses a forged Origin", async () => {
    const response = await call({ transactionId: "555001" }, "https://evil.example");
    expect(response.status).toBe(403);
    expect(verifyQgivTransaction).not.toHaveBeenCalled();
  });

  it("refuses a request with no transaction id", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue({ ok: false, reason: "invalid-id" });
    const response = await call({ email: "attacker@example.org" });
    expect(response.status).toBe(402);
  });

  it("never invites or subscribes when verification fails", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue({ ok: false, reason: "not-accepted" });
    const response = await call({ transactionId: "555001" });
    expect(response.status).toBe(402);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("ignores a caller-supplied email and uses the one Qgiv reports", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue({
      ok: true,
      transaction: {
        id: "555001",
        formId: "1116610",
        email: "payer@example.org",
        firstName: "Ada",
        lastName: "Lovelace",
        amount: "25.00",
        optedIn: true,
      },
    });

    const response = await call({ transactionId: "555001", email: "victim@example.org" });

    expect(response.status).toBe(200);
    const bodies = vi.mocked(fetch).mock.calls.map(([, init]) => String((init as RequestInit).body));
    expect(bodies.join(" ")).toContain("payer@example.org");
    expect(bodies.join(" ")).not.toContain("victim@example.org");
  });

  it("ignores a caller-supplied tier and derives it from the verified form", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue({
      ok: true,
      transaction: {
        id: "555002",
        formId: "1158315",
        email: "supporter@example.org",
        firstName: "",
        lastName: "",
        amount: "5.00",
        optedIn: true,
      },
    });

    await call({ transactionId: "555002", tier: "member" });

    const urls = vi.mocked(fetch).mock.calls.map(([url]) => String(url));
    expect(urls.some((url) => url.includes("/api/auth/invite"))).toBe(false);
    const bodies = vi.mocked(fetch).mock.calls.map(([, init]) => String((init as RequestInit).body));
    expect(bodies.join(" ")).toContain("Supporting Member");
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm test src/pages/api/membership-complete.test.ts`
Expected: FAIL — the handler still accepts `email` and returns 400, not 402.

- [ ] **Step 3: Replace the handler body**

In `src/pages/api/membership-complete.ts`, delete the `EO_MEMBERS_LIST_URL`/`MAX_NAME_LENGTH`/`TIERS` block and the whole `POST` handler (lines 18–146), keeping the imports, `prerender`, `ORIGIN_POLICY`, and `OPTIONS`. Add these imports at the top:

```ts
import { MEMBERSHIP_FORMS, verifyQgivTransaction } from "../../utils/qgivVerify";
import { claimTransaction } from "../../utils/transactionReplay";
```

Then insert:

```ts
const EO_MEMBERS_LIST_URL =
  "https://emailoctopus.com/api/1.6/lists/8adc2ed4-f798-11ef-b60f-115427c25a1c/contacts";

const ALLOWED_FORM_IDS = Object.keys(MEMBERSHIP_FORMS);

export const POST: APIRoute = async ({ request, locals }) => {
  // Kept as defence in depth against drive-by cross-site calls. It is no
  // longer the access control: that is the Qgiv lookup below.
  const origin = request.headers.get("Origin");
  if (!isAllowedOrigin(origin, ORIGIN_POLICY)) {
    return new Response(JSON.stringify({ message: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ctx = (locals as { runtime?: { ctx?: { waitUntil: (p: Promise<unknown>) => void } } })
    .runtime?.ctx;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ message: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }

  // `transactionId` is the only thing read from the caller. Email, names and
  // tier all come from Qgiv, so a forged request cannot name a victim's
  // address or upgrade itself to the paid tier.
  const verified = await verifyQgivTransaction(body.transactionId, ALLOWED_FORM_IDS, locals);

  if (!verified.ok) {
    reportError(new Error(`Qgiv verification refused: ${verified.reason}`), {
      context: "membership-complete verify",
      reason: verified.reason,
    });
    ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));
    return new Response(JSON.stringify({ message: "Could not verify transaction" }), {
      status: 402,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }

  const { id, formId, email, firstName, lastName } = verified.transaction;
  const tier = MEMBERSHIP_FORMS[formId];
  const redacted = `[redacted]@${email.split("@")[1]}`;

  if (!(await claimTransaction(locals.runtime?.env?.DROPPED_CONVERSIONS, id))) {
    return new Response(JSON.stringify({ success: true, message: "Already processed" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }

  const hubApiUrl = getEnv("HUB_API_URL", locals);
  const hubApiKey = getEnv("HUB_API_KEY", locals);
  const eoApiKey = getEnv("EO_API_KEY", locals);

  try {
    await Promise.allSettled([
      tier.hubInvite && hubApiUrl && hubApiKey
        ? fetch(`${hubApiUrl}/api/auth/invite`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${hubApiKey}` },
            body: JSON.stringify({ email, type: "paid" }),
          })
            .then(async (res) => {
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                reportError(new Error(`Hub invite failed: ${res.status}`), {
                  context: "membership-complete",
                  email: redacted,
                  status: res.status,
                  body: data,
                });
              }
            })
            .catch((err) =>
              reportError(err, { context: "membership-complete hub", email: redacted })
            )
        : Promise.resolve(),

      eoApiKey
        ? fetch(EO_MEMBERS_LIST_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_key: eoApiKey,
              email_address: email,
              fields: { FirstName: firstName, LastName: lastName },
              tags: [tier.tag],
              status: "SUBSCRIBED",
            }),
          })
            .then(async (res) => {
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                reportError(new Error(`EmailOctopus failed: ${res.status}`), {
                  context: "membership-complete eo",
                  email: redacted,
                  status: res.status,
                  body: data,
                });
              }
            })
            .catch((err) =>
              reportError(err, { context: "membership-complete eo", email: redacted })
            )
        : Promise.resolve(),
    ]);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  } catch (error) {
    reportError(error, { context: "membership-complete" });
    ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));

    return new Response(JSON.stringify({ message: "Failed to process request" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }
};
```

Note: the name-length cap is gone because names now come from Qgiv, not from the caller.

- [ ] **Step 4: Run the tests and verify they pass**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/membership-complete.ts src/pages/api/membership-complete.test.ts
git commit -m "fix(security): verify the Qgiv payment before inviting a member"
```

---

### Task 5: Rewrite `/api/donation-complete`

**Files:**

- Modify: `src/pages/api/donation-complete.ts` (replace lines 18–97)
- Create: `src/pages/api/donation-complete.test.ts`

**Interfaces:**

- Consumes: `verifyQgivTransaction`, `DONATION_FORMS` (Task 2); `claimTransaction` (Task 3).
- Produces: a `POST` handler accepting `{ transactionId }` only, which additionally requires verified `optedIn`.

- [ ] **Step 1: Write the failing test**

Create `src/pages/api/donation-complete.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../utils/qgivVerify", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/qgivVerify")>();
  return { ...actual, verifyQgivTransaction: vi.fn() };
});
vi.mock("../../lib/report-error", () => ({ reportError: vi.fn() }));

const { verifyQgivTransaction } = await import("../../utils/qgivVerify");
const { POST } = await import("./donation-complete");

const LOCALS = { runtime: { env: { EO_API_KEY: "eo" } } } as unknown as App.Locals;

function call(body: unknown, origin = "https://techforpalestine.org") {
  const request = new Request("https://techforpalestine.org/api/donation-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
  return POST({ request, locals: LOCALS } as never);
}

function donor(overrides: Record<string, unknown> = {}) {
  return {
    ok: true as const,
    transaction: {
      id: "777001",
      formId: "1094620",
      email: "donor@example.org",
      firstName: "Grace",
      lastName: "Hopper",
      amount: "50.00",
      optedIn: true,
      ...overrides,
    },
  };
}

describe("POST /api/donation-complete", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("refuses an unverifiable transaction", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue({ ok: false, reason: "lookup-failed" });
    const response = await call({ transactionId: "777001" });
    expect(response.status).toBe(402);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not subscribe a donor who declined the mailing list", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue(donor({ optedIn: false }));
    const response = await call({ transactionId: "777001" });
    expect(response.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("subscribes the address Qgiv reports, tagged donor", async () => {
    vi.mocked(verifyQgivTransaction).mockResolvedValue(donor());
    const response = await call({ transactionId: "777001", email: "victim@example.org" });

    expect(response.status).toBe(200);
    const body = String((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body);
    expect(body).toContain("donor@example.org");
    expect(body).not.toContain("victim@example.org");
    expect(body).toContain("donor");
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm test src/pages/api/donation-complete.test.ts`
Expected: FAIL — the handler still reads `email` from the body.

- [ ] **Step 3: Replace the handler body**

In `src/pages/api/donation-complete.ts`, add the imports:

```ts
import { DONATION_FORMS, verifyQgivTransaction } from "../../utils/qgivVerify";
import { claimTransaction } from "../../utils/transactionReplay";
```

Delete `MAX_NAME_LENGTH` and replace the `POST` handler with:

```ts
const ALLOWED_FORM_IDS = Object.keys(DONATION_FORMS);

export const POST: APIRoute = async ({ request, locals }) => {
  // Defence in depth only — the Qgiv lookup below is the access control.
  const origin = request.headers.get("Origin");
  if (!isAllowedOrigin(origin, ORIGIN_POLICY)) {
    return new Response(JSON.stringify({ message: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ctx = (locals as { runtime?: { ctx?: { waitUntil: (p: Promise<unknown>) => void } } })
    .runtime?.ctx;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ message: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }

  const verified = await verifyQgivTransaction(body.transactionId, ALLOWED_FORM_IDS, locals);

  if (!verified.ok) {
    reportError(new Error(`Qgiv verification refused: ${verified.reason}`), {
      context: "donation-complete verify",
      reason: verified.reason,
    });
    ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));
    return new Response(JSON.stringify({ message: "Could not verify transaction" }), {
      status: 402,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }

  const { id, email, firstName, lastName, optedIn } = verified.transaction;

  // donate.astro checks this client-side, which a forged request can simply
  // omit. Qgiv's own record is what decides whether the donor consented.
  if (!optedIn) {
    return new Response(JSON.stringify({ success: true, message: "Not opted in" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }

  if (!(await claimTransaction(locals.runtime?.env?.DROPPED_CONVERSIONS, id))) {
    return new Response(JSON.stringify({ success: true, message: "Already processed" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }

  const eoApiKey = getEnv("EO_API_KEY", locals);
  const redacted = `[redacted]@${email.split("@")[1]}`;

  try {
    if (eoApiKey) {
      const res = await fetch(EO_MEMBERS_LIST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: eoApiKey,
          email_address: email,
          fields: { FirstName: firstName, LastName: lastName },
          tags: ["donor"],
          status: "SUBSCRIBED",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        reportError(new Error(`EmailOctopus failed: ${res.status}`), {
          context: "donation-complete eo",
          email: redacted,
          status: res.status,
          body: data,
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  } catch (error) {
    reportError(error, { context: "donation-complete" });
    ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));

    return new Response(JSON.stringify({ message: "Failed to process request" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }
};
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/donation-complete.ts src/pages/api/donation-complete.test.ts
git commit -m "fix(security): verify the Qgiv donation before writing to EmailOctopus"
```

---

### Task 6: Send the transaction id from both clients

**Files:**

- Modify: `src/components/membership/QgivJoin.tsx:29-34` (the `QgivTransactionDetail` interface) and `:181-213` (the `donationComplete` effect)
- Modify: `src/pages/donate.astro:294-323` (the `QGIV.donationComplete` listener)
- Modify: `src/env.d.ts:28-32` (the `Window.QGIV` type)

**Interfaces:**

- Consumes: the `POST` handlers from Tasks 4 and 5, which now accept `{ transactionId }`.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Widen the `Window.QGIV` type**

In `src/env.d.ts`, replace the `QGIV?: { Embed?: ... }` declaration with:

```ts
    QGIV?: {
      Embed?: {
        initializeEmbeds?: () => void;
      };
      /** Qgiv also exposes the completed transaction as a global, which is the
       * fallback when the `donationComplete` CustomEvent carries no detail. */
      transaction?: {
        id?: string;
      };
    };
```

- [ ] **Step 2: Add the id to `QgivTransactionDetail`**

In `src/components/membership/QgivJoin.tsx`, change the interface to:

```ts
interface QgivTransactionDetail {
  QGIV?: {
    transaction?: { id?: string; total?: number | string };
    contact?: { email?: string; firstName?: string; lastName?: string };
  };
}
```

- [ ] **Step 3: Send only the transaction id**

In the same file, replace the body of `handleDonationComplete` after the Plausible call with:

```ts
      // The server verifies this id against Qgiv and reads the contact details
      // from Qgiv's own record, so nothing else needs to be sent — and nothing
      // else would be trusted if it were.
      const transactionId = transaction.id ?? window.QGIV?.transaction?.id ?? "";
      if (!transactionId) return;

      fetch("/api/membership-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      }).catch(() => {});
```

Delete the now-unused `const email = contact.email ?? "";` line and its guard. Keep `contact` destructured only if the Plausible block still uses it; it does not, so remove `const contact = detail.QGIV?.contact ?? {};` as well.

- [ ] **Step 4: Update the donate page listener**

In `src/pages/donate.astro`, replace the `if (contact.optedIn === true && contact.email) { ... }` block with:

```js
        // Opt-in is re-checked server-side against Qgiv's record; the client
        // check here only avoids a pointless request.
        var transactionId = transaction.id || (window.QGIV && window.QGIV.transaction && window.QGIV.transaction.id);
        if (contact.optedIn === true && transactionId) {
          fetch("/api/donation-complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transactionId: transactionId }),
          }).catch(function () {});
        }
```

- [ ] **Step 5: Verify the tests still pass**

Run: `pnpm test`
Expected: PASS — no test covers the client islands, so this confirms nothing regressed.

- [ ] **Step 6: Commit**

```bash
git add src/components/membership/QgivJoin.tsx src/pages/donate.astro src/env.d.ts
git commit -m "refactor(security): send only the Qgiv transaction id from the client"
```

---

### Task 7: Documentation and deployment notes

**Files:**

- Modify: `docs/API.md:14-15`
- Modify: `docs/DONATIONS.md` (flow diagram, components table, origin-checks section, env vars)
- Modify: `docs/ENVIRONMENT.md` (add the `QGIV_API_TOKEN` row)
- Modify: `DEPLOYMENT.md:31-32`
- Modify: `docs/SECURITY.md`
- Modify: `CLAUDE.md` (Security Model section)

**Interfaces:**

- Consumes: everything above.
- Produces: nothing.

- [ ] **Step 1: Update `docs/API.md`**

Change the auth column for both rows from the origin-allowlist description to:

`Qgiv transaction verification (server-side lookup via QGIV_API_TOKEN) + Origin allowlist as defence in depth`

and change both notes to state that the request body is `{ transactionId }` only, that email/name/tier are read from Qgiv, and that verification failure returns `402`.

- [ ] **Step 2: Update `docs/DONATIONS.md`**

Replace the top of the flow diagram with:

```
QGIV embedded widget (donate.astro / membership.astro)
        │  on success, client-side callback sends { transactionId } only
        ▼
POST /api/donation-complete  or  /api/membership-complete
        │
        ├──▶ Qgiv Transactions API — verify the transaction exists,
        │    status is "Accepted", and its formId is allowed here.
        │    Fails closed on any error. Email/name/tier come from here.
        │
        ├──▶ KV single-use guard (qgiv-txn:<id>)
        ├──▶ EmailOctopus (tag contact "donor" or "member")
        └──▶ (membership only) Hub API — invite as paid member
```

Add a section documenting the form allowlist table from the Design Reference above, and add `QGIV_API_TOKEN` to the env-var list. Rewrite the "Origin checks" section to say the origin check is now defence in depth rather than the access control.

- [ ] **Step 3: Update `docs/ENVIRONMENT.md`**

Add a row matching the existing table format:

`| QGIV_API_TOKEN | getEnv | ✅ | ❌ | ❌ | /api/membership-complete, /api/donation-complete |`

- [ ] **Step 4: Update `DEPLOYMENT.md`**

Under the env-var list, after the `EO_API_KEY` line, add:

`- QGIV_API_TOKEN — Qgiv reporting API token used to verify completed transactions server-side. Permanent token, scoped to the membership, supporting-member and donation forms. **Required:** without it both completion endpoints fail closed and no member is invited.`

- [ ] **Step 5: Update `docs/SECURITY.md` and `CLAUDE.md`**

Add a rule to both, in the style of the surrounding entries:

`**Payment-triggered side effects must be verified against the payment processor.** An Origin header is set freely by any HTTP client and is never access control. /api/membership-complete and /api/donation-complete read the transaction back from Qgiv (src/utils/qgivVerify.ts) and derive email, names and tier from that record, never from the request body. (S-1: both endpoints once granted Hub invites and mailing-list writes behind an Origin check alone.)`

- [ ] **Step 6: Commit**

```bash
git add docs/API.md docs/DONATIONS.md docs/ENVIRONMENT.md DEPLOYMENT.md docs/SECURITY.md CLAUDE.md
git commit -m "docs(security): document Qgiv transaction verification"
```

---

## Deployment checklist (human, not the executor)

1. Add `QGIV_API_TOKEN` to the Cloudflare Pages dashboard env vars for **production and preview**. Until it is set, both endpoints fail closed and every completion is refused.
2. Confirm the token is Permanent and scoped to forms `1116610`, `1158315` and `1094620`.
3. After deploy, make one real low-value transaction on each of the three forms and confirm the invite and the EmailOctopus tag land.
4. Re-run the audit's proof, which should now stop at `402` rather than reaching the handler:

```bash
curl -X POST https://techforpalestine.org/api/membership-complete \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://techforpalestine.org' \
  --data '{"email":"attacker@example.org"}'
```

## Known limitations

- **`QgivJoin` and `donate.astro` are fire-and-forget.** If the browser closes before the fetch lands, the member is never invited. That was already true and this plan does not change it; a webhook would fix it, and the user has ruled one out.
- **Qgiv propagation.** If the reporting API does not yet know about a just-completed transaction, verification fails closed and the Sentry alert is the only recovery path. Watch that alert after launch; if it fires often, revisit with a retry.
