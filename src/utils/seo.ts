/**
 * Canonical URLs, JSON-LD structured data and sitemap XML, shared by the
 * layouts and pages so every public page tells search engines and AI
 * crawlers the same thing about who T4P is and which URL is authoritative.
 */

import type { ProjectItem } from "../types/projects";
import { projectPath } from "./projectSlug";

export const SITE_ORIGIN = "https://techforpalestine.org";
export const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;
export const WEBSITE_ID = `${SITE_ORIGIN}/#website`;

/**
 * Inline reference to T4P for nodes in other script blocks. Separate JSON-LD
 * blocks are not reliably merged, so a bare `{ "@id" }` can read as an
 * organization with no name; carrying name and url keeps each node valid alone.
 */
const ORGANIZATION_REF = {
  "@type": "NonprofitOrganization",
  "@id": ORGANIZATION_ID,
  name: "Tech for Palestine",
  url: SITE_ORIGIN,
};

type JsonLd = Record<string, unknown>;

/** `/about/` → `/about`. The root path keeps its slash. */
export function stripTrailingSlash(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

/**
 * The one canonical URL for a path. Internal links never use a trailing slash,
 * so `/page` and `/page/`, which both resolve, share the no-slash canonical
 * instead of each claiming to be canonical.
 */
export function canonicalUrl(pathname: string, site?: URL | string): string {
  return new URL(stripTrailingSlash(pathname), site || SITE_ORIGIN).toString();
}

/** Search results show roughly this many characters of a meta description. */
export const META_DESCRIPTION_MAX = 155;

/**
 * Collapses whitespace and cuts a description at a word boundary so it fits
 * in a search snippet, ending with an ellipsis when anything was dropped.
 */
export function truncateDescription(text: string, max: number = META_DESCRIPTION_MAX): string {
  const plain = text.replace(/\s+/g, " ").trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.-]+$/, "")}…`;
}

/**
 * JSON for a `<script type="application/ld+json">` body. Escapes `<`, `>`, `&`
 * and the JS line separators so CMS-sourced text (Notion FAQ answers,
 * ProjectHub descriptions) can never close the script element.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** An absolute http(s) URL in normalized form, or "" for anything else. */
export function toAbsoluteHttpUrl(value: string | undefined): string {
  if (!value) return "";
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
}

const SAME_AS = [
  "https://www.instagram.com/techforpalestine",
  "https://twitter.com/tech4palestine",
  "https://github.com/TechForPalestine/",
  "https://www.linkedin.com/company/techforpalestine/",
  "https://infosec.exchange/@tech4palestine",
  "https://www.youtube.com/@tech4palestine",
  "https://www.tiktok.com/@techforpalestine",
  "https://bsky.app/profile/techforpalestine.org",
];

/**
 * The sitewide NonprofitOrganization node. `extra` adds page-specific
 * properties (e.g. a contactPoint) but cannot override the identity fields,
 * which are spread last. Pages must not emit a second node with the same @id:
 * separate JSON-LD blocks are not reliably merged by parsers.
 */
export function organizationSchema(extra: JsonLd = {}): JsonLd {
  return {
    "@context": "https://schema.org",
    ...extra,
    "@type": "NonprofitOrganization",
    "@id": ORGANIZATION_ID,
    name: "Tech for Palestine",
    alternateName: "T4P",
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/t4p-social-logo.png`,
    description:
      "Tech for Palestine is a 501(c)(3) nonprofit that incubates and scales tech and advocacy projects for Palestinian liberation.",
    taxID: "99-3441367",
    nonprofitStatus: "Nonprofit501c3",
    founder: { "@type": "Person", name: "Paul Biggar" },
    address: {
      "@type": "PostalAddress",
      streetAddress: "548 Market St #266950",
      addressLocality: "San Francisco",
      addressRegion: "CA",
      postalCode: "94104-5401",
      addressCountry: "US",
    },
    sameAs: SAME_AS,
  };
}

/** The WebSite node, emitted on the homepage only. */
export function websiteSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: "Tech for Palestine",
    url: `${SITE_ORIGIN}/`,
    publisher: ORGANIZATION_REF,
    inLanguage: "en",
  };
}

