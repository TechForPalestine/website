# Homepage Newsletter Popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show homepage visitors a dismissible bottom-right card (a slim bar on mobile) containing the existing EmailOctopus signup form, gated by a GrowthBook flag and measured with Plausible events.

**Architecture:** EmailOctopus's embed script can only run once per `document`, so the popup's copy of form `19239af2…` lives in a same-origin iframe page, `/newsletter-embed`. That page tells the homepage about its height and about successful signups over `postMessage`. A React island, `NewsletterPopup`, decides when to show the card from pure, unit-tested helpers in `src/utils/newsletterPopup.ts`. The CSP middleware allows only our own origin to frame that page, and adds framing protection to every other page.

**Tech Stack:** Astro 5 (SSR, Cloudflare), React 19 island (`client:only="react"`), Tailwind, `@growthbook/growthbook-react` 1.7, Plausible (`window.plausible`), Vitest 3 (node environment, `src/**/*.test.ts`).

**Spec:** `docs/superpowers/specs/2026-09-23-newsletter-popup-design.md`

## Global Constraints

- Package manager is `pnpm`. Tests: `pnpm test`. Types: `pnpm check`. Never `npx astro` or `yarn`.
- Form ID, exactly: `19239af2-f79d-11ef-b1dc-d39ed3d42a2b`. It is rendered by the existing `src/structures/SignUpForm.astro`; do not create a second EmailOctopus form.
- GrowthBook flag key: `homepage-newsletter-popup` (boolean, default `false`).
- localStorage key: `t4p-newsletter-popup`. Values: `{"dismissedAt": <epoch ms>}` or `{"subscribed": true}`.
- Timing: show after `10_000` ms or at `0.35` of the scrollable distance, whichever comes first. Re-show `30` days after a dismissal. Never re-show after a popup signup.
- Breakpoint: desktop card at `(min-width: 768px)`; below that, the collapsed bar reading `Get T4P updates →`.
- Plausible event names, exactly: `Newsletter Popup Shown`, `Newsletter Popup Dismissed`, `Newsletter Signup` with `props: { source: "popup" | "footer" }`.
- CSP: never add `'unsafe-inline'`; never write a `style=""` attribute in markup. Set dynamic styles through CSSOM (`el.style.height = ...`).
- `postMessage` target origin is always `window.location.origin`, never `"*"`.
- Colours and radii come from Tailwind tokens only (`grove`, `paper`, `stone`, `ink-*`, `rounded-md`, `rounded-pill`). No hex literals. See `DESIGN.md`.
- Commits use conventional format with a scope, e.g. `feat(home): …`, `feat(security): …`. No `Co-Authored-By` lines.
- Do not start the dev server or curl pages to "check" them. The human verifies in the browser in Task 7.

## Review Focus

1. **localStorage throws or is missing** (Safari private mode, blocked site data): the popup must still show and close without errors; it just won't be remembered. Tested in Task 1 (`readPopupState`/`writePopupState` with a throwing storage).
2. **A corrupt or foreign value under the storage key** (hand-edited, older format, `"null"`, a bare number): treat it as "never seen", don't crash. Tested in Task 1 (`parsePopupState`).
3. **`dismissedAt` in the future** (clock was wrong when dismissed): must not hide the popup for years. Treat a negative age as "not suppressed". Tested in Task 1 (`isSuppressed`).
4. **Other scripts posting `message` events** (pal-chat, browser extensions, Qgiv) or malformed or huge heights: ignore them; never resize to an absurd height. Tested in Task 1 (`parseEmbedMessage`); origin and source checks are in Task 5.
5. **`/newsletter-embed/` requested with a trailing slash**, or any other path: only the exact embed path may be framed, and everything else gets `frame-ancestors 'none'`. Tested in Task 2 (`isEmbeddablePath`, `buildCspHeader`).

---

### Task 1: Popup decision helpers

