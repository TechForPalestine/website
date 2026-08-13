# Fix: Qgiv payment panel clipping on /membership and /supporting-member

## Problem

The embedded Qgiv payment form (Step 2/2) on `/membership` and `/supporting-member` was
taller than the hardcoded 640px panel it rendered inside. The panel had
`overflow: hidden`, so anything past 640px — including the form's own
submit/continue button — was clipped off-screen and unreachable.

## Root cause

Two places hardcoded a 640px height combined with `overflow: hidden`:

1. `src/components/membership/QgivJoin.tsx` (the embed's own wrapper)
2. `src/components/membership/LegacyJoinSection.tsx` (the panel wrapping both
   `AboutYouStep` and `QgivJoin`, via the `JOIN_PANEL_HEIGHT` constant)

## Fix

Switched both from a hard `height` + `overflow: hidden` cap to a `minHeight`
floor with no clipping. Short content (loading spinner, About You form) still
gets a reasonable minimum height so it doesn't look collapsed; taller content
(the real Qgiv payment form once loaded) is now free to grow the panel to fit.

### `src/components/membership/QgivJoin.tsx` (lines 218–220)

Before:
```tsx
  return (
    <div className={className ?? "max-h-[640px] overflow-hidden"}>
      <div className="relative" style={{ height: 640 }}>
```

After:
```tsx
  return (
    <div className={className}>
      <div className="relative" style={{ minHeight: 640 }}>
```

Checked all call sites (`MembershipDues.tsx`, `LegacyJoinSection.tsx`) — neither
passes a `className` prop, so nothing relied on the removed
`"max-h-[640px] overflow-hidden"` default. Dropped the fallback entirely
rather than replacing it with a non-clipping equivalent, since it was unused.

### `src/components/membership/LegacyJoinSection.tsx`

Doc comment above the constant (lines 15–17), before:
```tsx
/** Shared fixed height for the About You / payment panel, matching QgivJoin's
 * own max-height cap, so switching between the two never resizes the panel. */
const JOIN_PANEL_HEIGHT = 640;
```

After:
```tsx
/** Shared minimum height for the About You / payment panel, matching QgivJoin's
 * own minimum, so short content (the loading spinner, the About You form)
 * doesn't look collapsed. The panel is allowed to grow taller than this when
 * the Qgiv payment form needs more room, rather than clipping it. */
const JOIN_PANEL_HEIGHT = 640;
```

Panel Box (formerly line 147), before:
```tsx
            <Box sx={{ height: JOIN_PANEL_HEIGHT, overflow: "hidden" }}>
```

After:
```tsx
            <Box sx={{ minHeight: JOIN_PANEL_HEIGHT }}>
```

AboutYouStep wrapper Box (formerly lines 154–160), before:
```tsx
              <Box
                sx={{
                  display: step === "about-you" ? "flex" : "none",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
```

After (removed `height: "100%"`, since the parent is now `minHeight`-based —
an auto/used height, not a definite one — so a percentage height on the child
wouldn't reliably resolve; horizontal centering via flex is preserved):
```tsx
              <Box
                sx={{
                  display: step === "about-you" ? "flex" : "none",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
```

## Verification

- `pnpm check` from repo root: **0 errors, 0 warnings, 89 hints** (all
  pre-existing, unrelated to this change — e.g. deprecated `frameborder`/`atob`,
  `is:inline` script hints on unrelated pages).
- Manually re-read both full files after editing to confirm:
  - No `overflow: hidden` remains anywhere that could clip the Qgiv iframe or
    its content (the outer grid wrapper's `overflow: hidden` at line ~127 in
    `LegacyJoinSection.tsx` is on the *reveal* transition wrapper, driven by
    `gridTemplateRows: revealed ? "1fr" : "0fr"` — with `1fr` engaged, that
    row sizes to its content's intrinsic height, so it does not clip a taller
    inner panel; this is unrelated to the 640px cap being fixed here).
  - `JOIN_PANEL_HEIGHT` is now consumed only as `minHeight`, not `height`.
  - JSX braces/tags remain balanced in both files.
- Did not start a dev server or curl any pages, per project policy — relied on
  `pnpm check` plus manual read-through.

## Concerns

None blocking. One thing worth noting rather than a blocker: the Qgiv iframe's
own height is controlled by Qgiv's embed script itself (see
`src/components/membership/qgiv.ts`, which was intentionally left unchanged
per instructions). The container div (`qgiv-embed-container`) only receives a
`data-width="630"` attribute — no explicit height — so the iframe's rendered
height is whatever Qgiv's script sets based on its own content once loaded.
That was already true before this change (the old code's `height: 640` on the
*outer* wrapper never applied a height to the iframe itself — it only clipped
whatever the iframe naturally rendered at above 640px). Since the bug report
explicitly describes the observed symptom as the taller-than-640px form being
clipped (not rendered at 0 height), the iframe is confirmed to already size
itself correctly to its content; removing the clip is sufficient. No changes
to `qgiv.ts` or Qgiv's own embed behavior were needed or made.

## Commit

`fix(membership): let the payment panel grow to fit the Qgiv form instead of clipping it`