export interface FaqEntry {
  question: string;
  /** Plain text; rich text must be flattened before it gets here. */
  answer: string;
}

interface FaqPageSchema extends JsonLd {
  mainEntity: { "@type": "Question"; name: string; acceptedAnswer: JsonLd }[];
}

export function faqPageSchema(entries: FaqEntry[]): FaqPageSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries
      .map((entry) => ({ question: entry.question.trim(), answer: entry.answer.trim() }))
      .filter((entry) => entry.question && entry.answer)
      .map((entry) => ({
        "@type": "Question" as const,
        name: entry.question,
        acceptedAnswer: { "@type": "Answer", text: entry.answer },
      })),
  };
}

interface BreadcrumbSchema extends JsonLd {
  itemListElement: { "@type": "ListItem"; position: number; name: string; item: string }[];
}

function breadcrumbSchema(crumbs: { name: string; url: string }[]): BreadcrumbSchema {
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

function projectUrl(project: Pick<ProjectItem, "id" | "name">): string {
  return `${SITE_ORIGIN}${projectPath(project)}`;
}

/** Plain-text summary of a project, preferring the fullest description. */
export function projectSummary(project: ProjectItem): string {
  return (project.description || project.elevatorPitch || project.impactStatement || "").trim();
}

/** CreativeWork + BreadcrumbList for a `/projects/<slug>-<id>` page. */
export function projectSchema(project: ProjectItem): [JsonLd, BreadcrumbSchema] {
  const url = projectUrl(project);
  const website = toAbsoluteHttpUrl(project.websiteUrl);
  const work: JsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${url}#project`,
    name: project.name,
    url,
    sourceOrganization: ORGANIZATION_REF,
    ...(projectSummary(project) && { description: projectSummary(project) }),
    ...(project.leadName && { creator: { "@type": "Person", name: project.leadName } }),
    ...(website && { sameAs: website }),
    ...(project.createdAt && { dateCreated: project.createdAt }),
    ...(project.updatedAt && { dateModified: project.updatedAt }),
  };
  const breadcrumbs = breadcrumbSchema([
    { name: "Home", url: `${SITE_ORIGIN}/` },
    { name: "Projects", url: `${SITE_ORIGIN}/projects` },
    { name: project.name, url },
  ]);
  return [work, breadcrumbs];
}

/** ItemList of every project page, for the `/projects` directory. */
export function projectListSchema(projects: ProjectItem[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Tech for Palestine Incubator projects",
    itemListElement: projects.map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: projectUrl(project),
      name: project.name,
    })),
  };
}

export interface OnlineEventInput {
  name: string;
  description: string;
  /** ISO start time; the event is skipped if it does not parse. */
  startIso: string;
  durationMinutes: number;
  /** Page describing the event. */
  pageUrl: string;
  /** Where to watch, e.g. the YouTube stream; falls back to `pageUrl`. */
  streamUrl?: string;
}

/** An online Event organized by T4P, or null when the start time is invalid. */
export function onlineEventSchema(event: OnlineEventInput): JsonLd | null {
  const start = new Date(event.startIso);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + event.durationMinutes * 60 * 1000);
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    ...(event.description.trim() && { description: truncateDescription(event.description, 500) }),
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: {
      "@type": "VirtualLocation",
      url: toAbsoluteHttpUrl(event.streamUrl) || event.pageUrl,
    },
    organizer: ORGANIZATION_REF,
    isAccessibleForFree: true,
    url: event.pageUrl,
  };
}

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toSitemapDate(value: string | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export function sitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const lastmod = toSitemapDate(entry.lastmod);
      return `<url><loc>${escapeXml(entry.loc)}</loc>${
        lastmod ? `<lastmod>${lastmod}</lastmod>` : ""
      }</url>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

/** Sitemap entries for every project page. */
export function projectSitemapEntries(projects: ProjectItem[]): SitemapEntry[] {
  return projects.map((project) => ({
    loc: projectUrl(project),
    lastmod: project.updatedAt || project.createdAt,
  }));
}
