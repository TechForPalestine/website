export const HOMEPAGE_EXPERIMENT = "homepage-description";
export const EXPOSURE_EVENT = "Experiment Exposure";
export const CTA_CLICK_EVENT = "CTA Click";

export type HomepageVariant = "control" | "treatment";

// Assigned per request on the server: nothing is stored, so a visitor can see a
// different variant on each page view. That is the price of needing no consent banner.
export function pickHomepageVariant(random: () => number = Math.random): HomepageVariant {
  return random() < 0.5 ? "control" : "treatment";
}

interface PlausibleWindow {
  plausible?: (name: string, options?: { props: Record<string, string> }) => void;
}

export function trackExperimentEvent(name: string, experiment: string, variant: string): void {
  (window as PlausibleWindow).plausible?.(name, { props: { experiment, variant } });
}

// Fires one exposure per page view, and at most one click per page view, for the link
// carrying data-experiment / data-variant.
export function trackCtaLink(link: HTMLElement): void {
  const experiment = link.dataset.experiment;
  const variant = link.dataset.variant;
  if (!experiment || !variant) return;

  trackExperimentEvent(EXPOSURE_EVENT, experiment, variant);
  link.addEventListener("click", () => trackExperimentEvent(CTA_CLICK_EVENT, experiment, variant), {
    once: true,
  });
}
