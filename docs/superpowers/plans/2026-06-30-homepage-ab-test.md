# Homepage A/B Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split homepage traffic 50/50 between the current design (`/`) and the new design (`/home-new`), with sticky assignment via localStorage and variant exposure tracked in Plausible.

**Architecture:** A synchronous inline script injected into the `<head>` of `index.astro` via the `slot="head"` mechanism reads or assigns an `ab-homepage-variant` key in localStorage, then immediately calls `location.replace('/home-new')` for variant users before first paint. A separate inline script at the bottom of each page fires a Plausible custom event after the Plausible queue is initialised.

**Tech Stack:** Astro (slot injection, `is:inline` scripts), localStorage, Plausible Analytics (`window.plausible` queue pattern already set up in `Layout.astro` and `HomeLayout.astro`)

## Global Constraints

- Never use `style=""` attributes — use Tailwind classes only (CSP blocks inline styles)
- All inline `<script>` tags get nonces injected automatically by the CSP middleware's HTMLRewriter — no manual nonce handling needed
- localStorage key: `ab-homepage-variant`; values: `"control"` or `"variant"`
- Plausible event name: `ab-homepage`; property key: `variant`; values: `"control"` or `"new"`
- Do not commit the spec or plan files

---

## File Map

| File                       | Change                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| `src/pages/index.astro`    | Add anti-flicker script via `slot="head"` + Plausible tracking script at bottom of `<main>` |
| `src/pages/home-new.astro` | Add Plausible tracking script at bottom of `<main>`                                         |

---

### Task 1: Anti-flicker script on the control page (`index.astro`)

**Files:**

- Modify: `src/pages/index.astro`

**Context:**

- `Layout.astro` has a `<slot name="head" />` at line 127, before its Plausible queue script at line 130. Any element with `slot="head"` in `index.astro` is rendered there.
- The Plausible queue (`window.plausible = window.plausible || function(...){}`) is set up in the layout `<head>` AFTER the slot, so `window.plausible` is NOT available inside a `slot="head"` script. The Plausible tracking call must go in a separate body-level script.
- `location.replace('/home-new')` is used (not `location.href`) to prevent the control page being added to browser history, avoiding a broken back-button experience.

- [ ] **Step 1: Add the anti-flicker script to `index.astro`**

Open `src/pages/index.astro`. After the closing `---` of the frontmatter and before the `<Layout>` opening tag, add:

```astro
<script is:inline slot="head">
  (function () {
    var key = "ab-homepage-variant";
    var v = localStorage.getItem(key);
    if (!v) {
      v = Math.random() < 0.5 ? "control" : "variant";
      localStorage.setItem(key, v);
    }
    if (v === "variant") {
      location.replace("/home-new");
    }
  })();
</script>
```

The full top of the file should look like:

```astro
---
import Layout from "../layouts/Layout.astro";
import SignUpForm from "../structures/SignUpForm.astro";
import "../styles/base.css";
---

<script is:inline slot="head">
  (function () {
    var key = "ab-homepage-variant";
    var v = localStorage.getItem(key);
    if (!v) {
      v = Math.random() < 0.5 ? "control" : "variant";
      localStorage.setItem(key, v);
    }
    if (v === "variant") {
      location.replace("/home-new");
    }
  })();
</script>

<Layout title="Tech For Palestine" ...
```

- [ ] **Step 2: Add the Plausible tracking script at the bottom of `<main>`**

Locate the closing `</main>` tag in `src/pages/index.astro` and insert the tracking script immediately before it:

```astro
<script is:inline>
  (function () {
    var v = localStorage.getItem("ab-homepage-variant");
    if (v === "control") {
      window.plausible("ab-homepage", { props: { variant: "control" } });
    }
  })();
</script>
```

The guard `v === "control"` ensures the event only fires for users who were properly assigned through the A/B test (not someone who cleared their storage mid-session).

- [ ] **Step 3: Verify locally**

Start the dev server:

```bash
pnpm dev
```

Open `http://localhost:4321` in a browser with devtools open.

**Test A — variant assignment:**

