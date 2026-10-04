# Homepage Hackathon Promo Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show homepage visitors, once, a modal styled like the hackathon2026 hero that links to the Oct 31 2026 hackathon ticket page, and that removes itself after the event.

**Architecture:** Pure, unit-tested decision logic (campaign expiry, stored dismissal) lives in `src/utils/hackathonPopup.ts`. A plain Astro component, `HackathonPopup.astro`, server-renders a native `<dialog>` only while the campaign is live and opens it with `showModal()` from a bundled `<script>` after 4 s. When it opens it marks `<html>` and fires a window event so the existing React `NewsletterPopup` stands down for that page load.

**Tech Stack:** Astro 5 (SSR, Cloudflare), native `<dialog>`, scoped Astro `<style>`, TypeScript, Vitest 3 (node env, `src/**/*.test.ts`), React 19 (only for the small `NewsletterPopup` change), Plausible (`window.plausible`, stubbed in `Layout.astro`).

**Spec:** `docs/superpowers/specs/2026-10-04-hackathon-popup-design.md`

## Global Constraints

- Package manager is `pnpm`. Tests: `pnpm test`. Types: `pnpm check`. Lint: `pnpm lint`. Never `npx astro` or `yarn`.
- Ticket URL, exactly: `https://secure.qgiv.com/for/eventstest/event/hackathon2026/`
- Campaign end, exactly: `2026-11-01T00:00:00+01:00` (Barcelona, CET after DST ends on Oct 25).
- localStorage key: `t4p-hackathon-2026-popup`. Value: `{"dismissedAt": <epoch ms>}`.
- Show delay: `4_000` ms. Desktop/mobile breakpoint: `768px` (mobile is `max-width: 767px`).
- Plausible event names, exactly: `Hackathon Popup Shown`, `Hackathon Popup Dismissed` (props `{ reason: "close" | "escape" | "backdrop" | "ticket" }`), `Hackathon Ticket Click`.
- Newsletter coordination: `<html>` attribute `data-hackathon-popup-shown` and window event `t4p:hackathon-popup-shown`.
- CSP: never write a `style=""` attribute in markup, never add `'unsafe-inline'`. Dynamic styles go through CSSOM (`el.style.setProperty(...)`).
- Colours: the hackathon palette is a component-scoped exception to DESIGN.md (spec, "Visual identity"). Define it once as custom properties on `.hk` (`--hk-red: #d92d27`, `--hk-green: #157a3e`, `--hk-ink: #141414`) and use nothing else.
- Copy has no em dashes. Copy strings exactly as in the spec's "Content" section.
- Commits: conventional format with a scope, e.g. `feat(home): …`. No `Co-Authored-By` lines.
- Do not start the dev server or curl local pages. The human verifies in the browser in Task 4.

## Review Focus

1. **localStorage throws or is missing** (Safari private mode, blocked site data): the modal must still open and close without errors; it just won't be remembered. Tested in Task 1 (`readPopupState`/`writePopupState` with throwing storage).
2. **Corrupt or foreign value under the key** (`"null"`, `"5"`, `"[]"`, `{"dismissedAt":"x"}`, invalid JSON): treat as never dismissed, don't crash. Tested in Task 1 (`parsePopupState`).
3. **Visiting after the event, including from the 600 s edge cache of `/`**: modal must never open from Nov 1 00:00 Barcelona time. Tested in Task 1 (`isCampaignLive` boundary, `shouldShowPopup` after end); server guard and client guard both in Task 2.
4. **Newsletter popup already showing when the hackathon modal opens** (visitor scrolled 35% within 4 s): the newsletter must disappear without recording a dismissal, so it can come back on the next visit. Implemented and checked in Task 3 (Step 3 inspection of the `close()` path) and verified by hand in Task 4.
5. **Hackathon photo fails to load** (blocked, offline, 404): the photo column and arrow cutouts are removed, copy and button stay usable. Implemented in Task 2 (`hk-card--no-photo`), verified by hand in Task 4 by blocking the image URL in devtools.

---

### Task 0: Branch

- [ ] **Step 1: Create the branch from an up-to-date main**

```bash
git checkout main && git pull --ff-only && git checkout -b feat/hackathon-popup
```

---

### Task 1: Popup decision helpers

**Files:**

