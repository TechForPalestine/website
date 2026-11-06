/** Copy for /monthly-challenge: the November 2026 Incubator challenge on
 * mainstream media bias. When December's challenge lands, move this month into
 * `previousChallenges` (./index.ts) the way October was archived. */

import type { WantedProject } from "../../utils/challengeProjects";

/** Where "Apply for this challenge" goes, per the brief. */
export const APPLY_URL = "https://projecthub.techforpalestine.org/apply";

export const challenge = {
  month: "November 2026",
  question:
    "How do we expose and combat hasbara, pro-Israel bias and Zionist ownership and influence of mainstream news media?",
  summary:
    "This month we're forming a cohort of projects that expose how the news is shaped, and build ways to get it out that can't be bought.",
};

/** The brainstorming session on Zoom. Times are CET (UTC+1 in November). */
export const brainstorm = {
  url: "https://us06web.zoom.us/meeting/register/VcASwZtkTsmH3poubwJcOw",
  startsAt: "2026-11-20T20:30:00+01:00",
  /** When the session is assumed over; the promo hides after this. */
  endsAt: "2026-11-20T22:00:00+01:00",
  weekday: "Friday",
  day: "20",
  monthShort: "Nov",
  time: "8:30pm CET",
  description:
    "Tech for Palestine is hosting an open brainstorming session for anyone who is interested in this challenge and wants to pitch an idea. You will be able to learn more about the T4P Incubator, get feedback on your idea, and find team members.",
};

/** The corrected-headline graphic (CorrectedHeadline.astro) on the page hero
 * and homepage popup. A fictional outlet and an illustrative headline built
 * from the patterns the brief names; no real outlet is quoted. These two lines
 * are what screen readers get in place of the drawn corrections. */
export const correctedHeadline = {
  outlet: "The Consent",
  original: "38 killed in Gaza strike as tensions rise, health ministry says",
  corrected: "38 Palestinians killed in Gaza strike by Israel, genocide continues",
};

export const aboutLead =
  "The mainstream media narrative on Palestine and the Gaza genocide is flooded with hasbara propaganda and consistently framed around Israel's talking points. It manufactures consent for, normalizes and downplays the atrocities Israel commits, through a playbook that is easy to spot once named.";

export interface PlaybookMove {
  name: string;
  detail: string;
  /** 1-based numbers of the questions below that take this move on. */
  questions: number[];
}

/** The brief's account of how coverage is bent, one move per line. */
export const playbook: PlaybookMove[] = [
  {
    name: "Passive voice",
    detail: "Atrocities are reported without naming who committed them.",
    questions: [3, 4],
  },
  {
    name: "Unequal coverage",
    detail: "Israeli deaths and casualties get far more coverage than Palestinian ones.",
    questions: [1, 3],
  },
  {
    name: "Selective doubt",
    detail:
      "Fatality figures from Palestinian institutions are questioned, while Israeli claims are cited without question.",
    questions: [5],
  },
  {
    name: "Silenced newsrooms",
    detail:
      "Journalists worldwide are penalized for positions sympathetic to Palestine, and newsroom guidelines restrict reporting, even simply using the word \u201cPalestine\u201d.",
    questions: [6, 9],
  },
  {
    name: "Pro-Israel owners",
    detail:
      "With Paramount's takeover of Warner Bros, some of the dominant US news operations are now owned by the Ellison family, known for its support for Israel and its million-dollar donations to Friends of the IDF.",
    questions: [7, 8],
  },
];

export const aboutNeed =
  "We urgently need independent media which can report on Palestine and Israel objectively, as well as transparency and public awareness of the positionality of different news sources.";

export const ask =
  "This challenge asks you to find ways to combat the different aspects of large-scale, systemic pro-Israel influence over mainstream media: monitoring and exposing bias, raising awareness of hasbara and encouraging critical thinking, and limiting the influence of biased outlets over the public narrative.";

export const especially =
  "We're especially interested in sovereign, independent ways to publish and disseminate news, including non-traditional channels that are harder to influence.";

export const questions: string[] = [
  "How do we ensure that the Palestinian struggle is top of mind for the general audience even if mainstream media tries to bury it?",
  "How do we develop alternative ways of sharing news using analog media, local distribution, peer-to-peer sharing and other channels which are resistant to outside control and influence?",
  "How do we detect and raise awareness about pro-Israel and/or anti-Palestine bias and framings in mainstream media?",
  "How do we encourage critical thinking among readers and viewers and ensure they are aware of the positionality of the news sources they are following?",
  "How do we fact-check claims in mainstream media and trace their origin to state PR messaging when they are the product of hasbara?",
  "How do we expose the unofficial editorial guidelines which media outlets use in their reporting on Palestine and detect regurgitations of Israeli talking points?",
  "How do we build a public ownership atlas of news media, showing who owns which outlet and their documented political donations and advocacy funding?",
  "How do we track the changes in coverage of Palestine and Israel by news outlets like CNN and CBS before and after the takeover by Paramount?",
  "How do we document and support journalists penalized for pro-Palestine reporting and encourage reporters to maintain journalistic integrity?",
];

/** Incubator projects already working on this challenge, in display order.
 * Matched against ProjectHub by name; a project only shows once it is
 * published there. Add an alias if a card goes missing. */
export const supportedProjects: WantedProject[] = [
  { name: "NewsCord" },
  { name: "Accountable Media" },
  { name: "Media Bias Meter", aliases: ["Media-Bias-Meter"] },
  { name: "MediaBiasWatch" },
  { name: "Bias-Proof" },
  { name: "Bulletin" },
];