**Files:**
- Create: `src/utils/newsletterPopup.ts`
- Test: `src/utils/newsletterPopup.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (all exported from `src/utils/newsletterPopup.ts`):
  - constants `POPUP_FLAG`, `POPUP_STORAGE_KEY`, `SHOW_DELAY_MS`, `SCROLL_TRIGGER_RATIO`, `DISMISS_SUPPRESS_MS`, `EMBED_PATH` (`"/newsletter-embed"`), `EMBED_MESSAGE_SOURCE`, `MAX_EMBED_HEIGHT`, `FOOTER_SECTION_ID` (`"mailing-list"`), `DESKTOP_QUERY`
  - `type PopupState = { dismissedAt: number } | { subscribed: true } | null`
  - `type EmbedMessage = { type: "resize"; height: number } | { type: "success" }`
  - `parsePopupState(raw: string | null): PopupState`
  - `readPopupState(storage: Pick<Storage, "getItem"> | null): PopupState`
  - `writePopupState(storage: Pick<Storage, "setItem"> | null, state: Exclude<PopupState, null>): void`
  - `safeLocalStorage(): Storage | null`
  - `isSuppressed(state: PopupState, now: number): boolean`
  - `hasReachedScrollTrigger(scrollY: number, viewportHeight: number, documentHeight: number): boolean`
  - `parseEmbedMessage(data: unknown): EmbedMessage | null`
  - `toEmbedPayload(message: EmbedMessage): EmbedMessage & { source: string }`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/newsletterPopup.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  DISMISS_SUPPRESS_MS,
  EMBED_MESSAGE_SOURCE,
  MAX_EMBED_HEIGHT,
  POPUP_STORAGE_KEY,
  hasReachedScrollTrigger,
  isSuppressed,
  parseEmbedMessage,
  parsePopupState,
  readPopupState,
  toEmbedPayload,
  writePopupState,
} from "./newsletterPopup";

const NOW = Date.UTC(2026, 8, 23);
const DAY = 24 * 60 * 60 * 1000;

describe("parsePopupState", () => {
  it("returns null when nothing is stored", () => {
    expect(parsePopupState(null)).toBeNull();
  });

  it("reads a dismissal timestamp", () => {
    expect(parsePopupState(JSON.stringify({ dismissedAt: NOW }))).toEqual({ dismissedAt: NOW });
  });

  it("reads a subscription", () => {
    expect(parsePopupState(JSON.stringify({ subscribed: true }))).toEqual({ subscribed: true });
  });

  it.each(["not json", "null", "42", '"x"', "[]", '{"dismissedAt":"yesterday"}', '{"subscribed":"yes"}'])(
    "treats a corrupt or foreign value %s as unset",
    (raw) => {
      expect(parsePopupState(raw)).toBeNull();
    }
  );
});

describe("readPopupState / writePopupState", () => {
  it("round-trips through storage under the popup key", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };
    writePopupState(storage, { dismissedAt: NOW });
    expect(store.has(POPUP_STORAGE_KEY)).toBe(true);
    expect(readPopupState(storage)).toEqual({ dismissedAt: NOW });
  });

  it("returns null when there is no storage", () => {
    expect(readPopupState(null)).toBeNull();
  });

  it("returns null instead of throwing when storage access throws", () => {
    const throwing = {
      getItem: () => {
        throw new DOMException("blocked", "SecurityError");
      },
    };
    expect(readPopupState(throwing)).toBeNull();
  });

  it("swallows write errors so the popup still closes", () => {
    const throwing = {
      setItem: () => {
        throw new DOMException("full", "QuotaExceededError");
      },
    };
    expect(() => writePopupState(throwing, { subscribed: true })).not.toThrow();
    expect(() => writePopupState(null, { subscribed: true })).not.toThrow();
  });
});

describe("isSuppressed", () => {
  it("does not suppress a first-time visitor", () => {
    expect(isSuppressed(null, NOW)).toBe(false);
  });

  it("always suppresses after a popup signup", () => {
    expect(isSuppressed({ subscribed: true }, NOW + 365 * DAY)).toBe(true);
  });

  it("suppresses for 30 days after a dismissal", () => {
    expect(DISMISS_SUPPRESS_MS).toBe(30 * DAY);
    expect(isSuppressed({ dismissedAt: NOW }, NOW + 29 * DAY)).toBe(true);
    expect(isSuppressed({ dismissedAt: NOW }, NOW + 30 * DAY)).toBe(false);
  });

  it("does not suppress when the dismissal is dated in the future", () => {
    expect(isSuppressed({ dismissedAt: NOW + 400 * DAY }, NOW)).toBe(false);
  });
});

describe("hasReachedScrollTrigger", () => {
  // 3000px page, 1000px viewport => 2000px scrollable; 35% = 700px
  it("fires at 35% of the scrollable distance", () => {
    expect(hasReachedScrollTrigger(699, 1000, 3000)).toBe(false);
    expect(hasReachedScrollTrigger(700, 1000, 3000)).toBe(true);
  });

  it("never fires on a page that cannot scroll (the timer covers it)", () => {
    expect(hasReachedScrollTrigger(0, 1000, 1000)).toBe(false);
    expect(hasReachedScrollTrigger(0, 1000, 800)).toBe(false);
  });
});

describe("parseEmbedMessage", () => {
  it("accepts a resize from the embed", () => {
    expect(parseEmbedMessage({ source: EMBED_MESSAGE_SOURCE, type: "resize", height: 240.4 })).toEqual({
      type: "resize",
      height: 241,
    });
  });

  it("clamps absurd heights", () => {
    expect(parseEmbedMessage({ source: EMBED_MESSAGE_SOURCE, type: "resize", height: 99999 })).toEqual({
      type: "resize",
      height: MAX_EMBED_HEIGHT,
    });
  });

  it("accepts a success from the embed", () => {
    expect(parseEmbedMessage({ source: EMBED_MESSAGE_SOURCE, type: "success" })).toEqual({ type: "success" });
  });

  it.each([
    null,
    "success",
    { type: "success" },
    { source: "pal-chat", type: "success" },
    { source: EMBED_MESSAGE_SOURCE, type: "resize", height: "240" },
    { source: EMBED_MESSAGE_SOURCE, type: "resize", height: -5 },
    { source: EMBED_MESSAGE_SOURCE, type: "resize", height: Number.NaN },
    { source: EMBED_MESSAGE_SOURCE, type: "redirect", url: "https://evil.example" },
  ])("ignores %j", (data) => {
    expect(parseEmbedMessage(data)).toBeNull();
  });

  it("round-trips what the embed sends", () => {
    expect(parseEmbedMessage(toEmbedPayload({ type: "success" }))).toEqual({ type: "success" });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test src/utils/newsletterPopup.test.ts`
