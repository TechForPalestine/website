// Motion for the report reader, kept to transform/opacity so the ~730 KB
// full-text page never re-lays out its article per frame. Imported by
// ReportScripts; all of it is skipped under prefers-reduced-motion (the CSS
// guards the same states, so nothing animates even if JS runs).
//
//   animateRailToggle  FLIP for "Hide contents" / "Show contents": the new
//                      grid is applied in one step, then the article glides
//                      from its old x offset and the rail slides/fades.
//   initAnchorScroll   Short in-page anchor clicks glide: it sets a one-shot
//                      html[data-report-smooth] (the only thing that turns on
//                      scroll-behavior: smooth) and clears it after landing.
//                      Long jumps, hash URLs, back/forward and no-JS clicks
//                      stay instant. A glide's landing is checked, because
//                      content-visibility sections rendering mid-glide can
//                      move the target; any reader input cancels the check.

/** Glide at most this many viewport heights; farther jumps are instant. */
const MAX_GLIDE_VIEWPORTS = 2.5;
/** A landing this close to the scroll margin counts as on target. */
const LANDING_TOLERANCE_PX = 4;
/** Must match the rail/article durations in wikipedia-report.css. */
const RAIL_MS = 280;
/** Scroll position is sampled this often to detect that a glide ended. */
const SCROLL_SAMPLE_MS = 80;
/** Samples in a row at the same position that count as "stopped". */
const SETTLED_SAMPLES = 3;
/** Give up waiting (and skip the landing check) after this long. */
const SETTLE_GIVE_UP_MS = 4000;

export function isLongJump(distancePx: number, viewportPx: number): boolean {
  if (viewportPx <= 0) return true;
  return Math.abs(distancePx) > viewportPx * MAX_GLIDE_VIEWPORTS;
}

export interface Extent {
  top: number;
  bottom: number;
}

/**
 * How far a jump travels. A target inside a content-visibility section is
 * measured only when that section overlaps the viewport (so it is rendered
 * and measuring is cheap); otherwise the section's top stands in for it, so
 * a skipped section is not forced to lay out.
 */
export function jumpDistance(
  section: Extent | null,
  viewportPx: number,
  targetTop: () => number
): number {
  if (!section) return targetTop();
  const overlaps = section.bottom > 0 && section.top < viewportPx;
  return overlaps ? targetTop() : section.top;
}

/** True once the last SETTLED_SAMPLES scroll positions are identical. */
export function hasSettled(positions: readonly number[]): boolean {
  if (positions.length < SETTLED_SAMPLES) return false;
  const recent = positions.slice(-SETTLED_SAMPLES);
  return recent.every((position) => position === recent[0]);
}

export interface Landing {
  /** Target's top relative to the viewport after scrolling. */
  top: number;
  /** Its resolved scroll-margin-top in px. */
  scrollMargin: number;
  /** The page is scrolled to the bottom, so the target cannot rise further. */
  atPageEnd: boolean;
  viewport: number;
}

/**
 * Correct only small drifts. A target a viewport or more away from where it
 * should be means the reader moved on; leave the page where it is.
 */
export function needsLandingFix({ top, scrollMargin, atPageEnd, viewport }: Landing): boolean {
  if (atPageEnd) return false;
  const drift = Math.abs(top - scrollMargin);
  return drift > LANDING_TOLERANCE_PX && drift < viewport;
}

const reduceMotion = (): boolean => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let finishRail: (() => void) | null = null;

/**
 * Runs `apply` (which toggles data-sidebar-hidden) and animates the change.
 * Writes only custom properties via CSSOM (`style.setProperty`), which the
 * CSP allows; it is `style=""` in markup that the policy blocks.
 */
