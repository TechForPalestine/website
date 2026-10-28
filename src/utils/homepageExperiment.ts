export const HOMEPAGE_EXPERIMENT = "homepage-description";
export const EXPOSURE_EVENT = "Homepage Description Shown";
export const CTA_CLICK_EVENT = "Homepage Description CTA Click";

export type HomepageVariant = "A" | "B";

const MIDDLE_BUTTON = 1;
const VARIANTS: readonly HomepageVariant[] = ["A", "B"];

export interface FeatureOutcome {
  value: unknown;
  source: string;
}

// The variant comes from the "homepage-description" GrowthBook flag, evaluated on the server
// with a fresh id per request (see src/lib/growthbookServer.ts): nothing is stored, so a
// visitor can see a different variant on each page view. That is the price of needing no
// consent banner.
//
// The flag is a percentage rollout to "B" followed by a catch-all force to "A", so a bucketed
// visitor always reports source "force". A disabled flag, a missing flag or an unreachable
// CDN reports something else, and returns null: show the control and track nothing.
export function variantFromFeature({ value, source }: FeatureOutcome): HomepageVariant | null {
  if (source !== "force") return null;
  return VARIANTS.find((variant) => variant === value) ?? null;
}

export type TrackEvent = (name: string, props: Record<string, string>) => void;

// The parts of Document this needs. `prerendering` is not in TypeScript's DOM lib yet.
export interface PrerenderAwareDocument {
  prerendering?: boolean;
  addEventListener(
    type: "prerenderingchange",
    listener: () => void,
    options?: AddEventListenerOptions
  ): void;
}

export interface TrackHeroCtasOptions {
  track?: TrackEvent;
  doc?: PrerenderAwareDocument;
}

const trackWithPlausible: TrackEvent = (name, props) => {
  window.plausible?.(name, { props });
};

// Records one exposure per page view for the container carrying data-experiment /
// data-variant, and at most one click per page view across its data-cta links, tagged with
// which link was clicked.
//
// Layout prerenders "/" from every page, and prerendered pages run their scripts, so the
// exposure waits until the page is actually shown. Middle-clicks (open in new tab) count too.
export function trackHeroCtas(container: HTMLElement, options: TrackHeroCtasOptions = {}): void {
  const { track = trackWithPlausible, doc = document as PrerenderAwareDocument } = options;
  const { experiment, variant } = container.dataset;
  if (!experiment || !variant) return;

  const recordExposure = (): void => track(EXPOSURE_EVENT, { experiment, variant });
  if (doc.prerendering) {
    doc.addEventListener("prerenderingchange", recordExposure, { once: true });
  } else {
    recordExposure();
  }

  const onClick = (event: MouseEvent): void => {
    if (event.type === "auxclick" && event.button !== MIDDLE_BUTTON) return;
    const link = (event.target as Element | null)?.closest<HTMLElement>("a[data-cta]");
    const cta = link?.dataset.cta;
    if (!cta) return;
    container.removeEventListener("click", onClick);
    container.removeEventListener("auxclick", onClick);
    track(CTA_CLICK_EVENT, { experiment, variant, cta });
  };
  container.addEventListener("click", onClick);
  container.addEventListener("auxclick", onClick);
}