- Create: `src/utils/hackathonPopup.ts`
- Test: `src/utils/hackathonPopup.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces (exact exports):
  - `TICKET_URL: string`, `STORAGE_KEY: string`, `SHOW_DELAY_MS: number`, `CAMPAIGN_ENDS_AT: number`
  - `SHOWN_ATTRIBUTE = "data-hackathon-popup-shown"`, `SHOWN_EVENT = "t4p:hackathon-popup-shown"`
  - `type PopupState = { dismissedAt: number } | null`
  - `type DismissReason = "close" | "escape" | "backdrop" | "ticket"`
  - `isCampaignLive(now: number): boolean`
  - `parsePopupState(raw: string | null): PopupState`
  - `readPopupState(storage: Pick<Storage, "getItem"> | null): PopupState`
  - `writePopupState(storage: Pick<Storage, "setItem"> | null, state: { dismissedAt: number }): void`
  - `shouldShowPopup(state: PopupState, now: number): boolean`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/hackathonPopup.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  CAMPAIGN_ENDS_AT,
  STORAGE_KEY,
  isCampaignLive,
  parsePopupState,
  readPopupState,
  shouldShowPopup,
  writePopupState,
} from "./hackathonPopup";

const BEFORE_END = Date.parse("2026-10-20T12:00:00Z");

describe("isCampaignLive", () => {
  it("is live before the end", () => {
    expect(isCampaignLive(BEFORE_END)).toBe(true);
  });

  it("is live one millisecond before midnight after the event, Barcelona time", () => {
    expect(isCampaignLive(Date.parse("2026-10-31T22:59:59.999Z"))).toBe(true);
  });

  it("ends at midnight after the event, Barcelona time", () => {
    expect(CAMPAIGN_ENDS_AT).toBe(Date.parse("2026-10-31T23:00:00Z"));
    expect(isCampaignLive(CAMPAIGN_ENDS_AT)).toBe(false);
  });
});

describe("parsePopupState", () => {
  it("returns null when nothing is stored", () => {
    expect(parsePopupState(null)).toBeNull();
  });

  it("reads a stored dismissal", () => {
    expect(parsePopupState('{"dismissedAt":1700000000000}')).toEqual({
      dismissedAt: 1700000000000,
    });
  });

  it.each([
    "not json",
    "null",
    "5",
    "[]",
    '"x"',
    "{}",
    '{"dismissedAt":"x"}',
    '{"dismissedAt":null}',
  ])("treats %s as never dismissed", (raw) => {
    expect(parsePopupState(raw)).toBeNull();
  });
});

describe("readPopupState", () => {
  it("reads from storage under the hackathon key", () => {
    const storage = {
      getItem: (key: string) => (key === STORAGE_KEY ? '{"dismissedAt":1}' : null),
    };
    expect(readPopupState(storage)).toEqual({ dismissedAt: 1 });
  });

  it("returns null when storage is unavailable", () => {
    expect(readPopupState(null)).toBeNull();
  });

  it("returns null when storage throws", () => {
    const storage = {
      getItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(readPopupState(storage)).toBeNull();
  });
});

describe("writePopupState", () => {
  it("writes the dismissal as JSON under the hackathon key", () => {
    const written: Record<string, string> = {};
    writePopupState({ setItem: (key, value) => (written[key] = value) }, { dismissedAt: 42 });
    expect(written).toEqual({ [STORAGE_KEY]: '{"dismissedAt":42}' });
  });

  it("does not throw when storage throws or is unavailable", () => {
    const storage = {
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(() => writePopupState(storage, { dismissedAt: 1 })).not.toThrow();
    expect(() => writePopupState(null, { dismissedAt: 1 })).not.toThrow();
  });
});

describe("shouldShowPopup", () => {
  it("shows to a visitor who never dismissed it while the campaign is live", () => {
    expect(shouldShowPopup(null, BEFORE_END)).toBe(true);
  });

  it("never shows again after any dismissal", () => {
    expect(shouldShowPopup({ dismissedAt: BEFORE_END - 1 }, BEFORE_END)).toBe(false);
  });

  it("never shows after the campaign ends", () => {
    expect(shouldShowPopup(null, CAMPAIGN_ENDS_AT)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test src/utils/hackathonPopup.test.ts`
Expected: FAIL, `Failed to resolve import "./hackathonPopup"`.

- [ ] **Step 3: Write the implementation**

Create `src/utils/hackathonPopup.ts`:

```ts
// Pure decision logic for the homepage hackathon promo modal
// (src/components/home/HackathonPopup.astro). Kept DOM-free so it runs under
// Vitest's node environment. See docs/superpowers/specs/2026-10-04-hackathon-popup-design.md.

export const TICKET_URL = "https://secure.qgiv.com/for/eventstest/event/hackathon2026/";
export const STORAGE_KEY = "t4p-hackathon-2026-popup";
export const SHOW_DELAY_MS = 4_000;
// Midnight after the event, Barcelona time (CET: DST ends on Oct 25).
export const CAMPAIGN_ENDS_AT = Date.parse("2026-11-01T00:00:00+01:00");
// Set on <html> and fired on window once the modal opens, so the newsletter
// popup (a separate React bundle) can stand down for this page load.
export const SHOWN_ATTRIBUTE = "data-hackathon-popup-shown";
export const SHOWN_EVENT = "t4p:hackathon-popup-shown";

export type PopupState = { dismissedAt: number } | null;
export type DismissReason = "close" | "escape" | "backdrop" | "ticket";

export function isCampaignLive(now: number): boolean {
  return now < CAMPAIGN_ENDS_AT;
}

export function parsePopupState(raw: string | null): PopupState {
  if (raw === null) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const { dismissedAt } = value as Record<string, unknown>;
  return typeof dismissedAt === "number" && Number.isFinite(dismissedAt) ? { dismissedAt } : null;
}

export function readPopupState(storage: Pick<Storage, "getItem"> | null): PopupState {
  try {
    return parsePopupState(storage?.getItem(STORAGE_KEY) ?? null);
  } catch {
    return null;
  }
}

export function writePopupState(
  storage: Pick<Storage, "setItem"> | null,
  state: { dismissedAt: number }
): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage blocked or full: the modal still closes, it just won't be remembered.
  }
}

// Shown once ever: any stored dismissal hides it for good.
export function shouldShowPopup(state: PopupState, now: number): boolean {
  return isCampaignLive(now) && state === null;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test src/utils/hackathonPopup.test.ts`
Expected: PASS, all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/utils/hackathonPopup.ts src/utils/hackathonPopup.test.ts
git commit -m "feat(home): add hackathon popup decision helpers"
```

---

### Task 2: The modal component, its assets, and mounting it on the homepage

**Files:**

- Create: `public/images/hackathon-2026/workshop-circle.webp`, `public/images/hackathon-2026/workshop-circle-small.webp`, `public/images/hackathon-2026/thaura-logo.svg`
- Create: `src/components/home/HackathonPopup.astro`
- Modify: `src/pages/index.astro` (import near the other component imports at the top; mount right after `<NewsletterPopup client:only="react" />`, currently line 482)

**Interfaces:**

- Consumes from Task 1: `TICKET_URL`, `SHOW_DELAY_MS`, `SHOWN_ATTRIBUTE`, `SHOWN_EVENT`, `isCampaignLive`, `readPopupState`, `writePopupState`, `shouldShowPopup`, `type DismissReason`. From the existing `src/utils/newsletterPopup.ts`: `safeLocalStorage(): Storage | null`.
- Produces: the DOM contract Task 3 relies on: when the modal opens, `document.documentElement` gets the `data-hackathon-popup-shown` attribute and `window` receives a `t4p:hackathon-popup-shown` `Event`.

This task has no unit test: Vitest runs in a node environment with no DOM, and the decision logic is already covered by Task 1. It is verified by `pnpm check` here and by hand in Task 4.

- [ ] **Step 1: Copy the assets from the hackathon site**

```bash
mkdir -p public/images/hackathon-2026
curl -fsSL -o public/images/hackathon-2026/workshop-circle.webp https://hackathon2026.techforpalestine.org/events/workshop-circle.webp
curl -fsSL -o public/images/hackathon-2026/workshop-circle-small.webp https://hackathon2026.techforpalestine.org/events/workshop-circle-small.webp
curl -fsSL -o public/images/hackathon-2026/thaura-logo.svg https://hackathon2026.techforpalestine.org/thaura-logo.svg
ls -la public/images/hackathon-2026
```

Expected: three non-empty files (about 117 KB, 34 KB and 10 KB).

- [ ] **Step 2: Write the component**

Create `src/components/home/HackathonPopup.astro`. The arrow paths, its `filter`, and the four cutout polygons are copied verbatim from the hackathon site's hero; the cutouts are copies of the photo clipped to people's heads, layered over the arrow so it appears to pass behind them.

```astro
---
import { TICKET_URL, isCampaignLive } from "../../utils/hackathonPopup";

// Homepage promo for the Oct 31 2026 hackathon, styled after the hackathon
// site's hero. Spec: docs/superpowers/specs/2026-10-04-hackathon-popup-design.md
// Renders nothing once the event is over; delete it and
// public/images/hackathon-2026/ after that.
const live = isCampaignLive(Date.now());
const IMG = "/images/hackathon-2026";
---

