export const NAV_LABEL_EXPERIMENT = "nav-get-involved-label";
export const EXPOSURE_EVENT = "Nav Label Shown";

export type NavLabelVariant = "A" | "B";

export const NAV_LABEL_HREF = "/volunteer";
export const NAV_LABELS: Readonly<Record<NavLabelVariant, string>> = {
  A: "Get Involved",
  B: "Member Opportunities",
};

const VARIANTS: readonly NavLabelVariant[] = ["A", "B"];

export interface FeatureOutcome {
  value: unknown;
  source: string;
}

// The variant comes from the "nav-get-involved-label" GrowthBook flag, evaluated on the server
// (src/lib/navAssignment.ts) with an id that is a keyed hash of the day, IP and User-Agent:
// a visitor keeps one label all day and nothing is stored on their device.
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
    type: "prerenderingchange",
    listener: () => void,
    options?: AddEventListenerOptions
  ): void;
}

export interface TrackNavLabelOptions {
  track?: TrackEvent;
  doc?: ExperimentDocument;
}

const LINK_SELECTOR = "a[data-experiment][data-variant]";

/** The nav label test props for the page's navbar, to attach to the conversion event
 * (Membership-complete). Empty when the visitor is not in the test.
 * The navbar is in the DOM on every Layout page, including when it is hidden by CSS. */
export function navExperimentProps(
  doc: Pick<Document, "querySelector"> = document
): Record<string, string> {
  const link = doc.querySelector(LINK_SELECTOR) as HTMLElement | null;
  const experiment = link?.dataset.experiment;
  const variant = link?.dataset.variant;
  return experiment && variant ? { experiment, variant } : {};
}

const trackWithPlausible: TrackEvent = (name, props) => {
  window.plausible?.(name, { props });
};

// Records one exposure per page view when the nav carries an experiment link: the
// denominator for sign-ups per variant.
//
// Layout prerenders some pages via speculation rules, and prerendered pages run their
// scripts, so the exposure waits until the page is actually shown.
export function trackNavLabel(options: TrackNavLabelOptions = {}): void {
  const { track = trackWithPlausible, doc = document as unknown as ExperimentDocument } = options;
  const props = navExperimentProps(doc);
  if (!props.experiment) return;

  const recordExposure = (): void => track(EXPOSURE_EVENT, props);
  if (doc.prerendering) {
    doc.addEventListener("prerenderingchange", recordExposure, { once: true });
  } else {
    recordExposure();
  }
}
