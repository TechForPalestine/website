import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  HERO_PHOTOS,
  type HeroPhotoVariant,
  LINK_CLICK_EVENT,
  destinationFor,
  trackHomepageLinks,
  variantFromFeature,
} from "./heroPhotoExperiment";

const VARIANTS: HeroPhotoVariant[] = ["control", "speaker", "laptops", "stage"];

describe("variantFromFeature", () => {
  it.each(VARIANTS)("returns %s for an experiment result", (value) => {
    expect(variantFromFeature({ value, source: "experiment" })).toBe(value);
  });

  it.each(["force", "defaultValue", "unknownFeature"])("returns null for source %s", (source) => {
    expect(variantFromFeature({ value: "laptops", source })).toBeNull();
  });

  it("returns null for an unknown value", () => {
    expect(variantFromFeature({ value: "other", source: "experiment" })).toBeNull();
  });
});

describe("HERO_PHOTOS", () => {
  it.each(VARIANTS)("%s has alt, credit and both srcset widths", (variant) => {
    const photo = HERO_PHOTOS[variant];
    expect(photo.alt).not.toBe("");
    expect(photo.credit).not.toBe("");
    expect(photo.srcset).toContain("800w");
    expect(photo.srcset).toContain("1600w");
  });

  it.each(VARIANTS)("%s references files that exist under public/", (variant) => {
    const photo = HERO_PHOTOS[variant];
    const paths = [photo.src, ...photo.srcset.split(",").map((part) => part.trim().split(" ")[0])];
    for (const path of paths) {
      expect(existsSync(join(process.cwd(), "public", path)), path).toBe(true);
    }
  });

  it("keeps today's hero photo for the control", () => {
    expect(HERO_PHOTOS.control).toMatchObject({
      src: "/happy-kids-1600.webp",
      srcset: "/happy-kids-800.webp 800w, /happy-kids-1600.webp 1600w",
      width: 1600,
      height: 1200,
      alt: "Children in Gaza smiling for the camera",
      credit: "© Motaz Azaiza",
    });
  });
});

const ORIGIN = "https://techforpalestine.org";

describe("destinationFor", () => {
  it.each([
    "/membership",
    "/membership/",
    "/membership?ref=x",
    "/membership#join",
    "https://techforpalestine.org/membership",
  ])("maps %s to /membership", (href) => {
    expect(destinationFor(href, ORIGIN)).toBe("/membership");
  });

  it("maps /incubator/ to /incubator", () => {
    expect(destinationFor("/incubator/", ORIGIN)).toBe("/incubator");
  });

  it.each([
    "/incubator-guide",
    "/membership/supporting",
    "/get-involved",
    "https://other.org/projects",
    "mailto:a@b.c",
    "javascript:void(0)",
    "",
  ])("returns null for %j without throwing", (href) => {
    expect(destinationFor(href, ORIGIN)).toBeNull();
  });
});

describe("trackHomepageLinks", () => {
  type Listener = (event: MouseEvent) => void;

  function setup() {
    const listeners = new Map<string, Listener[]>();
    const track = vi.fn();
    const doc = {
      addEventListener: (type: string, listener: Listener) => {
        listeners.set(type, [...(listeners.get(type) ?? []), listener]);
      },
    } as Pick<Document, "addEventListener">;
    trackHomepageLinks({ track, doc, origin: ORIGIN });
    const fire = (type: string, target: unknown, button = 0) => {
      const event = { type, button, target } as unknown as MouseEvent;
      listeners.get(type)?.forEach((listener) => listener(event));
    };
    return { track, fire };
  }

  const linkTo = (href: string) => ({ getAttribute: () => href });
  const insideLink = (href: string) => ({
    closest: (selector: string) => (selector === "a[href]" ? linkTo(href) : null),
  });

  it("tracks a click on a link once", () => {
    const { track, fire } = setup();
    fire("click", insideLink("/projects"));
    expect(track).toHaveBeenCalledOnce();
    expect(track).toHaveBeenCalledWith(LINK_CLICK_EVENT, { destination: "/projects" });
    expect(LINK_CLICK_EVENT).toBe("Homepage Link Click");
  });

  it("tracks a click on an element inside the link", () => {
    const { track, fire } = setup();
    fire("click", { closest: () => linkTo("/projects") });
    expect(track).toHaveBeenCalledOnce();
    expect(track).toHaveBeenCalledWith(LINK_CLICK_EVENT, { destination: "/projects" });
  });

  it("counts middle-clicks but not right-clicks", () => {
    const { track, fire } = setup();
    fire("auxclick", insideLink("/projects"), 2);
    expect(track).not.toHaveBeenCalled();
    fire("auxclick", insideLink("/projects"), 1);
    expect(track).toHaveBeenCalledOnce();
  });

  it("ignores links to other pages", () => {
    const { track, fire } = setup();
    fire("click", insideLink("/get-involved"));
    expect(track).not.toHaveBeenCalled();
  });

  it("ignores targets without closest", () => {
    const { track, fire } = setup();
    expect(() => fire("click", {})).not.toThrow();
    expect(() => fire("click", null)).not.toThrow();
    expect(track).not.toHaveBeenCalled();
  });
});