1. Open Application → Local Storage → `http://localhost:4321`
2. Confirm `ab-homepage-variant` is absent
3. Hard-reload the page several times
4. Confirm the key gets set to either `"control"` or `"variant"`
5. If `"variant"`: confirm the browser redirected to `/home-new` (check Network tab for a redirect, URL bar shows `/home-new`)
6. If `"control"`: confirm the homepage renders normally

**Test B — stickiness:**

1. Set `ab-homepage-variant` to `"variant"` manually in devtools
2. Navigate to `/` — should immediately redirect to `/home-new`
3. Set `ab-homepage-variant` to `"control"` manually
4. Navigate to `/` — should stay on `/`

**Test C — Plausible event (control):**

1. Set `ab-homepage-variant` to `"control"`
2. Navigate to `/`
3. Open Console and run: `window.plausible.q` — confirm an entry for `"ab-homepage"` with `{ variant: "control" }` is queued

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(ab-test): add homepage A/B anti-flicker script and variant tracking"
```

---

### Task 2: Plausible tracking on the variant page (`home-new.astro`)

**Files:**

- Modify: `src/pages/home-new.astro`

**Context:**

- `HomeLayout.astro` initialises the Plausible queue in the `<head>` (line 169–181), before `</body>`. Any `<script is:inline>` in the page body can safely call `window.plausible()`.
- We only fire the event if `ab-homepage-variant === "variant"` in localStorage. This excludes visitors who navigated directly to `/home-new` without going through the A/B assignment, keeping the data clean.

- [ ] **Step 1: Add Plausible tracking to `home-new.astro`**

Open `src/pages/home-new.astro`. Locate the closing `</main>` tag and insert immediately before it:

```astro
<script is:inline>
  (function () {
    var v = localStorage.getItem("ab-homepage-variant");
    if (v === "variant") {
      window.plausible("ab-homepage", { props: { variant: "new" } });
    }
  })();
</script>
```

- [ ] **Step 2: Verify locally**

With the dev server running:

**Test A — Plausible event fires for assigned variant users:**

1. Set `ab-homepage-variant` to `"variant"` in devtools
2. Navigate to `/home-new`
3. Open Console, run: `window.plausible.q`
4. Confirm an entry for `"ab-homepage"` with `{ variant: "new" }` is queued

**Test B — event does NOT fire for direct visitors:**

1. Clear `ab-homepage-variant` from localStorage (or delete the key)
2. Navigate directly to `/home-new`
3. Open Console, run: `window.plausible.q`
4. Confirm NO `"ab-homepage"` entry is present

**Test C — full flow end-to-end:**

1. Clear all localStorage
2. Navigate to `/`
3. If redirected to `/home-new`: confirm `ab-homepage-variant === "variant"` and Plausible event queued with `variant: "new"`
4. Clear localStorage, navigate to `/` again
5. If stays on `/`: confirm `ab-homepage-variant === "control"` and Plausible event queued with `variant: "control"`
6. Repeat until you've observed both branches

- [ ] **Step 3: Commit**

```bash
git add src/pages/home-new.astro
git commit -m "feat(ab-test): track variant exposure on home-new page"
```

---

## Plausible Dashboard Setup (manual step, after deployment)

After deploying, create the goal in Plausible:

1. Go to your Plausible dashboard → **Goals** → **Add goal**
2. Goal type: **Custom event**
3. Event name: `ab-homepage`
4. Save

Then in your dashboard reports, filter by the `variant` property to compare behaviour between `control` and `new` groups.

---

## Ending the Test

When you have a winner:

**If `variant` wins (new design):**

```bash
# 1. Replace index.astro content with home-new.astro content
# 2. Delete home-new.astro
# 3. Add redirect in public/_redirects:
echo "/home-new / 301" >> public/_redirects
# 4. Remove /home-new/ from the sitemap exclude list in astro.config.mjs
# 5. Commit
```

**If `control` wins (old design):**

```bash
# 1. Remove the anti-flicker script and tracking script from index.astro
# 2. Delete home-new.astro
# 3. Add redirect in public/_redirects:
echo "/home-new / 301" >> public/_redirects
# 4. Commit
```
