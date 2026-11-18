/** Copy for the overview page of the project leader guide (/incubator/guide).
 * The playbook chapters live in src/content/incubator-guide/*.md. Facts shared
 * with /incubator (Office Hours, apply URL) come from ./incubator. */

import { OFFICE_HOURS, type IncubatorItem } from "./incubator";

export const GUIDE_TITLE = "Project leader guide";

export const GUIDE_DESCRIPTION =
  "What it takes to lead a project in the Tech for Palestine incubator: what we ask of you, the support we give, and our playbook for building projects that reach people.";

/** Where questions go before someone applies. */
export const INCUBATOR_EMAIL = "incubator-team@techforpalestine.org";

/** What projects that do well in the incubator have in common. */
export const successTraits: string[] = [
  "They focus on users early and often.",
  "They tackle what they don't know how to do, by learning it or by finding volunteers who can.",
  "They come to Office Hours often at the start, sometimes several times a week.",
  "They build teams, though not too early, and grow leaders within those teams.",
  "They listen to advice. They don't always take it, but they don't come to Office Hours to argue with mentors.",
];

/** A project's path through the incubator, from application to growth. */
export const journey: IncubatorItem[] = [
  {
    title: "Apply and interview",
    description:
      "A 10 to 30 minute application, then a 30-minute interview about the impact you want to have and how you'll get there. We aim to decide within 10 days.",
  },
  {
    title: "Strategy session",
    description:
      "A one-hour session with Paul Biggar, T4P's founder, to set your initial direction and priorities.",
  },
  {
    title: "Six weeks of onboarding",
    description:
      "A period to build momentum, get early feedback and find your place in the T4P community. Attend Office Hours at least once a week.",
  },
  {
    title: "Validate with real users",
    description:
      "Work out who your users are, learn from them, and test the smallest version of your idea with them. Expect several rounds.",
  },
  {
    title: "Launch",
    description:
      "When your project works and keeps its users, we help you plan a launch across our socials, mailing list, partners and friends.",
  },
  {
    title: "Grow",
    description:
      "Build your team and scale your impact. Keep coming to Office Hours at least monthly until you reach product-market fit.",
  },
];

/** What we ask of project leaders, in more depth than /incubator's summary. */
export const commitments: IncubatorItem[] = [
  {
    title: "Office Hours",
    description: `Office Hours are ${OFFICE_HOURS.format}. Attend ${OFFICE_HOURS.cadence}. After that, we recommend coming monthly. Please don't skip them: they are where most of our support happens.`,
  },
  {
    title: "Updates",
    description:
      "We ask for a short update on your progress each month. Tell us how you're doing against your goals, not just what you did.",
  },
  {
    title: "Staying reachable",
    description:
      "We mostly reach you through the T4P community chat and email. Turn on notifications and check your spam folder, or you'll miss introductions, volunteers and opportunities.",
  },
  {
    title: "Your time",
    description:
      "There's no fixed number of hours, but a project only moves when its leader drives it. Most of your early time goes on talking to users, not building.",
  },
];

export const goodStanding =
  "Some support, such as grants and fiscal sponsorship, depends on your project being in good standing. That means you have taken part in the incubator (the strategy session, onboarding and Office Hours), kept us up to date on your progress, and attend Office Hours at least once a month.";

/** The support T4P gives incubated projects. */
export const support: IncubatorItem[] = [
  {
    title: "Mentorship",
    description: `${OFFICE_HOURS.format}. Bring feedback on your vision, goals and roadmap, whether you're working on the right thing, how to find users, how to build and how to launch.`,
  },
  {
    title: "Volunteers",
    description:
      "Over 3,000 volunteers in our database. Our volunteering team helps you define roles, finds candidates and checks the basics, then you interview and choose. For one-off tasks such as user testing, you can post a short Mighty Mission to the community.",
  },
  {
    title: "Early users and launch",
    description:
      "Early on, we can post on T4P's socials and community to find your first users and testers. When you're ready, our marketing team helps you plan a bigger launch with partners, our mailing list, our socials and friends of T4P.",
  },
  {
    title: "Marketing help",
    description:
      "Advice on your growth strategy, resharing your posts, amplifying your news, and help with graphic design, copywriting and website copy.",
  },
  {
    title: "Small grants",
    description:
      "Small grants to cover your project's costs, with minimal fuss: a short form and an agreement. Grants are for non-profit purposes and need your project to be in good standing.",
  },
  {
    title: "Fiscal sponsorship",
    description:
      "If your donors want a tax deduction, Tech for Palestine, a US 501(c)(3), can act as your fiscal sponsor. Check with us first.",
  },
  {
    title: "Legal questions",
    description:
      "Our Legal Intake team of volunteer lawyers can point you in the right direction on privacy policies, terms of service, contracts, company structure and other legal questions. They share knowledge pro bono and don't act as your lawyers.",
  },
  {
    title: "Community",
    description:
      "A private space with other project leaders facing the same challenges, a private channel with T4P staff, and a public channel where the T4P community can find your project.",
  },
  {
    title: "Technical help",
    description:
      "A GitHub repository in the Tech for Palestine organization if you want one, advice on building with AI tools, and, when you need specialist skills such as hosting, possibly a volunteer or staff engineer.",
  },
];