Expected: FAIL with `Failed to resolve import "./newsletterPopup"`.

- [ ] **Step 3: Write the implementation**

Create `src/utils/newsletterPopup.ts`:

```ts
// Pure decision logic for the homepage newsletter popup
// (src/components/home/NewsletterPopup.tsx) and the iframe page it embeds
// (src/pages/newsletter-embed.astro). Kept DOM-free so it runs under Vitest's
// node environment. See docs/superpowers/specs/2026-09-23-newsletter-popup-design.md.

export const POPUP_FLAG = "homepage-newsletter-popup";
export const POPUP_STORAGE_KEY = "t4p-newsletter-popup";
export const SHOW_DELAY_MS = 10_000;
export const SCROLL_TRIGGER_RATIO = 0.35;
export const DISMISS_SUPPRESS_MS = 30 * 24 * 60 * 60 * 1000;
export const EMBED_PATH = "/newsletter-embed";
export const EMBED_MESSAGE_SOURCE = "t4p-newsletter-embed";
export const MAX_EMBED_HEIGHT = 1200;
export const FOOTER_SECTION_ID = "mailing-list";
export const DESKTOP_QUERY = "(min-width: 768px)";

export type PopupState = { dismissedAt: number } | { subscribed: true } | null;
export type EmbedMessage = { type: "resize"; height: number } | { type: "success" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parsePopupState(raw: string | null): PopupState {
  if (raw === null) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(value)) return null;
  if (value.subscribed === true) return { subscribed: true };
  if (typeof value.dismissedAt === "number" && Number.isFinite(value.dismissedAt)) {
    return { dismissedAt: value.dismissedAt };
  }
  return null;
}

export function readPopupState(storage: Pick<Storage, "getItem"> | null): PopupState {
  try {
    return parsePopupState(storage?.getItem(POPUP_STORAGE_KEY) ?? null);
  } catch {
    return null;
  }
}

export function writePopupState(
  storage: Pick<Storage, "setItem"> | null,
  state: Exclude<PopupState, null>
): void {
  try {
    storage?.setItem(POPUP_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage blocked or full: the popup still closes, it just won't be remembered.
  }
}

// Reading window.localStorage itself throws a SecurityError when site data is blocked.
export function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function isSuppressed(state: PopupState, now: number): boolean {
  if (state === null) return false;
  if ("subscribed" in state) return true;
  const age = now - state.dismissedAt;
  // A future timestamp means the clock was wrong when it was written; don't let
  // it hide the popup for years.
  return age >= 0 && age < DISMISS_SUPPRESS_MS;
}

export function hasReachedScrollTrigger(
  scrollY: number,
  viewportHeight: number,
  documentHeight: number
): boolean {
  const scrollable = documentHeight - viewportHeight;
  if (scrollable <= 0) return false;
  return scrollY / scrollable >= SCROLL_TRIGGER_RATIO;
}

export function parseEmbedMessage(data: unknown): EmbedMessage | null {
  if (!isRecord(data) || data.source !== EMBED_MESSAGE_SOURCE) return null;
  if (data.type === "success") return { type: "success" };
  if (data.type === "resize" && typeof data.height === "number" && Number.isFinite(data.height)) {
    if (data.height <= 0) return null;
    return { type: "resize", height: Math.min(Math.ceil(data.height), MAX_EMBED_HEIGHT) };
  }
  return null;
}

export function toEmbedPayload(message: EmbedMessage): EmbedMessage & { source: string } {
  return { source: EMBED_MESSAGE_SOURCE, ...message };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test src/utils/newsletterPopup.test.ts`
