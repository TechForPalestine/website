// Content for /wikipedia-report ("Israel Is Attacking Wikipedia"), the
// landing page for the report. The report itself is online at
// /wikipedia-report-2026 (src/pages/wikipedia-report-2026/) and as a PDF.
// Copy lives here so comms can edit it without touching the page markup.
//
// Open items are marked TODO(comms). Optional sections (quotes, the executive
// summary PDF) render only when their data is filled in, so no placeholder
// ever ships. The page is noindex and excluded from the sitemap until launch;
// remove both (wikipedia-report.astro and astro.config.mjs) at launch.

import { REPORT_BASE_PATH, appendixHref, sectionHref } from "../utils/wikipediaReportLinks";

export interface ReportFinding {
  /** Anchor id, so a finding can be linked directly: /wikipedia-report#finding-ai */
  id: string;
  /** The figure a skimmer reads first. Omit when a finding has no figure. */
  stat?: string;
  statLabel?: string;
  title: string;
  body: string;
  /** Report section ("6.3"); "Read more" links to it in the online report. */
  section: string;
  /** That section's heading in the report, without its number. A test checks
   * it still matches, so renumbering in a new report version can't silently
   * point a finding at the wrong section. */
  sectionTitle: string;
}

export interface ReportPdf {
  href: string;
  /** e.g. "4.6 MB". Shown beside the download links when set. */
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

/** A pointer into the online report, e.g. "(Section 6.4)". */
export interface ReportRef {
  label: string;
  href: string;
}

export interface MethodologyTrack {
  lead: string;
  text: string;
  ref: ReportRef;
}

export interface MethodologyNote {
  text: string;
  ref?: ReportRef;
}

export interface ReportCredit {
  role: string;
  names: string;
}

export interface RelatedProject {
  name: string;
  description: string;
  href: string;
  /** Square logo under /public, copied from the project's ProjectHub entry. */
  logo: string;
}

export const REPORT_TITLE = "Israel Is Attacking Wikipedia";

export const REPORT_SUMMARY =
  "Read our new report: twenty years of documented attacks on Wikipedia, and what this means for the information you get from search and AI.";

/** The online report. Its address is printed in the PDF, so it must not move. */
export const REPORT_READ_HREF = REPORT_BASE_PATH;

// Keep the filename stable across revisions so links in press coverage keep
// working, and update the size and page count each time the file is replaced.
// The current file is the 17 Nov Google Docs export (version 2 of "Take 6").
export const REPORT_PDF: ReportPdf = {
  href: "/reports/israel-is-attacking-wikipedia.pdf",
  size: "6.5 MB",
  pages: 221,
};

// The executive summary as its own PDF, linked from the Press section: pages
// 1-7 of the full report (cover, executive summary, claims in brief, about
// the report, about T4P), so it always matches the report's wording. Keep the
// filename stable and update size and pages when the file is replaced.
export const SUMMARY_PDF: ReportPdf | undefined = {
  href: "/reports/israel-is-attacking-wikipedia-summary.pdf",
  size: "69 KB",
  pages: 7,
};

/** Embargo date of the report. Shown in the hero and used as datePublished. */
export const REPORT_PUBLISHED: string | undefined = "2026-11-17";

export const PRESS_EMAIL = "media@techforpalestine.org";

/** The corrections address printed in the report itself. */
export const CORRECTIONS_EMAIL = "contact@techforpalestine.org";

export const FINDINGS: readonly ReportFinding[] = [
  {
    id: "finding-twenty-years",
    stat: "17",
    statLabel: "efforts since 2001, nine still active",
    title: "Twenty years of attempts to skew Wikipedia",
    body: "We document 17 pro-Israel efforts to manipulate Wikipedia since 2001. Nine are still active, from CAMERA’s secret editor recruitment to a “Wikipedia war room” and editing courses run by Zionist groups.",
    section: "3",
    sectionTitle: "Direct Manipulation of Wikipedia",
  },
  {
    id: "finding-adl-evidence",
    stat: "0",
    statLabel: "ADL claims that survived scrutiny",
    title: "The evidence from the Anti-Defamation League (ADL) doesn’t hold up",
    body: "We checked every claim in the ADL’s “Editing for Hate” report. No claim survived scrutiny. It doesn’t show a single false fact, or any antisemitic content added to Wikipedia.",
    section: "6",
    sectionTitle: "The ADL report",
  },
  {
    id: "finding-circular-logic",
    stat: "22–2",
    statLabel:
      "votes to keep vs. delete “Racial profiling in Israel”, an article the ADL used as evidence of collusion",
    title: "A conspiracy built from circular logic",
    body: "The ADL picked 30 editors and called them “bad-faith”. It then listed articles these editors voted to keep, as if that proved they were working together. But the ADL left out the vote counts. We added them up. On “Racial profiling in Israel”, 22 editors voted to keep and 2 voted to delete. On “Allegations of Israeli apartheid”, it was 37 to 14. Nearly everyone who voted agreed.",
    section: "6.3",
    sectionTitle: "Detailed Critique of Case Study 1",
  },
  {
    id: "finding-96-million",
    stat: "$96M",
    statLabel: "from pro-Israel PACs to the 23 signatories",
    title: "$96 million behind the political attacks",
    body: "The ADL report was used in four US government actions against Wikipedia, including a letter from 23 members of Congress. Those 23 signatories have received more than $96M from pro-Israel PACs.",
    section: "4",
    sectionTitle: "The Influence Operation on Wikipedia",
  },
  {
    id: "finding-adl-admits",
    title: "The ADL admits it",
    body: "In its October 2026 follow-up report, the ADL describes the “sustained, multi-front external pressure on the platform” from Congress, federal inquiries and its own reporting.",
    section: "6.5",
    sectionTitle: "Detailed Critique of “Damage Done” Follow-Up Report",
  },
  {
    id: "finding-surveillance",
    stat: "45",
    statLabel: "full-time ADL analysts “tracking” editors",
    title: "Volunteer editors under surveillance",
    body: "Four groups are targeting Wikipedia editors: the Heritage Foundation, the ADL, NPOV and Builders for Tomorrow. Some editors who were doxxed have received death threats. The ADL’s CEO says he has 45 full-time analysts “tracking” editors, whom he calls “weirdos with email addresses.”",
    section: "4.6",
    sectionTitle: "Surveillance of Wikipedia",
  },
  {
    id: "finding-ai",
    stat: "$729M",
    statLabel: "Israel’s 2026 propaganda budget, up from $150M",
    title: "The real target is AI",
    body: "Wikipedia feeds Google Search and every major AI chatbot. Israel’s 2026 propaganda budget is $729M, up from $150M in 2025. That includes a $46.5M contract to make AI chatbots more pro-Israel.",
    section: "2.2",
    sectionTitle: "Influencing AI via Wikipedia",
  },
  {
    id: "finding-t4p-campaign",
    stat: "~260",
    statLabel: "edits by our volunteer workgroup over 8 months",
    title: "The “Tech for Palestine campaign” that wasn’t",
    body: "The ADL blamed a coordinated editing campaign on us. Our volunteer workgroup made about 260 edits over 8 months, none of them in the core Palestine–Israel articles. That’s one fewer edit than the ADL’s own 2021 editing campaign.",
    section: "6.6",
    sectionTitle: "“Systematic” Edits",
  },
];

// TODO(comms): 3–4 short quotes (one or two sentences) from people known in
// the movement, each with written approval of the exact wording on file. The
// section stays hidden until at least one is added.
export const QUOTES: readonly ReportQuote[] = [];

export const METHODOLOGY_INTRO: readonly string[] = [
  "This report started in March 2025, when the ADL published “Editing for Hate”. The report claims Wikipedia editors colluded to add antisemitism. US politicians started using it to attack Wikipedia. We wanted to know if the report itself was part of an influence operation.",
];

export const METHODOLOGY_TRACKS: readonly MethodologyTrack[] = [
  {
    lead: "Israel’s efforts to influence Wikipedia.",
    text: "We collected 17 publicly known campaigns from public reports, at least 9 of them still active. This is the first time they are documented in one place.",
    ref: { label: "Sections 3 and 4", href: sectionHref("3") },
  },
  {
    lead: "The ADL report.",
    text: "We went through every claim and traced each one back to the Wikipedia edits and sources it cites. None held up.",
    ref: { label: "Section 6", href: sectionHref("6") },
  },
  {
    lead: "The propaganda tools behind the attack.",
    text: "",
    ref: { label: "Sections 2 and 5", href: sectionHref("2") },
  },
];

export const METHODOLOGY_NOTES: readonly MethodologyNote[] = [
  {
    text: "The ADL analysed Arabic Wikipedia through English translations. We went back to the original Arabic.",
    ref: { label: "Section 6.4", href: sectionHref("6.4") },
  },
  {
    text: "Links to Wikipedia are permalinks to the exact edit. Content from pro-Israel organisations and paywalled sources is linked through archive.org, so it can’t be removed or changed.",
    ref: { label: "Appendix B", href: appendixHref("B") },
  },
  {
    text: "Where we used AI for research, we name the tool and the prompts and publish the full conversation. AI-reconstructed links used in the report were checked by hand.",
    ref: { label: "Appendices C, D and E", href: appendixHref("C") },
  },
  { text: "Every claim in this report is footnoted, more than 500 in total." },
];

export const CREDITS: readonly ReportCredit[] = [
  { role: "Primary author", names: "Paul Biggar" },
  { role: "Research and content", names: "Paul Biggar, Alexandra Fine, Mari Hall" },
  { role: "Editor", names: "Alexandra Fine" },
  { role: "Reviewed by", names: "Institute for the Understanding of Anti-Palestinian Racism" },
  { role: "Early research assistance", names: "T4P volunteers" },
];

// TODO(comms): approve the one-line descriptions (condensed from each
// project's ProjectHub entry).
export const RELATED_PROJECTS: readonly RelatedProject[] = [
  {
    name: "NewsCord",
    description:
      "Pulls facts and angles from dozens of global sources, so you see the whole story and where each part of it comes from.",
    href: "https://newscord.org/",
    logo: "/projectIcons/NewsCord.webp",
  },
  {
    name: "Media Bias Watch",
    description: "Uses advertiser boycotts to put pressure on biased media.",
    href: "https://mediabiaswatch.org",
    logo: "/projectIcons/MediaBiasWatch.webp",
  },
  {
    name: "SourcedPress",
    description:
      "Fact-checking in the open: every source document is published with annotations, and every fact-checking conversation is public.",
    href: "https://sourced.press",
    logo: "/projectIcons/SourcedPress.webp",
  },
];

export const MEMBERSHIP_PITCH: readonly string[] = [
  "Tech for Palestine is a member-driven organization that brings together people, skills and resources. Through technology and collaboration, our members build tools and solutions that support the movement for Palestine.",
  "These projects include: protest apps, tools for boycotting, support for Palestinian students & businesses, ethical tech alternatives, and many more.",
];

/** "Read more" target for a finding: its section in the online report. */
export function findingHref(finding: ReportFinding): string {
  return sectionHref(finding.section);
}

export function findingLinkLabel(finding: ReportFinding): string {
  return `Section ${finding.section}`;
}

/** "PDF, 4.6 MB, 250 pages", dropping whichever parts are not known. */
export function pdfMeta(pdf: ReportPdf = REPORT_PDF): string {
  return ["PDF", pdf.size, pdf.pages ? `${pdf.pages} pages` : undefined].filter(Boolean).join(", ");
}
