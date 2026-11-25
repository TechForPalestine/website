import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { HERO_PHOTOS, type HeroPhotoVariant, variantFromFeature } from "./heroPhotoExperiment";

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