Expected: PASS, all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/utils/newsletterPopup.ts src/utils/newsletterPopup.test.ts
git commit -m "feat(home): add newsletter popup decision helpers"
```

---

### Task 2: Framing rules in the CSP middleware

Background: `public/_headers` sets `X-Frame-Options: DENY`, but Cloudflare doesn't apply `_headers` to Pages Functions responses, and every HTML page here is SSR. So pages currently have no framing protection. This task moves framing policy into the middleware, lets `/newsletter-embed` be framed by our own origin only, and allows the homepage to load it (`frame-src 'self'`).

**Files:**
- Create: `src/middleware/cspHeader.ts`
- Test: `src/middleware/cspHeader.test.ts`
- Modify: `src/middleware/csp.ts` (the inline `cspHeader` array, lines 24–35, and the header set at line 58)
- Modify: `public/_headers` (comment only)

**Interfaces:**
- Consumes: `EMBED_PATH` from `src/utils/newsletterPopup.ts` (Task 1).
- Produces: `isEmbeddablePath(pathname: string): boolean`, `buildCspHeader(nonce: string, pathname: string): string`, `frameOptionsFor(pathname: string): "SAMEORIGIN" | "DENY"`.

- [ ] **Step 1: Write the failing tests**

Create `src/middleware/cspHeader.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildCspHeader, frameOptionsFor, isEmbeddablePath } from "./cspHeader";

function directive(header: string, name: string): string | undefined {
  return header
    .split(";")
    .map((d) => d.trim())
    .find((d) => d.startsWith(`${name} `));
}

describe("isEmbeddablePath", () => {
  it.each(["/newsletter-embed", "/newsletter-embed/"])("allows %s", (p) => {
    expect(isEmbeddablePath(p)).toBe(true);
  });

  it.each(["/", "/donate", "/newsletter-embed/x", "/newsletter-embedded", "/api/newsletter-embed"])(
    "refuses %s",
    (p) => {
      expect(isEmbeddablePath(p)).toBe(false);
    }
  );
});

describe("buildCspHeader", () => {
  it("lets only our own origin frame the newsletter embed", () => {
    expect(directive(buildCspHeader("n", "/newsletter-embed"), "frame-ancestors")).toBe("frame-ancestors 'self'");
  });

  it("forbids framing every other page", () => {
    expect(directive(buildCspHeader("n", "/"), "frame-ancestors")).toBe("frame-ancestors 'none'");
  });

  it("allows same-origin iframes so the homepage can load the embed", () => {
    expect(directive(buildCspHeader("n", "/"), "frame-src")).toMatch(/^frame-src 'self' /);
  });

  it("keeps the per-request nonce and never allows unsafe-inline", () => {
    const header = buildCspHeader("abc123", "/");
    expect(directive(header, "script-src")).toContain("'nonce-abc123'");
    expect(directive(header, "style-src")).toContain("'nonce-abc123'");
    expect(header).not.toContain("unsafe-inline");
  });
});

