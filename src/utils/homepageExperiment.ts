export const HOMEPAGE_EXPERIMENT = "homepage-description";
export const EXPOSURE_EVENT = "Homepage Description Shown";
export const CTA_CLICK_EVENT = "Homepage Description CTA Click";

export type HomepageVariant = "A" | "B";

const VARIANT_A_SHARE = 0.5;
const MIDDLE_BUTTON = 1;

// Assigned per request on the server: nothing is stored, so a visitor can see a
// different variant on each page view. That is the price of needing no consent banner.
export function pickHomepageVariant(random: () => number = Math.random): HomepageVariant {
  return random() < VARIANT_A_SHARE ? "A" : "B";
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
