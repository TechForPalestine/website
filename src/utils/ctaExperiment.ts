export const CTA_FEATURE_KEY = "homepage-cta-text";
export const CTA_DEFAULT_TEXT = "Apply to the Incubator";
export const EXPOSURE_EVENT = "Experiment Exposure";
export const CTA_CLICK_EVENT = "CTA Click";

interface PlausibleWindow {
  plausible?: (name: string, options?: { props: Record<string, string> }) => void;
}

export function trackExperimentEvent(name: string, experiment: string, variant: string): void {
  (window as PlausibleWindow).plausible?.(name, { props: { experiment, variant } });
}