{
  live && (
    <dialog id="hackathon-popup" class="hk" aria-labelledby="hk-title">
      <div class="hk-card">
        <button
          type="button"
          class="hk-close"
          data-hk-close
          aria-label="Close hackathon announcement"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.25"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div class="hk-copy">
          <p class="hk-label">
            Part of <strong>Mozilla Festival</strong>
          </p>
          <h2 id="hk-title" class="hk-title">
            Tech for Palestine Hackathon @ MozFest
          </h2>
          <p class="hk-lead">
            A practical, one-day event for people who want to build ethical alternatives to
            complicit tech.
          </p>
        </div>

        <div class="hk-cta">
          <a
            class="hk-btn"
            href={TICKET_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-hk-ticket
          >
            <span class="hk-btn__label">
              <span class="hk-btn__text">Get your ticket</span>
              <span class="hk-btn__text hk-btn__text--copy" aria-hidden="true">
                Get your ticket
              </span>
            </span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
            <span class="sr-only"> (opens in a new tab)</span>
          </a>
        </div>

        <div class="hk-stage" data-hk-stage>
          <div class="hk-photo">
            <img
              class="hk-img"
              data-hk-photo
              src={`${IMG}/workshop-circle.webp`}
              srcset={`${IMG}/workshop-circle-small.webp 640w, ${IMG}/workshop-circle.webp 1600w`}
              sizes="(min-width: 768px) 440px, 100vw"
              width="1600"
              height="1067"
              loading="lazy"
              decoding="async"
              alt="Hackathon participants laughing and debating ideas around a long workshop table"
            />
          </div>
          <svg
            class="hk-sweep"
            viewBox="0 0 1000 667"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <filter
                id="hk-dry"
                filterUnits="userSpaceOnUse"
                x="-400"
                y="-400"
                width="2400"
                height="2400"
                color-interpolation-filters="sRGB"
              >
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.018"
                  numOctaves="2"
                  seed="4"
                  result="warp"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="warp"
                  scale="14"
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result="rough"
                />
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.55 0.16"
                  numOctaves="2"
                  seed="11"
                  result="grain"
                />
                <feColorMatrix
                  in="grain"
                  type="matrix"
                  values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  10 0 0 0 -2.8"
                  result="gate"
                />
                <feComposite in="rough" in2="gate" operator="in" />
              </filter>
            </defs>
            <g
              class="hk-sweep__ink"
              filter="url(#hk-dry)"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M-26 560 C-12 290 84 112 300 84 C435 60 585 107 611 179 C646 275 554 312 526 234 C505 176 546 103 640 81 C748 53 845 50 936 62"
                stroke-width="17"
              />
              <path
                d="M-26 560 C-12 290 84 112 300 84 C435 60 585 107 611 179 C646 275 554 312 526 234 C505 176 546 103 640 81 C748 53 845 50 936 62"
                stroke-width="7.14"
                stroke-dasharray="153 18.7 68 13.6"
                transform="translate(3.74 -4.42)"
                opacity=".85"
              />
              <path d="M958 64 L892 20 M958 64 L898 114" stroke-width="15" />
              <path
                d="M958 64 L892 20 M958 64 L898 114"
                stroke-width="6.3"
                stroke-dasharray="135 16.5 60 12"
                transform="translate(3.3 -3.9)"
                opacity=".85"
              />
              <path d="M-8 470 C10 260 110 150 250 116" stroke-width="6" opacity=".7" />
            </g>
          </svg>
          <div class="hk-cutout hk-cutout--1" aria-hidden="true" />
          <div class="hk-cutout hk-cutout--2" aria-hidden="true" />
          <div class="hk-cutout hk-cutout--3" aria-hidden="true" />
          <div class="hk-cutout hk-cutout--4" aria-hidden="true" />
        </div>

        <dl class="hk-bar">
          <div>
            <dt class="hk-term">When</dt>
            <dd class="hk-value">
              Saturday
              <br />
              October 31st
            </dd>
            <dd class="hk-sub">9:00 - 18:00</dd>
          </div>
          <div>
            <dt class="hk-term">Where</dt>
            <dd class="hk-value">
              Canodrom
              <>
                <br />
                <span class="hk-nowrap">Barcelona, Spain</span>
              </>
            </dd>
          </div>
          <div class="hk-slash" aria-hidden="true">
            //
          </div>
          <div class="hk-partner">
            <dt class="hk-term">In partnership with</dt>
            <dd class="hk-value">Thaura.ai</dd>
          </div>
        </dl>
      </div>
    </dialog>
  )
}

<style>
  .hk {
    --hk-red: #d92d27;
    --hk-green: #157a3e;
    --hk-ink: #141414;
    width: min(920px, calc(100% - 48px));
    max-width: none;
    max-height: calc(100dvh - 48px);
    margin: auto;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--hk-ink);
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .hk::backdrop {
    background: rgb(20 20 20 / 0.55);
  }
  :global(html:has(#hackathon-popup[open])) {
    overflow: hidden;
  }

  .hk-card {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
    grid-template-areas:
      "copy stage"
      "cta stage"
      "bar bar";
    column-gap: 40px;
    padding: 56px 48px 48px;
    background: #fff;
    font-family: Outfit, system-ui, sans-serif;
    line-height: 1.65;
  }
  .hk[open] .hk-card {
    animation: hk-rise 280ms cubic-bezier(0.25, 1, 0.5, 1);
  }
  @keyframes hk-rise {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
  }

  .hk-close {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 3;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 999px;
    background: #fff;
    color: var(--hk-ink);
  }
  .hk-close:hover {
    background: #f2f2f2;
  }

  .hk-copy {
    grid-area: copy;
    align-self: end;
  }
  .hk-label {
    display: inline-flex;
    gap: 0.3em;
    background: var(--hk-red);
    color: #fff;
    font-size: 1.125rem;
    padding: 0.4rem 0.75rem;
    line-height: 1.4;
  }
  .hk-label strong {
    font-weight: 700;
  }
  .hk-title {
    margin-top: 1.25rem;
    font-size: clamp(2.25rem, 4vw, 3.25rem);
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.015em;
    text-wrap: balance;
  }
  .hk-lead {
    margin-top: 1rem;
    max-width: 38ch;
    font-size: 1.125rem;
    line-height: 1.6;
  }

  .hk-cta {
    grid-area: cta;
    align-self: start;
    margin-top: 1.75rem;
  }
  .hk-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.9rem 1.4rem;
    background: var(--hk-ink);
    color: #fff;
    font-size: 1.0625rem;
    font-weight: 600;
    transition: background-color 0.2s;
  }
  .hk-btn:hover {
    background: #3a3a3a;
  }
  .hk-btn:focus-visible,
  .hk-close:focus-visible {
    outline: 2px solid var(--hk-green);
    outline-offset: 3px;
  }
  .hk-btn__label {
    display: grid;
    overflow: hidden;
    line-height: 1.4;
  }
  .hk-btn__text {
    grid-area: 1 / 1;
    white-space: nowrap;
    transition:
      transform 0.5s cubic-bezier(0.25, 1, 0.5, 1),
      opacity 0.5s;
  }
  .hk-btn__text--copy {
    opacity: 0;
    transform: translateY(100%);
  }
  .hk-btn:is(:hover, :focus-visible) .hk-btn__text:not(.hk-btn__text--copy) {
    opacity: 0;
    transform: translateY(-100%);
  }
  .hk-btn:is(:hover, :focus-visible) .hk-btn__text--copy {
    opacity: 1;
    transform: translateY(0);
  }

  .hk-stage {
    grid-area: stage;
    align-self: center;
    position: relative;
  }
  .hk-photo {
    clip-path: polygon(9% 0, 100% 0, 100% 100%, 0 100%);
  }
  .hk-img {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 3 / 2;
    object-fit: cover;
    object-position: 30% 50%;
    background: #f2f2f2;
  }
  .hk-sweep {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
    color: var(--hk-red);
  }
  .hk-cutout {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: var(--hk-photo-src, none);
    background-size: 100% 100%;
    background-repeat: no-repeat;
  }
  .hk-cutout--1 {
    clip-path: polygon(
      52.73% 19.77%,
      53.52% 18.89%,
      54.69% 18.89%,
      55.47% 19.77%,
      56.05% 21.23%,
      56.25% 22.4%,
      56.15% 23.28%,
      56.64% 22.84%,
      57.03% 23.87%,
      57.23% 25.92%,
      58.01% 28.11%,
      58.11% 30.31%,
      57.03% 31.48%,
      56.45% 32.21%,
      53.52% 38.51%,
      51.17% 38.51%,
      51.27% 33.67%,
      51.07% 29.72%,
      51.27% 26.5%,
      51.86% 23.87%,
      52.64% 22.11%
    );
  }
  .hk-cutout--2 {
    clip-path: polygon(
      60.94% 28.99%,
      61.82% 28.11%,
      62.99% 28.55%,
      63.67% 29.72%,
      63.96% 31.63%,
      63.96% 33.09%,
      63.48% 34.7%,
      65.33% 36.02%,
      66.31% 38.65%,
      66.89% 38.8%,
      67.09% 36.75%,
      67.58% 35.58%,
      67.38% 38.07%,
      66.8% 40.41%,
      65.92% 41.58%,
      65.04% 44.22%,
      61.33% 47%,
      58.89% 45.39%,
      58.2% 41%,
      58.2% 36.75%,
      59.28% 34.41%,
      60.84% 33.97%,
      60.45% 31.63%
    );
  }
  .hk-cutout--3 {
    clip-path: polygon(
      53.52% 37.04%,
      54% 35.14%,
      55.18% 33.67%,
      56.45% 32.8%,
      57.81% 32.65%,
      59.08% 33.38%,
      59.57% 35.14%,
      59.28% 37.63%,
      58.5% 40.41%,
      57.23% 43.05%,
      53.81% 42.61%,
      52.64% 40.7%
    );
  }
  .hk-cutout--4 {
    clip-path: polygon(
      51.37% 42.17%,
      52.15% 40.26%,
      53.71% 38.65%,
      55.66% 37.77%,
      57.52% 37.77%,
      59.47% 38.95%,
      60.84% 40.41%,
      61.82% 42.75%,
      62.11% 45.1%,
      61.72% 47.73%,
      61.23% 50.51%,
      61.43% 53.88%,
      64.06% 57.1%,
      69.24% 61.49%,
      71.29% 73.35%,
      71.19% 87.55%,
      68.75% 100%,
      48.34% 100%,
      47.46% 81.41%,
      44.24% 71.6%,
      42.48% 68.08%,
      41.6% 64.28%,
      42.97% 60.76%,
      47.85% 55.64%,
      50.39% 52.27%,
      51.27% 48.9%,
      50.98% 45.83%
    );
  }
  .hk-card--no-photo {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: "copy" "cta" "bar";
  }
  .hk-card--no-photo .hk-stage {
    display: none;
  }

  .hk-bar {
    grid-area: bar;
    position: relative;
    isolation: isolate;
    display: grid;
    grid-template-columns: repeat(4, auto);
    justify-content: space-between;
    gap: 24px;
    margin-top: 40px;
    padding: 32px 36px;
    color: #fff;
  }
  .hk-bar::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background: var(--hk-green);
    clip-path: polygon(0 0, 96% 0, 96% 60%, 100% 60%, 100% 100%, 0 100%);
  }
  .hk-term {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .hk-value {
    margin-top: 0.25rem;
    font-size: 1.5rem;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.015em;
  }
  .hk-sub {
    margin-top: 0.25rem;
    font-size: 0.9375rem;
  }
  .hk-nowrap {
    white-space: nowrap;
  }
  .hk-slash {
    align-self: center;
    font-size: 2.5rem;
    font-weight: 600;
    line-height: 1;
  }
  .hk-partner {
    position: relative;
    padding-left: 3.75rem;
    margin-right: 1.5rem;
  }
  /* The Thaura camel mark: a pseudo-element, since a <dl> group may only hold <dt>/<dd>. */
  .hk-partner::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 2.75rem;
    height: 3.5rem;
    background: url("/images/hackathon-2026/thaura-logo.svg") center / contain no-repeat;
    filter: brightness(0) invert(1);
  }

  @media (max-width: 767px) {
    .hk {
      width: 100%;
      max-height: 85dvh;
      margin: auto 0 0;
    }
    .hk-card {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas: "stage" "copy" "bar" "cta";
      padding: 0;
    }
    .hk-img {
      aspect-ratio: 16 / 9;
    }
    .hk-copy {
      padding: 24px 20px 0;
    }
    .hk-title {
      font-size: 2rem;
    }
    .hk-lead {
      font-size: 1rem;
    }
    .hk-bar {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      margin: 24px 20px 0;
      padding: 20px;
    }
    .hk-bar::before {
      clip-path: polygon(0 0, 92% 0, 92% 40%, 100% 40%, 100% 100%, 0 100%);
    }
    .hk-value {
      font-size: 1.125rem;
    }
    .hk-slash {
      display: none;
    }
    .hk-partner {
      grid-column: 1 / -1;
      padding-left: 3rem;
    }
    .hk-partner::before {
      width: 2.25rem;
      height: 2.75rem;
    }
    .hk-cta {
      position: sticky;
      bottom: 0;
      z-index: 2;
      margin: 0;
      padding: 16px 20px;
      background: #fff;
    }
    .hk-btn {
      width: 100%;
      justify-content: center;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hk[open] .hk-card {
      animation: none;
    }
    .hk-btn__text {
      transition: none;
    }
    .hk-btn:is(:hover, :focus-visible) .hk-btn__text:not(.hk-btn__text--copy) {
      opacity: 1;
      transform: none;
    }
    .hk-btn:is(:hover, :focus-visible) .hk-btn__text--copy {
      opacity: 0;
    }
  }
</style>

<script>
  import {
    SHOW_DELAY_MS,
    SHOWN_ATTRIBUTE,
    SHOWN_EVENT,
    readPopupState,
    shouldShowPopup,
    writePopupState,
    type DismissReason,
  } from "../../utils/hackathonPopup";
  import { safeLocalStorage } from "../../utils/newsletterPopup";

  const dialog = document.getElementById("hackathon-popup");
  if (dialog instanceof HTMLDialogElement && typeof dialog.showModal === "function") {
    if (shouldShowPopup(readPopupState(safeLocalStorage()), Date.now())) schedule(dialog);
  }

  function schedule(dialog: HTMLDialogElement) {
    const card = dialog.querySelector<HTMLElement>(".hk-card");
    const stage = dialog.querySelector<HTMLElement>("[data-hk-stage]");
    const photo = dialog.querySelector<HTMLImageElement>("[data-hk-photo]");

    // The cutouts must reuse whichever srcset candidate the browser picked,
    // or they'd download a second copy. CSSOM, not style="": the CSP blocks the latter.
    const usePhoto = () => {
      if (photo?.currentSrc)
        stage?.style.setProperty("--hk-photo-src", `url("${photo.currentSrc}")`);
    };
    const dropPhoto = () => card?.classList.add("hk-card--no-photo");
    if (photo) {
      photo.addEventListener("load", usePhoto, { once: true });
      photo.addEventListener("error", dropPhoto, { once: true });
      // Lazy images inside a closed <dialog> wait until it opens; start the
      // download now so the photo is there when the modal appears.
      photo.loading = "eager";
      if (photo.complete) (photo.naturalWidth > 0 ? usePhoto : dropPhoto)();
    }

    let reason: DismissReason = "escape";
    const closeWith = (next: DismissReason) => {
      reason = next;
      dialog.close();
    };

    dialog.querySelector("[data-hk-close]")?.addEventListener("click", () => closeWith("close"));
    dialog.querySelector("[data-hk-ticket]")?.addEventListener("click", () => {
      window.plausible("Hackathon Ticket Click");
      closeWith("ticket");
    });
    // A click whose target is the <dialog> itself landed on the backdrop: the
    // card fills the dialog box, which has no padding.
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeWith("backdrop");
    });
    // Fires for every close path, Esc included (which skips closeWith).
    dialog.addEventListener(
      "close",
      () => {
        writePopupState(safeLocalStorage(), { dismissedAt: Date.now() });
        window.plausible("Hackathon Popup Dismissed", { props: { reason } });
      },
      { once: true }
    );

    window.setTimeout(() => {
      if (!dialog.isConnected || dialog.open) return;
      dialog.showModal();
      document.documentElement.setAttribute(SHOWN_ATTRIBUTE, "");
      window.dispatchEvent(new Event(SHOWN_EVENT));
      window.plausible("Hackathon Popup Shown");
    }, SHOW_DELAY_MS);
  }
