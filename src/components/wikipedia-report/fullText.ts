import { REPORT_BASE_PATH } from "../../utils/wikipediaReportLinks";

/** Heading the executive-summary body is split at, so the claims map can sit before it. */
export const MAP_ANCHOR = '<h2 id="claims-in-brief">';

/** Split html before MAP_ANCHOR; null if it is missing or leads the body. */
export function splitAtMapAnchor(html: string): [string, string] | null {
  const at = html.indexOf(MAP_ANCHOR);
  return at > 0 ? [html.slice(0, at), html.slice(at)] : null;
}

const prefix = REPORT_BASE_PATH.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const REPORT_LINK_RE = new RegExp(`href="${prefix}(?:/([a-z0-9-]+))?(?:#([\\w-]+))?"`, "g");

/** Rewrite cross-links to /wikipedia-report-2026/... into in-page anchors for the
 * one-page full text. Links to slugs not in `slugs` are left unchanged. */
export function rewriteLinksForFullPage(html: string, slugs: ReadonlySet<string>): string {
  return html.replace(
    REPORT_LINK_RE,
    (match, slug: string | undefined, anchor: string | undefined) => {
      if (slug === undefined) return anchor ? match : 'href="#executive-summary"';
      if (!slugs.has(slug)) return match;
      return `href="#${anchor ?? slug}"`;
    }
  );
}

/** Prefix the given ids with `${slug}-`, along with their `id`, `aria-labelledby`
 * and `href="#..."` references, so ids repeated across entries stay unique on
 * the one-page full text. */
export function scopeDuplicateIds(html: string, slug: string, ids: readonly string[]): string {
  return ids.reduce((out, id) => {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(\\bid=|\\baria-labelledby=|\\bhref=)"(#?)${escaped}"`, "g");
    return out.replace(re, (_m, attr: string, hash: string) => `${attr}"${hash}${slug}-${id}"`);
  }, html);
}
