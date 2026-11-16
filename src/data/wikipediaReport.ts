// Content for /wikipedia-report ("Israel Is Attacking Wikipedia"). Copy lives
// here so comms can edit it without touching the page markup.
//
// Launch blockers are marked TODO(comms). Every optional section on the page
// (quotes, methodology, authors, related projects) renders only when its data
// is filled in, so nothing half-finished or placeholder ever ships. The page
// is noindex and excluded from the sitemap until the blockers are resolved;
// remove both (wikipedia-report.astro and astro.config.mjs) at launch.

export interface ReportFinding {
  /** Anchor id, so a finding can be linked directly: /wikipedia-report#finding-ai */
  id: string;
  /** The figure a skimmer reads first. Omit when a finding has no figure. */
  stat?: string;
  statLabel?: string;
  title: string;
  body: string;
  /** Report section, shown in the link text. */
  section: string;
  /** PDF page where the section starts. When set, the link jumps there
   * (#page=N, honoured by desktop browsers) and the page number is shown so
   * readers on mobile, which ignores the anchor, can still find it. */
  page?: number;
}

export interface ReportPdf {
  href: string;
  /** e.g. "4.2 MB". Shown beside the download links when set. */
  size?: string;
  pages?: number;
}

export interface ReportQuote {
  quote: string;
  name: string;
  role: string;
  /** Path under /public. Leave unset rather than substituting a logo. */
  image?: string;
}

export interface ReportPerson {
  name: string;
  role: string;
}

export interface RelatedProject {
  name: string;
  description: string;
  href: string;
}

export const REPORT_TITLE = "Israel Is Attacking Wikipedia";

export const REPORT_SUMMARY =
  "Read our new report: twenty years of documented attacks on Wikipedia, and what this means for the information you get from search and AI.";

// TODO(comms): add the final PDF at this path in /public. Keep the filename
// stable across revisions so links in press coverage keep working, and update
// the size and page count below each time the file is replaced.
export const REPORT_PDF: ReportPdf = {
  href: "/reports/israel-is-attacking-wikipedia.pdf",
};

// TODO(comms): ISO date (YYYY-MM-DD) the report is published. Shown in the
// hero and emitted as datePublished in the JSON-LD.
export const REPORT_PUBLISHED: string | undefined = undefined;

export const PRESS_EMAIL = "media@techforpalestine.org";

// TODO(comms): confirm the corrections address and policy wording below.
export const CORRECTIONS_EMAIL = PRESS_EMAIL;

// TODO(comms): fill in `page` for each finding from the final PDF, and recheck
// them whenever the PDF is replaced.
export const FINDINGS: readonly ReportFinding[] = [
  {
    id: "finding-twenty-years",
    stat: "18",
    statLabel: "efforts since 2001, nine still active",
    title: "Twenty years of attempts to tilt Wikipedia",
    body: "We document 18 pro-Israel efforts to manipulate Wikipedia since 2001. Nine are still active, from CAMERA’s secret editor recruitment to a “Wikipedia war room” and editing courses run by Zionist groups.",
    section: "3",
  },
  {
    id: "finding-adl-evidence",
    stat: "0",
    statLabel: "ADL claims that survived scrutiny",
    title: "The ADL’s evidence doesn’t hold up",
    body: "We checked every claim in the ADL’s “Editing for Hate” report. No claim survived scrutiny. It doesn’t show a single false fact, or any antisemitic content added to Wikipedia.",
    section: "6",
  },
  {
    id: "finding-circular-logic",
    stat: "22–2",
    statLabel: "vote to keep an article the ADL called a “bad-faith keep”",
    title: "A conspiracy built from circular logic",
    body: "The ADL picked 30 editors, then treated the traits it had picked them for as proof they were colluding. It left out the edit explanations that told a different story. Our recount of the votes shows that articles the ADL called “bad-faith keeps” were kept by wide margins, such as 22–2 and 37–14.",
    section: "6.3",
  },
  {
    id: "finding-96-million",
    stat: "$96M",
    statLabel: "from pro-Israel PACs to the 23 signatories",
    title: "$96 million behind the political attacks",
    body: "The ADL report was used in four US government actions against Wikipedia, including a letter from 23 members of Congress. Those 23 signatories have received more than $96M from pro-Israel PACs.",
    section: "4",
  },
  {
    id: "finding-adl-admits",
    title: "The ADL admits it",
    body: "In its October 2026 follow-up report, the ADL describes the “sustained, multi-front external pressure on the platform” from Congress, federal inquiries and its own reporting.",
    section: "6.5",
  },
  {
    id: "finding-surveillance",
    stat: "45",
    statLabel: "full-time ADL analysts “tracking” editors",
    title: "Volunteer editors under surveillance",
    body: "Four groups are targeting Wikipedia editors: the Heritage Foundation, the ADL, NPOV and Builders for Tomorrow. Some editors who were doxxed have received death threats. The ADL’s CEO says he has 45 full-time analysts “tracking” editors, whom he calls “weirdos with email addresses.”",
    section: "4.5",
  },
  {
    id: "finding-ai",
    stat: "$729M",
    statLabel: "Israel’s 2026 propaganda budget, up from $150M",
    title: "The real target is AI",
    body: "Wikipedia feeds Google Search and every major AI chatbot. Israel’s 2026 propaganda budget is $729M, up from $150M in 2025. That includes a $46.5M contract to make AI chatbots more pro-Israel.",
    section: "2.2",
  },
  {
    id: "finding-t4p-campaign",
    stat: "~260",
    statLabel: "edits by our volunteer workgroup over 8 months",
    title: "The “Tech for Palestine campaign” that wasn’t",
    body: "The ADL blamed a coordinated editing campaign on us. Our volunteer workgroup made about 260 edits over 8 months, none of them in the core Palestine–Israel articles. That’s one fewer edit than the ADL’s own 2021 editing campaign.",
    section: "6.6",
  },
];

// TODO(comms): 3–4 short quotes (one or two sentences) from people known in
// the movement, each with written approval of the exact wording on file. The
// section stays hidden until at least one is added.
export const QUOTES: readonly ReportQuote[] = [];

// TODO(comms): a few sentences covering main sources, time period and how the
// research was done. The methodology block stays hidden until this is set.
export const METHODOLOGY: readonly string[] = [];

// TODO(comms): authors and editors. Hidden until filled in.
export const AUTHORS: readonly ReportPerson[] = [];

// TODO(comms): related T4P projects (name, one line, link). Hidden until
// filled in.
export const RELATED_PROJECTS: readonly RelatedProject[] = [];

/** Link into the PDF for a finding's "Read more". */
export function findingHref(finding: ReportFinding): string {
  return finding.page ? `${REPORT_PDF.href}#page=${finding.page}` : REPORT_PDF.href;
}

/** "Section 6.3 (p. 41)", or "Section 6.3" until page numbers are known. */
export function findingLinkLabel(finding: ReportFinding): string {
  return finding.page
    ? `Section ${finding.section} (p. ${finding.page})`
    : `Section ${finding.section}`;
}

/** "PDF, 4.2 MB, 64 pages", dropping whichever parts are not known yet. */
export function pdfMeta(pdf: ReportPdf = REPORT_PDF): string {
  return ["PDF", pdf.size, pdf.pages ? `${pdf.pages} pages` : undefined].filter(Boolean).join(", ");
}
