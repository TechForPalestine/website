// Content for /wikipedia-report ("Israel Is Attacking Wikipedia"), the
// landing page for the report. The report itself is online at
// /wikipedia-report-2026 (src/pages/wikipedia-report-2026/) and as a PDF.
// Copy lives here so comms can edit it without touching the page markup.
//
// Open items are marked TODO(comms). Optional sections (quotes, the executive
// summary PDF) render only when their data is filled in, so no placeholder
// ever ships. The page is indexable and listed in the sitemap (see
// src/utils/reportSitemap.mjs).

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
/** Set apart from the title, on its own line where there is room. */
export const REPORT_SUBTITLE = "(to influence AI)";

export const REPORT_SUMMARY =
  "Read our new report: twenty years of documented attacks on Wikipedia, and what this means for the information you get from search and AI.";

/** The online report. Its address is printed in the PDF, so it must not move. */
export const REPORT_READ_HREF = REPORT_BASE_PATH;

// Keep the filename stable across revisions so links in press coverage keep
// working, and update the size and page count each time the file is replaced.
// The current file is the 19 Nov Google Docs export ("Take 6 - T4P Wiki Report (3)"), matching the online report.
export const REPORT_PDF: ReportPdf = {
  href: "/reports/israel-is-attacking-wikipedia.pdf",
  size: "7.5 MB",
  pages: 224,
};

// The executive summary as its own PDF, linked from the Press section: pages
// 1-9 of the full report minus its blank page 7 (cover, executive summary,
// influence map, claims in brief, about the report, about T4P), so it always
// matches the report's wording. Keep the filename stable and update size and
// pages when the file is replaced.
export const SUMMARY_PDF: ReportPdf | undefined = {
  href: "/reports/israel-is-attacking-wikipedia-summary.pdf",
  size: "407 KB",
  pages: 8,
};

/** Embargo date of the report. Shown in the hero and used as datePublished. */
export const REPORT_PUBLISHED: string | undefined = "2026-11-17";

export const PRESS_EMAIL = "media@techforpalestine.org";

/** The corrections address printed in the report itself. */
export const CORRECTIONS_EMAIL = "contact@techforpalestine.org";