</script>
```

- [ ] **Step 3: Mount it on the homepage**

In `src/pages/index.astro`, add the import directly under `import NewsletterPopup from "../components/home/NewsletterPopup";`:

```astro
import HackathonPopup from "../components/home/HackathonPopup.astro";
```

and add the component directly under `<NewsletterPopup client:only="react" />`:

```astro
<NewsletterPopup client:only="react" />
<HackathonPopup />
```

- [ ] **Step 4: Type-check and lint**

Run: `pnpm check && pnpm lint`
Expected: `astro check` reports 0 errors; ESLint reports 0 errors (warnings allowed).

- [ ] **Step 5: Commit**

```bash
git add public/images/hackathon-2026 src/components/home/HackathonPopup.astro src/pages/index.astro
git commit -m "feat(home): add hackathon promo modal to the homepage"
```

---

### Task 3: Newsletter popup stands down while the hackathon modal has shown

**Files:**

- Modify: `src/components/home/NewsletterPopup.tsx` (imports at the top; `Popup()` state block, currently lines 85–101)

**Interfaces:**

- Consumes from Task 1: `SHOWN_ATTRIBUTE`, `SHOWN_EVENT` (via `src/utils/hackathonPopup.ts`).
- Consumes from Task 2: the DOM contract (attribute on `<html>`, event on `window`).
- Produces: nothing new.

The newsletter is a `client:only` island, so `document` is available in a `useState` initializer. The hackathon modal opens at 4 s and the newsletter at 10 s or 35% scroll, so normally the attribute is already set; the event covers the case where the newsletter showed first.

- [ ] **Step 1: Import the shared names**

Add under the existing `from "../../utils/newsletterPopup";` import block:

```tsx
import {
  SHOWN_ATTRIBUTE as HACKATHON_SHOWN_ATTRIBUTE,
  SHOWN_EVENT as HACKATHON_SHOWN_EVENT,
} from "../../utils/hackathonPopup";
```

- [ ] **Step 2: Gate `mounted` on the hackathon modal**

In `Popup()`, directly after `const [closed, setClosed] = useState(false);`, add:

```tsx
// The homepage hackathon modal wins the page load: once it has opened, this
// popup stays hidden until the next page load. Not a dismissal, so nothing
// is written to storage. See docs/superpowers/specs/2026-10-04-hackathon-popup-design.md.
const [hackathonShown, setHackathonShown] = useState(() =>
  document.documentElement.hasAttribute(HACKATHON_SHOWN_ATTRIBUTE)
);
useEffect(() => {
  const onHackathonShown = () => setHackathonShown(true);
  window.addEventListener(HACKATHON_SHOWN_EVENT, onHackathonShown);
  return () => window.removeEventListener(HACKATHON_SHOWN_EVENT, onHackathonShown);
}, []);
```

and change

```tsx
const mounted = enabled && eligible && triggered && !closed;
```

to

```tsx
const mounted = enabled && eligible && triggered && !closed && !hackathonShown;
```

- [ ] **Step 3: Confirm no dismissal is recorded on this path**

Read `close()` in the same file: it is only called from the close button and the Esc handler, never from a change to `mounted`. Unmounting because `hackathonShown` became true must therefore write nothing to `t4p-newsletter-popup`. Also confirm the Esc `keydown` listener is removed when `visible` turns false (its effect depends on `[visible]`), so pressing Esc to close the hackathon modal does not also record a newsletter dismissal.

- [ ] **Step 4: Run the full suite, type-check and lint**

Run: `pnpm test && pnpm check && pnpm lint`
Expected: all Vitest suites pass (including `newsletterPopup.test.ts`, unchanged); 0 type errors; 0 lint errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/NewsletterPopup.tsx
git commit -m "feat(home): hide the newsletter popup once the hackathon modal has shown"
```

