/** Copy for /monthly-challenge: the monthly Incubator challenge. Swap this file's
 * contents when the next month's challenge is announced. */

import type { WantedProject } from "../utils/challengeProjects";

export const challenge = {
  month: "October 2026",
  question:
    "How do we make it easier for users to migrate to ethical alternatives to complicit tech?",
  summary:
    "Boycott lists name thousands of complicit products. This month we're forming a cohort of projects that make leaving them easy.",
};

/** Hero panel: switches incubated projects already offer or help people make. */
export const migrations: { from: string; to: string }[] = [
  { from: "Instagram", to: "UpScrolled" },
  { from: "ChatGPT", to: "Thaura" },
  { from: "Elementor", to: "Gutenberg" },
  { from: "Wix", to: "WordPress" },
  { from: "Vercel", to: "Netlify" },
];

export const about: string[] = [
  "Boycott lists contain thousands of products to be boycotted, but ethical alternatives may not exist for each complicit company, or the effort to migrate to an alternative might be daunting to regular users.",
  "We want to build teams focused on supporting boycotts on individual products, providing guides, lists of alternatives, content, technical tools, technical support and migration assistance, consulting, and marketing, to help people move off boycotted products.",
  "The projects could consist of building an ethical and privacy-preserving alternative to such a technology, or, when suitable alternatives exist, helping tens of thousands of users migrate successfully using automation, integrations, content, advisory services, and advocacy campaigns.",
];

/** Example targets named in the brief. */
export const exampleTargets: string[] = [
  "Stripe",
  "Shopify",
  "Deel",
  "PayPal / Venmo",
  "WhatsApp",
  "Spotify",
  "Wix",
  "Figma",
  "Vercel",
  "Microsoft",
  "Instagram",
  "Google",
];

export const otherTargets =
  "There are many other complicit companies and industries which could be targeted, such as the Israeli cybersecurity or gaming industry.";

export interface ApproachStep {
  title: string;
  description: string;
}

export const approach: ApproachStep[] = [
  {
    title: "Pick a target",
    description:
      "Choose a company from boycott lists which has a large enough user base and is clearly complicit.",
  },
  {
    title: "Research where the leverage is",
    description:
      "Do in-depth user and market research on the target to understand how we can get leverage on it: a technology which can be easily replicated, a user base which is supportive of Palestine, or existing concerns around user privacy and ethical policies.",
  },
  {
    title: "Find the ethical alternatives",
    description:
      "Find out if there are existing ethical alternatives to promote, or help users migrate to them using guides, campaigns, automation, data migration tools, or advisory services.",
  },
  {
    title: "Consider building one",
    description:
      "Consider building a viable alternative for this technology, built on ethical and privacy-preserving principles.",
  },
];

/** Incubator projects already working on this challenge, in display order.
 * Matched against ProjectHub by name; add an alias if a card goes missing. */
export const supportedProjects: WantedProject[] = [
  { name: "UpScrolled" },
  { name: "Thaura.ai", aliases: ["Thaura"] },
  { name: "Boon Digital Solutions", aliases: ["Boon"] },
  { name: "Elementor migration", aliases: ["Migration Tool From Elementor To Gutenberg"] },
  { name: "Israeli Tech Alternatives" },
  { name: "Spotify Export" },
  { name: "Tribe-X" },
  { name: "Boycott Shopify" },
  { name: "Migrate Off Vercel", aliases: ["Migrate from Vercel"] },
];

export const hackathon = {
  url: "https://hackathon2026.techforpalestine.org/",
  title: "Join our upcoming hackathon",
  description:
    "As part of Mozilla Festival, Tech for Palestine will hold a hackathon in Barcelona, Spain on October 31st on this same challenge. Join us in-person at Canodrom in Barcelona for a full day of hands-on work and collaboration, powered by Thaura.ai!",
};

export const whatAreChallenges: string[] = [
  "To date, the Tech for Palestine Incubator has supported more than 90 projects working on different aspects of Palestinian liberation. These projects span themes like media bias, protest tech, divestment, exposing complicit companies, and much more.",
  "Applications for the Incubator are open on a rolling basis for any relevant idea which furthers the Palestinian cause. On top of that, each month we pose one open challenge to the community, to direct efforts towards priorities we consider urgent.",
  "The projects which apply for the challenge and are approved to join the Incubator form a small cohort, with tailored capacity building and opportunities for close collaboration with the other projects in the cohort.",
];
