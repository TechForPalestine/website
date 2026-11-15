export const NAV_LABEL_EXPERIMENT = "nav-get-involved-label";
export const EXPOSURE_EVENT = "Nav Label Shown";
export const CLICK_EVENT = "Nav Label Click";

export type NavLabelVariant = "A" | "B";

export interface NavLabelItem {
  label: string;
  href: string;
  submenu: [string, string][] | null;
}

// A: "Get Involved" with its full submenu (the control). B: "Member Opportunities", a single
// link straight to /volunteer with no submenu.
export const NAV_VARIANTS: Readonly<Record<NavLabelVariant, NavLabelItem>> = {
  A: {
    label: "Get Involved",
    href: "/get-involved",
    submenu: [
      ["Become a Member", "/membership"],
      ["Donate", "/donate"],
      ["Join the Incubator", "https://techforpalestine.org/project-application-form"],
      ["Volunteer", "/volunteer"],
      ["Entrepreneurs for Palestine", "/e4p"],
      ["Hire Palestinians", "/help/hire"],
      ["Join our Discord", "https://techforpalestine.org/discord-invite"],
    ],
  },
  B: {
    label: "Member Opportunities",
    href: "/volunteer",
    submenu: null,
  },
};

const MIDDLE_BUTTON = 1;
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
const SITE_ORIGIN = "https://techforpalestine.org";

/** Where a nav click went, as sent in the click event's `destination` prop: a path for
 * pages on this site ("/membership"), the full URL for other sites. Lets the dashboard
 * count, per variant, clicks that lead to a given page. */
export function navClickDestination(href: string | null): string | undefined {
  if (!href) return undefined;
  let url: URL;
  try {
    url = new URL(href, SITE_ORIGIN);
  } catch {
    return href;
  }
  if (url.origin !== SITE_ORIGIN) return href;
  return url.pathname.length > 1 ? url.pathname.replace(/\/$/, "") : url.pathname;
}

/** The nav label test props for the page's navbar, to attach to conversion events
 * (About You Complete, Membership-complete). Empty when the visitor is not in the test.
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

// Records one exposure per page view when the nav carries an experiment link, and every
// click on that link or, for variant A, on any of its submenu links (desktop or mobile menu).
// Each click carries the link's `destination` (see navClickDestination). The mobile menu is
// rendered on demand, so clicks are caught by delegation on the document.
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
    if (!clicked) return;
    const destination = navClickDestination(clicked.getAttribute("href"));
    track(CLICK_EVENT, destination ? { ...props, destination } : props);
  };
  doc.addEventListener("click", onClick);
  doc.addEventListener("auxclick", onClick);
}