export function animateRailToggle(layout: HTMLElement, apply: () => void, hiding: boolean): void {
  finishRail?.();
  const main = layout.querySelector<HTMLElement>(":scope > [data-report-main]");
  const rail = layout.querySelector<HTMLElement>(":scope > [data-report-sidebar]");
  // finishRail ends the article transition; a rail still sliding in
  // (report-rail-in) would otherwise be measured mid-transform.
  for (const animation of rail?.getAnimations?.() ?? []) animation.finish();
  const scroller = rail?.querySelector<HTMLElement>("[data-outline-scroller]");
  const desktop = window.matchMedia("(min-width: 768px)").matches;
  if (!main || !rail || !scroller || !desktop || reduceMotion()) {
    apply();
    return;
  }

  // First: where things are now.
  const before = main.getBoundingClientRect().left;
  const railBox = hiding ? scroller.getBoundingClientRect() : null;
  // Last: one layout with the new grid.
  apply();
  const dx = before - main.getBoundingClientRect().left;

  // Invert: put the article back where it was, and pin the leaving rail
  // (fixed, at its old box) so it can fade out of the flow.
  main.style.setProperty("--rp-flip-x", `${dx}px`);
  if (railBox) {
    rail.style.setProperty("--rp-rail-top", `${railBox.top}px`);
    rail.style.setProperty("--rp-rail-left", `${railBox.left}px`);
    rail.style.setProperty("--rp-rail-width", `${railBox.width}px`);
    layout.dataset.sidebarLeaving = "";
  }
  layout.dataset.flip = "from";
  // Commit the inverted transform before releasing it (style only, no layout).
  void getComputedStyle(main).transform;
  // Play.
  layout.dataset.flip = "play";

  const done = () => {
    window.clearTimeout(timer);
    main.removeEventListener("transitionend", onEnd);
    delete layout.dataset.flip;
    delete layout.dataset.sidebarLeaving;
    main.style.removeProperty("--rp-flip-x");
    for (const name of ["--rp-rail-top", "--rp-rail-left", "--rp-rail-width"]) {
      rail.style.removeProperty(name);
    }
    finishRail = null;
  };
  const onEnd = (event: TransitionEvent) => {
    if (event.target === main && event.propertyName === "transform") done();
  };
  main.addEventListener("transitionend", onEnd);
  // transitionend never fires when dx is 0 or the tab is hidden.
  const timer = window.setTimeout(done, RAIL_MS + 120);
  finishRail = done;
}

function samePageTarget(link: HTMLAnchorElement): HTMLElement | null {
  if (link.origin !== location.origin || link.pathname !== location.pathname) return null;
  if (!link.hash || link.hash === "#") return null;
  try {
    return document.getElementById(decodeURIComponent(link.hash.slice(1)));
  } catch {
    return null;
  }
}

/**
 * Calls `onStop` once the page has stopped scrolling (sampled, so it works
 * with or without `scrollend` and never fires mid-glide), or `onGiveUp` if it
 * is still moving after SETTLE_GIVE_UP_MS. Returns a cancel function.
 */
function whenScrollStops(onStop: () => void, onGiveUp: () => void): () => void {
  const positions: number[] = [];
  const started = Date.now();
  let timer = 0;
  const sample = () => {
    positions.push(window.scrollY);
    if (hasSettled(positions)) {
      onStop();
      return;
    }
    if (Date.now() - started > SETTLE_GIVE_UP_MS) {
      onGiveUp();
      return;
    }
    timer = window.setTimeout(sample, SCROLL_SAMPLE_MS);
  };
  timer = window.setTimeout(sample, SCROLL_SAMPLE_MS);
  return () => window.clearTimeout(timer);
}

const USER_INPUT = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

/**
 * Smooth scrolling is opt-in per click: html[data-report-smooth] is the only
 * thing that enables it (wikipedia-report.css), so hash URLs, back/forward,
 * long jumps and no-JS clicks are all instant. The browser still performs the
 * navigation (hash, :target, focus start point).
 */
export function initAnchorScroll(): void {
  const root = document.documentElement;
  let cancelPending: (() => void) | null = null;

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>("a[href*='#']");
    const target = link && samePageTarget(link);
    // Only the latest jump may glide or correct its landing.
    cancelPending?.();
    if (!target || reduceMotion()) return;

    const section = target.closest<HTMLElement>(".report-cv")?.getBoundingClientRect() ?? null;
    const distance = jumpDistance(
      section,
      window.innerHeight,
      () => target.getBoundingClientRect().top
    );
    if (isLongJump(distance, window.innerHeight)) return;

    // The navigation runs right after this handler, with smooth scrolling on.
    root.dataset.reportSmooth = "";
    let stopWaiting = () => {};
    const finish = () => {
      stopWaiting();
      for (const type of USER_INPUT) window.removeEventListener(type, finish, true);
      delete root.dataset.reportSmooth;
      cancelPending = null;
    };
    // The reader takes over: stop the glide-mode and never correct.
    for (const type of USER_INPUT) {
      window.addEventListener(type, finish, { capture: true, passive: true });
    }
    stopWaiting = whenScrollStops(() => {
      finish();
      const scrollMargin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      const atPageEnd = Math.ceil(window.scrollY + window.innerHeight) >= root.scrollHeight - 1;
      const top = target.getBoundingClientRect().top;
      if (needsLandingFix({ top, scrollMargin, atPageEnd, viewport: window.innerHeight })) {
        target.scrollIntoView({ block: "start", behavior: "instant" });
      }
    }, finish);
    cancelPending = finish;
  });
}
