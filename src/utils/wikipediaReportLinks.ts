// URL and anchor scheme for the online Wikipedia report (/wikipedia-report-2026),
// shared by the docx converter (cross-reference links), the reader pages
// (heading ids, routes) and the /wikipedia-report landing page (finding links).
//
// Pages:   /wikipedia-report-2026                 index (exec summary + contents)
//          /wikipedia-report-2026/section-6       one page per top-level section
//          /wikipedia-report-2026/appendix-e      one page per appendix
// Anchors: "6.3.2" → id "s6-3-2" on the section-6 page. Ids are prefixed
//          because a bare "6-3-2" cannot be used in a CSS selector.

export const REPORT_BASE_PATH = "/wikipedia-report-2026";

const SECTION_RE = /^(\d+)(?:\.(\d+(?:\.\d+)*))?$/;
const APPENDIX_RE = /^[A-Z]$/;

/** "6.3.2" → "s6-3-2". */
export function sectionAnchorId(number: string): string {
  if (!SECTION_RE.test(number)) throw new Error(`Not a section number: ${number}`);
  return `s${number.replace(/\./g, "-")}`;
}

/** Slug of the page a section lives on: "6.3.2" → "section-6". */
export function sectionPageSlug(number: string): string {
  const match = SECTION_RE.exec(number);
  if (!match) throw new Error(`Not a section number: ${number}`);
  return `section-${match[1]}`;
}

/** "6" → /wikipedia-report-2026/section-6, "6.3" → …/section-6#s6-3. */
export function sectionHref(number: string): string {
  const page = `${REPORT_BASE_PATH}/${sectionPageSlug(number)}`;
  return number.includes(".") ? `${page}#${sectionAnchorId(number)}` : page;
}

/** "E" → /wikipedia-report-2026/appendix-e. */
export function appendixHref(letter: string): string {
  if (!APPENDIX_RE.test(letter)) throw new Error(`Not an appendix letter: ${letter}`);
  return `${REPORT_BASE_PATH}/appendix-${letter.toLowerCase()}`;
}