describe("frameOptionsFor", () => {
  it("mirrors frame-ancestors for older browsers", () => {
    expect(frameOptionsFor("/newsletter-embed")).toBe("SAMEORIGIN");
    expect(frameOptionsFor("/")).toBe("DENY");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test src/middleware/cspHeader.test.ts`
Expected: FAIL with `Failed to resolve import "./cspHeader"`.

- [ ] **Step 3: Write `src/middleware/cspHeader.ts`**

Copy every directive from the current `csp.ts` array **unchanged**, except that `frame-src` gains `'self'` and `frame-ancestors` is new. This is a separate file because `csp.ts` imports `astro:middleware`, which Vitest can't resolve.

```ts
import { EMBED_PATH } from "../utils/newsletterPopup";

// Pages that our own pages may show in an iframe. Everything else refuses framing.
const EMBEDDABLE_PATHS = new Set([EMBED_PATH]);

export function isEmbeddablePath(pathname: string): boolean {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return EMBEDDABLE_PATHS.has(normalized);
}

export function frameOptionsFor(pathname: string): "SAMEORIGIN" | "DENY" {
  return isEmbeddablePath(pathname) ? "SAMEORIGIN" : "DENY";
}

export function buildCspHeader(nonce: string, pathname: string): string {
  return [
    "default-src 'self'",
    // 'strict-dynamic' trusts scripts loaded by nonced scripts; removes need for 'unsafe-inline'
    `script-src 'nonce-${nonce}' 'strict-dynamic' https://secure.qgiv.com https://pal-chat.net https://techforpalestine.org/cdn-cgi/ https://eomail4.com https://www.google.com https://www.gstatic.com https://cdn.jsdelivr.net https://prod-donation-elements-b-donationelementsjsfilesb-1m4f4dl6p6b21.s3.us-east-2.amazonaws.com`,
    `style-src 'nonce-${nonce}' 'self' https://fonts.googleapis.com https://secure.qgiv.com`,
    "font-src 'self' https://fonts.gstatic.com https://gallery.eo.page",
    "img-src 'self' data: https:",
    "connect-src 'self' https://plausible.io https://pal-chat.net https://eomail4.com https://www.google.com https://1k0gztb8b2.execute-api.us-east-2.amazonaws.com https://www.charitystack.com https://www.donation.charitystack.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://cdn.growthbook.io",
    // 'self' lets the homepage load /newsletter-embed (the popup's copy of the EmailOctopus form)
    "frame-src 'self' https://secure.qgiv.com https://calendly.com https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com https://validaid.org https://www.charitystack.com",
    `frame-ancestors ${isEmbeddablePath(pathname) ? "'self'" : "'none'"}`,
    "object-src 'none'",
    "base-uri 'self'",
  ].join("; ");
}
```

Before saving, diff the copied `script-src`, `style-src`, `font-src`, `img-src` and `connect-src` strings against `csp.ts` character for character. They must be identical.

- [ ] **Step 4: Wire it into `src/middleware/csp.ts`**

Add the import below the existing `astro:middleware` import:

```ts
import { buildCspHeader, frameOptionsFor } from "./cspHeader";
```

Replace the whole `const cspHeader = [ ... ].join("; ");` block (lines 24–35) with:

```ts
  const cspHeader = buildCspHeader(nonce, context.url.pathname);
```

Replace the final header lines:

```ts
  const transformed = rewriter.transform(response);
  transformed.headers.set("Content-Security-Policy", cspHeader);
  return transformed;
```

with:

```ts
  const transformed = rewriter.transform(response);
  transformed.headers.set("Content-Security-Policy", cspHeader);
  // Set here, not in public/_headers: Cloudflare doesn't apply _headers to
  // Pages Functions responses, and every HTML page on this site is SSR.
  transformed.headers.set("X-Frame-Options", frameOptionsFor(context.url.pathname));
  return transformed;
```

- [ ] **Step 5: Correct the stale comment in `public/_headers`**

Replace the two comment lines:

```
  # Content-Security-Policy is set dynamically per-request by src/middleware.ts
  # using a per-request nonce to avoid 'unsafe-inline' on script-src.
```

with:

```
  # Applies to static assets only: Cloudflare does not apply _headers to SSR
  # (Pages Functions) responses. For HTML pages, Content-Security-Policy and
  # X-Frame-Options are set per request in src/middleware/csp.ts.
```

- [ ] **Step 6: Run the tests and type check**

Run: `pnpm test && pnpm check`
Expected: all tests PASS; `astro check` reports 0 errors.

- [ ] **Step 7: Commit**

```bash
git add src/middleware/cspHeader.ts src/middleware/cspHeader.test.ts src/middleware/csp.ts public/_headers
git commit -m "feat(security): set frame-ancestors per page and allow framing only the newsletter embed"
```

---

### Task 3: Extract the CSP style patch into a shared component

The embed page needs the same inline-style workaround `Layout.astro` runs before any third-party script. EmailOctopus injects `style="…"` via `innerHTML`, which the CSP blocks. Move it into a component instead of duplicating ~75 lines.

**Files:**
- Create: `src/components/CspStylePatch.astro`
- Modify: `src/layouts/Layout.astro:58-135`

**Interfaces:**
- Consumes: `Astro.locals.cspNonce` (set by `src/middleware/csp.ts`).
- Produces: `<CspStylePatch />`, which renders `<meta name="csp-nonce">` plus the patch `<script is:inline>`. It must be placed in `<head>` before any third-party script.

- [ ] **Step 1: Create the component by moving lines verbatim**

Create `src/components/CspStylePatch.astro`. Its body is **exactly** lines 58–135 of `src/layouts/Layout.astro`: from `<meta name="csp-nonce" content={Astro.locals.cspNonce} />` through the `</script>` that closes the `(function () { … })();` block, just before `<title>`. Prepend this frontmatter:

```astro
---
// Must render in <head> before any third-party script. Rewrites style="" that
// scripts such as EmailOctopus inject, so the nonce-based CSP doesn't block
// them. Shared by Layout.astro and pages/newsletter-embed.astro.
---
```

- [ ] **Step 2: Replace the moved lines in `Layout.astro`**

Delete lines 58–135 from `src/layouts/Layout.astro` and put `<CspStylePatch />` in their place, between `<meta name="generator" … />` and `<title>{title}</title>`. Add to the frontmatter imports:

```ts
import CspStylePatch from "../components/CspStylePatch.astro";
```

- [ ] **Step 3: Verify it is a pure move**

Run: `git diff --color-moved=plain --stat src/layouts/Layout.astro src/components/CspStylePatch.astro`
Expected: Layout shows roughly 78 deletions and 2 insertions. The new component contains the same lines. Open the diff and confirm no characters changed inside the moved block.

Run: `pnpm check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/CspStylePatch.astro src/layouts/Layout.astro
git commit -m "refactor(security): extract the CSP inline-style patch into CspStylePatch"
```

---

### Task 4: The `/newsletter-embed` iframe page

**Files:**
- Create: `src/utils/watchSignupSuccess.ts`
- Create: `src/pages/newsletter-embed.astro`
- Modify: `astro.config.mjs` (sitemap `exclude` list, after `"/growthbook-test/",`)

**Interfaces:**
- Consumes: `toEmbedPayload`, `EmbedMessage` (Task 1); `<CspStylePatch />` (Task 3); `<SignUpForm />` (existing).
- Produces:
  - `watchSignupSuccess(root: Element, onSuccess: () => void): () => void`, which calls `onSuccess` once, the first time EmailOctopus writes text into `.emailoctopus-success-message` inside `root`, and returns a stop function.
  - The page at `/newsletter-embed`, which posts `{ source: "t4p-newsletter-embed", type: "resize", height }` on every size change and `{ source, type: "success" }` once, to `window.parent`, with target origin `window.location.origin`.

EmailOctopus's success path, from its embed script: `form.style.display = 'none'; form.parentNode.querySelector('.emailoctopus-success-message').textContent = messages.success;`. The element exists empty from the start, so "has non-empty text" is the success signal.

- [ ] **Step 1: Create `src/utils/watchSignupSuccess.ts`**

```ts
const SUCCESS_SELECTOR = ".emailoctopus-success-message";

// EmailOctopus renders .emailoctopus-success-message empty and fills in its
// text only after a successful submit, so non-empty text means "subscribed".
// Shared by the popup's iframe page and the homepage's bottom form.
export function watchSignupSuccess(root: Element, onSuccess: () => void): () => void {
  let done = false;
  const observer = new MutationObserver(check);

  function check() {
    if (done) return;
    const message = root.querySelector(SUCCESS_SELECTOR);
    if (message?.textContent?.trim()) {
      done = true;
      observer.disconnect();
      onSuccess();
    }
  }

  observer.observe(root, { childList: true, subtree: true, characterData: true });
  check();
  return () => observer.disconnect();
}
```

This is DOM code, and the Vitest setup is node-only, so it is exercised by the manual checks in Task 7 rather than by a unit test.

- [ ] **Step 2: Create `src/pages/newsletter-embed.astro`**

```astro
---
// Iframe-only page holding the popup's copy of the EmailOctopus form.
// EmailOctopus's script finds its form with document.querySelector, so a
// second copy on the homepage itself would bind to the bottom form; an iframe
// gives this copy its own document. Framed only by our own origin
// (src/middleware/cspHeader.ts). No Layout, nav or Plausible on purpose.
import CspStylePatch from "../components/CspStylePatch.astro";
import SignUpForm from "../structures/SignUpForm.astro";
import "../styles/base.css";
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Join our Mailing List</title>
    <CspStylePatch />
  </head>
  <body class="m-0 bg-paper">
    <SignUpForm />
    <script>
      import { toEmbedPayload, type EmbedMessage } from "../utils/newsletterPopup";
      import { watchSignupSuccess } from "../utils/watchSignupSuccess";

      if (window.parent !== window) {
        const post = (message: EmbedMessage) =>
          window.parent.postMessage(toEmbedPayload(message), window.location.origin);

        new ResizeObserver(() => {
          post({ type: "resize", height: document.body.offsetHeight });
        }).observe(document.body);

        watchSignupSuccess(document.body, () => post({ type: "success" }));
      }
    </script>
  </body>
</html>
```

- [ ] **Step 3: Exclude it from the sitemap**

In `astro.config.mjs`, add `"/newsletter-embed/",` directly after `"/growthbook-test/",` in the sitemap `exclude` array.

- [ ] **Step 4: Type check**

Run: `pnpm check`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/utils/watchSignupSuccess.ts src/pages/newsletter-embed.astro astro.config.mjs
git commit -m "feat(home): add iframe page hosting the popup's mailing-list form"
```

---

### Task 5: The `NewsletterPopup` island and homepage wiring

**Files:**
- Create: `src/components/home/NewsletterPopup.tsx`
- Modify: `src/pages/index.astro` (imports at lines 1–5; the `<!-- Mailing list -->` section at ~line 473; the end of `<main>`)

**Interfaces:**
- Consumes: everything in `src/utils/newsletterPopup.ts` (Task 1); `watchSignupSuccess` (Task 4); `GrowthBookProvider` from `src/components/GrowthBookProvider.tsx`; `useFeatureIsOn` from `@growthbook/growthbook-react`; `window.plausible(event: string, options?: any)` (declared in `src/env.d.ts:17`, and stubbed in `Layout.astro` so calls before the script loads are queued).
- Produces: `export default function NewsletterPopup()`, a self-contained island with no props.

Behaviour:
- The popup is **mounted** once the flag is on, the visitor isn't suppressed, the trigger has fired and the visitor hasn't closed it.
- It is **visible** when mounted and the `#mailing-list` section is not in view. Hiding uses the `hidden` class rather than unmounting, so a half-typed email in the iframe survives the visitor scrolling past the bottom form.

- [ ] **Step 1: Create `src/components/home/NewsletterPopup.tsx`**

```tsx
import { useEffect, useRef, useState } from "react";
import { useFeatureIsOn } from "@growthbook/growthbook-react";
import GrowthBookProvider from "../GrowthBookProvider";
import {
  DESKTOP_QUERY,
  EMBED_PATH,
  FOOTER_SECTION_ID,
  POPUP_FLAG,
  SHOW_DELAY_MS,
  hasReachedScrollTrigger,
  isSuppressed,
  parseEmbedMessage,
  readPopupState,
  safeLocalStorage,
  writePopupState,
} from "../../utils/newsletterPopup";

// Homepage mailing-list popup. Spec: docs/superpowers/specs/2026-09-23-newsletter-popup-design.md

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return isDesktop;
}

// 10s on the page or 35% of the way down, whichever comes first.
function useTrigger(active: boolean): boolean {
  const [triggered, setTriggered] = useState(false);
  useEffect(() => {
    if (!active || triggered) return;
    const fire = () => setTriggered(true);
    const timer = window.setTimeout(fire, SHOW_DELAY_MS);
    const onScroll = () => {
      const docHeight = document.documentElement.scrollHeight;
      if (hasReachedScrollTrigger(window.scrollY, window.innerHeight, docHeight)) fire();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [active, triggered]);
  return triggered;
}

function useInView(elementId: string): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = document.getElementById(elementId);
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, [elementId]);
  return inView;
}

function CloseButton({ onClick, onDark = false }: { onClick: () => void; onDark?: boolean }) {
  const tone = onDark
    ? "text-white hover:bg-white/15"
    : "absolute right-2 top-2 text-ink-secondary hover:bg-stone";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close mailing list signup"
      className={`${tone} flex h-9 w-9 shrink-0 items-center justify-center rounded-pill focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grove`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}

function Popup() {
  const enabled = useFeatureIsOn(POPUP_FLAG);
  const [eligible] = useState(() => !isSuppressed(readPopupState(safeLocalStorage()), Date.now()));
  const triggered = useTrigger(enabled && eligible);
  const bottomFormInView = useInView(FOOTER_SECTION_ID);
  const isDesktop = useIsDesktop();
  const [closed, setClosed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const subscribedRef = useRef(false);
  const shownRef = useRef(false);

  const mounted = enabled && eligible && triggered && !closed;
  const visible = mounted && !bottomFormInView;

  useEffect(() => {
    if (!visible || shownRef.current) return;
    shownRef.current = true;
    window.plausible("Newsletter Popup Shown");
  }, [visible]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const frame = iframeRef.current;
      if (!frame || event.origin !== window.location.origin || event.source !== frame.contentWindow) return;
      const message = parseEmbedMessage(event.data);
      if (!message) return;
      if (message.type === "resize") {
        // CSSOM, not a style="" attribute: the CSP blocks the latter.
        frame.style.height = `${message.height}px`;
        return;
      }
      if (subscribedRef.current) return;
      subscribedRef.current = true;
      writePopupState(safeLocalStorage(), { subscribed: true });
      window.plausible("Newsletter Signup", { props: { source: "popup" } });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const close = () => {
    setClosed(true);
    if (subscribedRef.current) return;
    writePopupState(safeLocalStorage(), { dismissedAt: Date.now() });
    window.plausible("Newsletter Popup Dismissed");
  };

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible]);

  if (!mounted) return null;
  const hiddenClass = visible ? "" : "hidden";

  // Mobile, collapsed: a slim bar. Google treats small, dismissible banners as non-intrusive.
  if (!isDesktop && !expanded) {
    return (
      <div
        className={`fixed inset-x-4 bottom-20 z-40 flex items-center gap-2 rounded-pill bg-grove py-1 pl-5 pr-1 shadow-lg ${hiddenClass}`}
      >
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex-1 py-2 text-left text-[15px] font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Get T4P updates <span aria-hidden="true">→</span>
        </button>
        <CloseButton onClick={close} onDark />
      </div>
    );
  }

  // bottom-20 / md:bottom-24 keeps clear of the pal-chat launcher, which owns the bottom corners.
  return (
    <aside
      aria-label="Join our mailing list"
      className={`fixed bottom-20 right-4 z-40 w-[calc(100vw-2rem)] max-w-[380px] rounded-md border border-ink-divider bg-paper p-4 pt-10 shadow-lg md:bottom-24 md:right-6 ${hiddenClass}`}
    >
      <CloseButton onClick={close} />
      <iframe
        ref={iframeRef}
        src={EMBED_PATH}
        title="Join our Mailing List"
        className="block h-[220px] w-full border-0"
      />
    </aside>
  );
}

export default function NewsletterPopup() {
  return (
    <GrowthBookProvider>
      <Popup />
    </GrowthBookProvider>
  );
}
```

- [ ] **Step 2: Wire it into `src/pages/index.astro`**

Add to the frontmatter imports (after line 4):

```ts
import NewsletterPopup from "../components/home/NewsletterPopup";
```

Give the bottom section an id. Change:

```astro
    <!-- Mailing list -->
    <section class="bg-paper pb-[clamp(3.5rem,6vw,5rem)]">
```

to:

```astro
    <!-- Mailing list -->
    <section id="mailing-list" class="bg-paper pb-[clamp(3.5rem,6vw,5rem)]">
```

Directly after the closing `</main>` (still inside `<Layout>`), add:

```astro
  <NewsletterPopup client:only="react" />
  <script>
    import { FOOTER_SECTION_ID } from "../utils/newsletterPopup";
    import { watchSignupSuccess } from "../utils/watchSignupSuccess";

    const bottomForm = document.getElementById(FOOTER_SECTION_ID);
    if (bottomForm) {
      watchSignupSuccess(bottomForm, () =>
        window.plausible("Newsletter Signup", { props: { source: "footer" } })
      );
    }
  </script>
```

- [ ] **Step 3: Test and type check**

Run: `pnpm test && pnpm check`
Expected: all tests PASS; 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/NewsletterPopup.tsx src/pages/index.astro
git commit -m "feat(home): add flag-gated newsletter popup to the homepage"
```

---

### Task 6: Disclose the stored value in the privacy policy

**Files:**
- Modify: `src/pages/privacy-policy.astro:344-347` (the "Functional Cookies" list item)

**Interfaces:** none.

- [ ] **Step 1: Extend the Functional Cookies item**

Replace:

```astro
        <strong>Functional Cookies:</strong> These cookies remember choices you make (such as your language
        or region, if applicable) and enhance your experience.
```

with:

```astro
        <strong>Functional Cookies:</strong> These cookies remember choices you make (such as your language
        or region, if applicable) and enhance your experience. For example, if you close or complete the
        mailing-list signup on our homepage, your browser stores that choice locally so we don't ask again
        for 30 days (or at all, once you've subscribed). It contains no identifier and is never sent to us.
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/privacy-policy.astro
git commit -m "docs(privacy): disclose the newsletter popup's local preference"
```

---

### Task 7: Configuration and manual verification (human)

No code. Each step needs the human's go-ahead or hands.

- [ ] **Step 1: Confirm the GrowthBook client key reaches production builds.** `src/growthbook.ts` throws at import if `PUBLIC_GROWTHBOOK_CLIENT_KEY` is missing, which would crash the popup island (only that island). It is in `.env.local`; confirm it is also set in the Cloudflare Pages **build** environment variables.
- [ ] **Step 2: Create the flag** `homepage-newsletter-popup`: boolean, default `false`; `production` off, `dev` on. Use the growthbook `feature-flags` skill, **after the human explicitly approves the write**.
- [ ] **Step 3: Human browser check on a preview deploy** (the CSP only applies where `HTMLRewriter` exists, so framing rules can't be seen in `pnpm dev`):
  - Desktop, flag on: the card appears after about 10s, or on scrolling about 35%. It sits above the pal-chat launcher, not over it, and hides while the bottom "Mailing list" section is on screen.
  - The iframe shows the EmailOctopus form with no nav and no scrollbar. The iframe grows when a validation error appears.
  - Subscribe with a test address: the success message shows, and Plausible's live view shows `Newsletter Signup` with `source=popup`. Reload: the popup never returns.
  - Clear site data, dismiss with ✕ (and with Escape): `Newsletter Popup Dismissed` fires; reload: no popup.
  - Subscribe via the bottom form: `Newsletter Signup` with `source=footer`.
  - Mobile width: the collapsed bar appears; tapping expands the card; ✕ on the bar dismisses.
  - DevTools console on `/` and `/newsletter-embed`: no CSP violations. Opening `/newsletter-embed` directly works; embedding any other page in an iframe from another origin is refused.
- [ ] **Step 4: Create the Plausible goals** `Newsletter Popup Shown`, `Newsletter Popup Dismissed` and `Newsletter Signup` (with the custom property `source`) in the Plausible dashboard.
- [ ] **Step 5: Turn the flag on in production** when ready, and note the date so signups can be compared before and after.
