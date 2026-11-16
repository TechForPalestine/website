// Pure navigation helpers for the online Wikipedia report reader
// (/wikipedia-report-2026). Kept free of astro:content so they can be unit
// tested; the pages pass in `entry.data` from the wikipediaReport collection.

import { REPORT_BASE_PATH } from "../../utils/wikipediaReportLinks";

/** Slug of the front-matter entry rendered on the index page. */
export const INDEX_SLUG = "executive-summary";

export interface ReportTocItem {
  /** "6.1"; absent on front-matter and appendix headings. */
  number?: string;
  title: string;
  depth: number;
  id: string;
}

export interface ReportEntryMeta {
  slug: string;
  kind: "front" | "section" | "appendix";
  /** "Section 6", "Appendix E"; absent for front matter. */
  label?: string;
  title: string;
  order: number;
  toc: ReportTocItem[];
}

export interface TocGroup extends ReportTocItem {
  children: ReportTocItem[];
}

/** URL of a reader page. The executive summary lives at the index. */
export function entryHref(slug: string): string {
  return slug === INDEX_SLUG ? REPORT_BASE_PATH : `${REPORT_BASE_PATH}/${slug}`;
}

/** Reading order, without mutating the input. */
export function sortEntries<T extends Pick<ReportEntryMeta, "order">>(entries: readonly T[]): T[] {
  return [...entries].sort((a, b) => a.order - b.order);
}

/** The pages either side of `slug` in reading order (null at either end). */
export function adjacentEntries<T extends Pick<ReportEntryMeta, "order" | "slug">>(
  entries: readonly T[],
  slug: string
): { prev: T | null; next: T | null } {
  const sorted = sortEntries(entries);
  const index = sorted.findIndex((entry) => entry.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return { prev: sorted[index - 1] ?? null, next: sorted[index + 1] ?? null };
}

/**
 * Depth-2 headings with their depth-3 headings nested beneath. Deeper items
 * are dropped (they would bury the outline), as are depth-3 items that come
 * before any depth-2 heading.
 */
export function groupToc(toc: readonly ReportTocItem[]): TocGroup[] {
  const groups: TocGroup[] = [];
  for (const item of toc) {
    if (item.depth === 2) {
      groups.push({ ...item, children: [] });
    } else if (item.depth === 3 && groups.length > 0) {
      const last = groups[groups.length - 1];
      groups[groups.length - 1] = { ...last, children: [...last.children, item] };
    }
  }
  return groups;
}

/** "Section 6" → "6", "Appendix E" → "E"; front matter has none. */
export function entryShortLabel(entry: Pick<ReportEntryMeta, "label">): string | undefined {
  const last = entry.label?.trim().split(/\s+/).pop();
  return last || undefined;
}

/** "Section 6: The ADL report", or just the title for front matter. */
export function entryFullTitle(entry: Pick<ReportEntryMeta, "label" | "title">): string {
  return entry.label ? `${entry.label}: ${entry.title}` : entry.title;
}

export interface Crumb {
  name: string;
  /** Absolute URL. */
  url: string;
}

/** schema.org BreadcrumbList for a reader page. */
export function breadcrumbListSchema(crumbs: readonly Crumb[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}
