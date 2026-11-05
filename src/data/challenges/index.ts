/** Shared copy for the monthly Incubator challenge pages, plus the archive of
 * past months listed at the foot of /monthly-challenge. */

import { challenge as october2026 } from "./october-2026";

export const CHALLENGE_PATH = "/monthly-challenge";

export interface PreviousChallenge {
  month: string;
  question: string;
  href: string;
}

/** Newest first. Each archived month keeps its own page under /monthly-challenge/. */
export const previousChallenges: PreviousChallenge[] = [
  {
    month: october2026.month,
    question: october2026.question,
    href: `${CHALLENGE_PATH}/october-2026`,
  },
];

export const whatAreChallenges: string[] = [
  "To date, the Tech for Palestine Incubator has supported more than 100 projects working on different aspects of Palestinian liberation. These projects span themes like media bias, protest tech, divestment, exposing complicit companies, and much more.",
  "Applications for the Incubator are open on a rolling basis for any relevant idea which furthers the Palestinian cause. On top of that, each month we pose one open challenge to the community, to direct efforts towards priorities we consider urgent.",
  "The projects which apply for the challenge and are approved to join the Incubator form a small cohort, with tailored capacity building and opportunities for close collaboration with the other projects in the cohort.",
];
