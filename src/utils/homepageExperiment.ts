export const HOMEPAGE_EXPERIMENT = "homepage-description";
export const EXPOSURE_EVENT = "Homepage Description Shown";
export const CTA_CLICK_EVENT = "Homepage Description CTA Click";

export type HomepageVariant = "A" | "B";

// Assigned per request on the server: nothing is stored, so a visitor can see a
// different variant on each page view. That is the price of needing no consent banner.
export function pickHomepageVariant(random: () => number = Math.random): HomepageVariant {
  return random() < 0.5 ? "A" : "B";
}

interface PlausibleWindow {
  plausible?: (name: string, options?: { props: Record<string, string> }) => void;
}

export function trackExperimentEvent(name: string, props: Record<string, string>): void {
  (window as PlausibleWindow).plausible?.(name, { props });
}

// Fires one exposure per page view for the container carrying data-experiment /
// data-variant, and at most one click per page view across its data-cta links, tagged with
// which link was clicked.
export function trackHeroCtas(container: HTMLElement): void {
  const { experiment, variant } = container.dataset;
  if (!experiment || !variant) return;

  trackExperimentEvent(EXPOSURE_EVENT, { experiment, variant });

  const onClick = (event: MouseEvent): void => {
    const link = (event.target as Element | null)?.closest<HTMLElement>("a[data-cta]");
    const cta = link?.dataset.cta;
    if (!cta) return;
    container.removeEventListener("click", onClick);
    trackExperimentEvent(CTA_CLICK_EVENT, { experiment, variant, cta });
  };
  container.addEventListener("click", onClick);
}