---

### Task 4: Human verification and ship

- [ ] **Step 1: Build**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 2: Hand off for browser checks (the human runs `pnpm dev`)**

Checklist for the human, on `http://localhost:4321/`, with `localStorage["t4p-hackathon-2026-popup"]` cleared:

1. Modal appears after about 4 s; the page behind is dimmed and does not scroll.
2. Desktop: two columns, red arrow passes behind the people's heads, notched green bar at the bottom.
3. At 375 px wide: bottom sheet, photo on top, ticket button pinned at the bottom of the sheet while scrolling inside it.
4. Tab cycles only inside the modal; Esc closes it; clicking the dimmed backdrop closes it; ✕ closes it. After each, reload: it does not come back.
5. "Get your ticket" opens the Qgiv page in a new tab and closes the modal.
6. With the newsletter flag on, scroll 35% within 4 s: the newsletter card appears, then disappears when the hackathon modal opens; `localStorage["t4p-newsletter-popup"]` is still unset afterwards.
7. Devtools, Network, block `workshop-circle*`: the modal opens with copy, bar and button only.
8. OS reduced motion on: no rise animation, no rolling button label.
9. Note: CSP is not enforced in `pnpm dev`; check a Cloudflare preview deployment for CSP console errors.

- [ ] **Step 3: Ship (only when the human says "ship it")**

```bash
git push -u origin feat/hackathon-popup
gh pr create --title "feat(home): hackathon promo modal on the homepage" --body "$(cat <<'EOF'
## Summary
- Homepage modal promoting the Tech for Palestine Hackathon @ MozFest (Oct 31, Barcelona), styled after the hackathon site's hero
- Shown once, 4 s after load; removes itself after 2026-11-01 00:00 Barcelona time
- Newsletter popup stands down for the page load once the modal has shown
- Spec: docs/superpowers/specs/2026-10-04-hackathon-popup-design.md

## Test plan
- [ ] `pnpm test`, `pnpm check`, `pnpm lint`, `pnpm build`
- [ ] Browser checklist from docs/superpowers/plans/2026-10-04-hackathon-popup.md, Task 4
- [ ] No CSP errors on the Cloudflare preview

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
