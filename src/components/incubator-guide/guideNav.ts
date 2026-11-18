// Reading order and links for the incubator project leader guide. Kept free of
// astro:content so it can be unit tested; guideData.ts does the collection read.

import { GUIDE_URL } from "../../data/incubator";

export interface GuideChapter {
  slug: string;
  title: string;
  description: string;
  order: number;
}

/** A link in the guide's contents: the overview page or a chapter. */
export interface GuideLink {
  slug: string | null;
  title: string;
  href: string;
}

export const OVERVIEW_LINK: GuideLink = {
  slug: null,
  title: "Overview: what to expect",
  href: GUIDE_URL,
};

export function chapterHref(slug: string): string {
  return `${GUIDE_URL}/${slug}`;
}

export function sortChapters(chapters: GuideChapter[]): GuideChapter[] {
  return [...chapters].sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

/** The overview followed by every chapter, in reading order. */
export function guideLinks(chapters: GuideChapter[]): GuideLink[] {
  return [
    OVERVIEW_LINK,
    ...sortChapters(chapters).map((c) => ({
      slug: c.slug,
      title: c.title,
      href: chapterHref(c.slug),
    })),
  ];
}

/** The pages either side of `slug` (null for the overview) in reading order. */
export function adjacentLinks(
  chapters: GuideChapter[],
  slug: string | null
): { prev: GuideLink | null; next: GuideLink | null } {
  const links = guideLinks(chapters);
  const i = links.findIndex((l) => l.slug === slug);
  if (i === -1) return { prev: null, next: null };
  return { prev: links[i - 1] ?? null, next: links[i + 1] ?? null };
}
