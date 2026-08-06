/**
 * Qgiv form identifiers, in one place.
 *
 * Qgiv gives each hosted form a public URL and a numeric embed ID; the embed ID
 * is what `embed.js` uses to mount the iframe. Both are expected to change —
 * the membership team is renaming the form slugs — so nothing else in the
 * codebase should hardcode them.
 */
export type MembershipTier = "member" | "supporting";

export interface QgivForm {
  /** Numeric embed ID from the Qgiv dashboard. */
  embedId: string;
  /** Public hosted form URL, used as the off-site fallback link. */
  url: string;
}

export const QGIV_FORMS: Record<MembershipTier, QgivForm> = {
  member: {
    embedId: "88902",
    url: "https://secure.qgiv.com/for/dafize",
  },
  supporting: {
    // Qgiv resolves the form from the slug, not this ID — verified by fetching
    // /for/supportingmembersform/embed/<id>/ with several IDs and confirming
    // every response serves form 1158315. This is the form ID from the Qgiv
    // dashboard (secure.qgiv.com/control/forms/1158315); swap it if a distinct
    // registered embed ID is created for this form later.
    embedId: "1158315",
    url: "https://secure.qgiv.com/for/supportingmembersform",
  },
};

export const QGIV_EMBED_SCRIPT = "https://secure.qgiv.com/resources/core/js/embed.js";

export function qgivEmbedUrl(form: QgivForm): string {
  return `${form.url}/embed/${form.embedId}/`;
}
