export const NAV_LABEL_EXPERIMENT = "nav-get-involved-label";
export const EXPOSURE_EVENT = "Nav Label Shown";
export const CLICK_EVENT = "Nav Label Click";

export type NavLabelVariant = "A" | "B";

export const NAV_LABEL_HREF = "/volunteer";
export const NAV_LABELS: Readonly<Record<NavLabelVariant, string>> = {
  A: "Get Involved",
  B: "Member Opportunities",
};

const MIDDLE_BUTTON = 1;
const VARIANTS: readonly NavLabelVariant[] = ["A", "B"];

export interface FeatureOutcome {
  value: unknown;
  source: string;
}

// The variant comes from the "nav-get-involved-label" GrowthBook flag, evaluated on the server
// with a fresh id per request (see src/lib/growthbookServer.ts): nothing is stored, so a
// visitor can see a different label on each page view. That is the price of needing no
// consent banner.
//
// The flag is a percentage rollout to "B" followed by a catch-all force to "A", so a bucketed
// visitor always reports source "force". A disabled flag, a missing flag or an unreachable
// CDN reports something else, and returns null: show "A" and track nothing.
export function variantFromFeature({ value, source }: FeatureOutcome): NavLabelVariant | null {
  if (source !== "force") return null;
  return VARIANTS.find((variant) => variant === value) ?? null;
}

export type TrackEvent = (name: string, props: Record<string, string>) => void;

// The parts of Document this needs. `prerendering` is not in TypeScript's DOM lib yet.
export interface ExperimentDocument {
  prerendering?: boolean;
  querySelector(selector: string): Element | null;
  addEventListener(
    type: "prerenderingchange" | "click" | "auxclick",
    listener: (event: MouseEvent) => void,
    options?: AddEventListenerOptions
  ): void;
}

export interface TrackNavLabelOptions {
  track?: TrackEvent;
  doc?: ExperimentDocument;
}

const LINK_SELECTOR = "a[data-experiment][data-variant]";

const trackWithPlausible: TrackEvent = (name, props) => {
  window.plausible?.(name, { props });
};

// Records one exposure per page view when the nav carries an experiment link, and every
// click on that link (desktop or mobile menu). The mobile menu is rendered on demand, so
// clicks are caught by delegation on the document.
//
// Layout prerenders some pages via speculation rules, and prerendered pages run their
// scripts, so the exposure waits until the page is actually shown. Middle-clicks (open in
// new tab) count too.
export function trackNavLabel(options: TrackNavLabelOptions = {}): void {
  const { track = trackWithPlausible, doc = document as unknown as ExperimentDocument } = options;
  const link = doc.querySelector(LINK_SELECTOR) as HTMLElement | null;
  const experiment = link?.dataset.experiment;
  const variant = link?.dataset.variant;
  if (!experiment || !variant) return;

  const props = { experiment, variant };
  const recordExposure = (): void => track(EXPOSURE_EVENT, props);
  if (doc.prerendering) {
    doc.addEventListener("prerenderingchange", recordExposure, { once: true });
  } else {
    recordExposure();
  }

  const onClick = (event: MouseEvent): void => {
    if (event.type === "auxclick" && event.button !== MIDDLE_BUTTON) return;
    const clicked = (event.target as Element | null)?.closest?.(LINK_SELECTOR);
    if (clicked) track(CLICK_EVENT, props);
  };
  doc.addEventListener("click", onClick);
  doc.addEventListener("auxclick", onClick);
}
