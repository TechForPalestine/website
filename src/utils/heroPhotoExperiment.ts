export const HERO_PHOTO_EXPERIMENT = "homepage-hero-photo";

export type HeroPhotoVariant = "control" | "speaker" | "laptops" | "stage";

export interface HeroPhoto {
  src: string;
  srcset: string;
  width: number;
  height: number;
  alt: string;
  credit: string;
  /** Tailwind object-position classes, written as complete literals so the content scan finds them. */
  position: string;
}

const VARIANTS: readonly HeroPhotoVariant[] = ["control", "speaker", "laptops", "stage"];

// The hero photo for each variant. "control" is the photo the homepage has always shown.
export const HERO_PHOTOS: Readonly<Record<HeroPhotoVariant, HeroPhoto>> = {
  control: {
    src: "/happy-kids-1600.webp",
    srcset: "/happy-kids-800.webp 800w, /happy-kids-1600.webp 1600w",
    width: 1600,
    height: 1200,
    alt: "Children in Gaza smiling for the camera",
    credit: "© Motaz Azaiza",
    position: "object-center",
  },
  speaker: {
    src: "/images/hero/speaker-1600.webp",
    srcset: "/images/hero/speaker-800.webp 800w, /images/hero/speaker-1600.webp 1600w",
    width: 1600,
    height: 1068,
    alt: "A man reads from a sheet of paper to a seated group, with an embroidered map of Palestine hanging on the wall behind him",
    // TODO(launch): photographer credit from the team
    credit: "TODO credit",
    position: "object-center",
  },
  laptops: {
    src: "/images/hero/laptops-1600.webp",
    srcset: "/images/hero/laptops-800.webp 800w, /images/hero/laptops-1600.webp 1600w",
    width: 1600,
    height: 994,
    alt: "Three people work together at laptops covered in Palestinian flag and watermelon stickers",
    // TODO(launch): photographer credit from the team
    credit: "TODO credit",
    position: "object-[50%_50%] lg:object-[52%_50%]",
  },
  stage: {
    src: "/images/hero/stage-1600.webp",
    srcset: "/images/hero/stage-800.webp 800w, /images/hero/stage-1600.webp 1600w",
    width: 1600,
    height: 898,
    alt: "Two people on stage applaud between a Thaura banner and a Tech for Palestine banner",
    // TODO(launch): photographer credit from the team
    credit: "TODO credit",
    position: "object-[50%_50%]",
  },
};

export interface FeatureOutcome {
  value: unknown;
  source: string;
}

// The variant comes from the "homepage-hero-photo" GrowthBook experiment rule, evaluated on
// the server (src/lib/heroPhotoAssignment.ts). A bucketed visitor reports source
// "experiment"; a disabled flag, a missing flag or an unreachable CDN reports something else,
// and returns null: show the control photo and track nothing.
export function variantFromFeature({ value, source }: FeatureOutcome): HeroPhotoVariant | null {
  if (source !== "experiment") return null;
  return VARIANTS.find((variant) => variant === value) ?? null;
}

export const LINK_CLICK_EVENT = "Homepage Link Click";

export type HomepageDestination = "/membership" | "/volunteer" | "/projects" | "/incubator";

const DESTINATIONS: readonly HomepageDestination[] = [
  "/membership",
  "/volunteer",
  "/projects",
  "/incubator",
];
const MIDDLE_BUTTON = 1;

/** The tracked homepage destination an href points at, or null for any other link. */
export function destinationFor(href: string, origin: string): HomepageDestination | null {
  let url: URL;
  try {
    url = new URL(href, origin);
  } catch {
    return null;
  }
  if (url.origin !== origin) return null;
  const path = url.pathname.replace(/\/$/, "");
  return DESTINATIONS.find((destination) => destination === path) ?? null;
}

export interface TrackHomepageLinksOptions {
  track?: (name: string, props: Record<string, string>) => void;
  doc?: Pick<Document, "addEventListener">;
  origin?: string;
}

const trackWithPlausible: NonNullable<TrackHomepageLinksOptions["track"]> = (name, props) => {
  window.plausible?.(name, { props });
};

// Records clicks on links to the four pages the experiment measures. Delegated on the
// document so the on-demand mobile menu counts too; middle-clicks (new tab) count, other
// buttons do not. `hero_photo` is attached to every event by Plausible's customProperties.
export function trackHomepageLinks(options: TrackHomepageLinksOptions = {}): void {
  const { track = trackWithPlausible, doc = document, origin = location.origin } = options;

  const onClick = (event: MouseEvent): void => {
    if (event.type === "auxclick" && event.button !== MIDDLE_BUTTON) return;
    const link = (event.target as Element | null)?.closest?.("a[href]");
    const destination = destinationFor(link?.getAttribute("href") ?? "", origin);
    if (destination) track(LINK_CLICK_EVENT, { destination });
  };
  doc.addEventListener("click", onClick);
  doc.addEventListener("auxclick", onClick);
}
