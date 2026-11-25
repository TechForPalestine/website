/** Meta tag Layout renders so the analytics init script can read a page's custom properties. */
export const ANALYTICS_PROPS_META = "t4p:analytics-props";

/**
 * Reads the page's Plausible custom properties from the analytics meta tag.
 * Returns {} when the tag is missing or malformed; non-string values are dropped.
 */
export function readAnalyticsProps(doc: Pick<Document, "querySelector">): Record<string, string> {
  const content = doc
    .querySelector(`meta[name="${ANALYTICS_PROPS_META}"]`)
    ?.getAttribute("content");
  if (!content) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return {};
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
  return Object.fromEntries(
    Object.entries(parsed).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string"
    )
  );
}