export const FINDINGS: readonly ReportFinding[] = [
  {
    id: "finding-us-government",
    stat: "$98M",
    statLabel: "from pro-Israel PACs to 26 U.S. politicians behind it",
    title: "US government attacks on Wikipedia",
    body: "The US government used a report from the ADL to attack Wikipedia. The goal is for the Israel Lobby to gain influence over it.",
    section: "4",
    sectionTitle: "The Influence Operation on Wikipedia",
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
    id: "finding-billionaires",
    title: "The Billionaire tech bros behind it all",
    body: "Our research shows that the ADL's partner in the attack on Wikipedia was likely funded by billionaire tech bros. “Builders for Tomorrow” came out of “Builders for Israel”, a WhatsApp group started in 2023 with Sheryl Sandberg, Bill Ackman, Shaun Maguire, and David Marcus.",
    section: "4.6.2",
    sectionTitle: "Builders for Tomorrow",
  },
  {
    id: "finding-adl-admits",
    title: "The ADL admits it",
    body: "From the ADL’s mouth: “The pressure came from several directions: congressional scrutiny, including a House Committee on Oversight investigation and a bipartisan Congressional letter from 23 members, federal inquiries from the Department of Justice and the Senate Commerce Committee; enforcement work by Wikipedia’s NPOV-policy editors, ADL reporting, and broader media scrutiny.”",
    section: "6.5.2.1",
    sectionTitle: "Sustained, multi-front external pressure",
  },
  {
    id: "finding-adl-evidence",
    stat: "0",
    statLabel: "ADL claims that survived scrutiny",
    title: "The evidence from the Anti-Defamation League (ADL) doesn’t hold up",
    body: "We checked every claim in the ADL’s “Editing for Hate” report, and the “Damage Done”. No claim survived scrutiny. It doesn’t show a single false fact, or any antisemitic content added to Wikipedia.",
    section: "6",
    sectionTitle: "The ADL report",
  },
  {
    id: "finding-jimmy-wales",
    stat: "$900,000",
    statLabel: "Prize from an Israeli foundation, the largest prize he has received",
    title: "Jimmy Wales should step down",
    body: "Wikipedia founder Jimmy Wales calls himself a “strong supporter of Israel”, and has visited Israel over ten times. In 2025 he tried to influence the Gaza Genocide page to be more pro-Israel, in a clear abuse of power. In November 2026, he's trying again, with the Zionism page. We recommend that Wales step down from the Board and disable his user account",
    section: "3.16",
    sectionTitle: "Jimmy Wales (2025-ongoing)",
  },
  {
    id: "finding-drop-the-adl",
    stat: "287",
    statLabel: "civil rights groups who say #DropTheADL",
    title: "The ADL doesn’t care about Civil rights",
    body: "We give you a history of the ADL. It’s Israel in civil rights clothing.",
    section: "5",
    sectionTitle: "The Anti-Defamation League (ADL)",
  },
  // {
  //   id: "finding-t4p-campaign",
  //   stat: "~260",
  //   statLabel: "edits by our volunteer workgroup over 8 months",
  //   title: "The “Tech for Palestine campaign” that wasn’t",
  //   body: "The ADL blamed a coordinated editing campaign on us. Our volunteer workgroup made about 260 edits over 8 months, none of them in the core Palestine–Israel articles. That’s one fewer edit than the ADL’s own 2021 editing campaign.",
  //   section: "6.6",
  //   sectionTitle: "“Systematic” Edits",
  // },
  {
    id: "finding-twenty-years",
    stat: "17",
    statLabel: "efforts since 2001, nine still active",
    title: "Twenty years of manipulating Wikipedia",
    body: "We document 17 pro-Israel efforts to manipulate Wikipedia since 2001. Nine are still active! From CAMERA’s secret editor recruitment to a “Wikipedia war room” and editing courses run by Zionist groups.",
    section: "3",
    sectionTitle: "Direct Manipulation of Wikipedia",
  },
  {
    id: "finding-surveillance",
    stat: "45",
    statLabel: "full-time ADL analysts “tracking” Wikipedia editors",
    title: "Wikipedia editors under surveillance",
    body: "Four groups are targeting Wikipedia editors: the Heritage Foundation, the ADL, NPOV and Builders for Tomorrow. Some editors who were doxxed have received death threats. The ADL’s CEO says he has 45 full-time analysts “tracking” Wikipedia editors, whom he calls “weirdos with email addresses”.",
    section: "4.6",
    sectionTitle: "Surveillance of Wikipedia",
  },
  {
    id: "finding-t4p-campaign",
    stat: "260",
    statLabel: "is fewer edits than one experienced editor does in a day",
    title: "Framing Tech for Palestine",
    body: "The ADL blamed a “systematic” coordinated editing campaign on us, then tried to launder their claims. But the ADL’s own data shows only 260 edits over 8 months, none of them in the core Palestine–Israel articles. That’s one fewer edit than the ADL’s own 2021 editing campaign.",
    section: "6.6",
    sectionTitle: "“Systematic” Edits",
  },
  {
    id: "finding-arabic",
    stat: "The Hadith",
    statLabel: "Look it up",
    title: "The ADL can't read Arabic",
    body: "The ADL made a series of claims about Arabic Wikipedia, based on bad English translations, with no cultural context or understanding. Not surprisingly, they got it all wrong",
    section: "6.4",
    sectionTitle: "Detailed Critique of Case Study 2",
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
  {
    role: "Reviewed by",
    names: "Institute for the Understanding of Anti-Palestinian Racism, 7amleh",
  },
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
