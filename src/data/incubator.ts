/** Copy for /incubator. Facts here mirror the pre-redesign page; change
 * numbers only with sign-off from the incubator team. */

export const APPLY_URL = "/project-application-form";

export interface IncubatorItem {
  title: string;
  description: string;
}

/** Areas incubated projects often, but not always, work in. */
export const focusAreas: string[] = [
  "Scaling up boycotts",
  "Protest tech",
  "Tech industry and VC divestment",
  "Media bias",
  "Reaching new audiences with the Palestinian message",
  "Silicon Valley and Palestine partnerships",
  "Bias in AI",
  "Exposing Hasbara",
];

export const supportIntro = {
  newBuilders:
    "Many projects for Palestine start with an advocate who has a good idea but doesn't yet know how to execute it. We support you along the way with what we know about building scalable projects, working with volunteers and the pro-Palestine ecosystem, and with our platform and network.",
  experiencedTeams:
    "More experienced teams get our connections and platform, strategic advice on the right niche to start in, and our knowledge of what already exists in the ecosystem and how to partner with it.",
};

export const offerings: IncubatorItem[] = [
  {
    title: "Strategic advice",
    description:
      "Every project starts with a strategy session, honing your approach with expertise from 200+ projects.",
  },
  {
    title: "Mentorship",
    description:
      "Office Hours with Paul Biggar six times a week, plus optional weekly sessions with a dedicated mentor.",
  },
  {
    title: "Marketing",
    description:
      "Early users through press, influencers, ecosystem partners and our supportive community.",
  },
  {
    title: "Volunteers",
    description: "Access to 3000+ volunteers, with support from a dedicated recruitment team.",
  },
  {
    title: "Connections",
    description:
      "Introductions across the Palestine advocacy ecosystem, to the right partners for your initiative.",
  },
  {
    title: "Funding",
    description: "Small grants for most projects, with minimal fuss.",
  },
  {
    title: "Community",
    description: "60+ project leaders facing similar challenges and supporting each other.",
  },
  {
    title: "Education",
    description:
      "Seminars on marketing, sales, go-to-market, technical projects and T4P branding.",
  },
];

export const expectations: IncubatorItem[] = [
  {
    title: "Focus on impact",
    description: "Aim for impact at scale, for example reaching 10 million users.",
  },
  {
    title: "Commitment",
    description: "Project leaders keep working on their project and drive it forward.",
  },
  {
    title: "Communication",
    description:
      "Stay in touch: attend Office Hours, send updates and work with T4P staff where needed. Attend at least one Office Hours call a week for your first 6 weeks, then at least once a month until you reach product-market fit.",
  },
  {
    title: "Flexible participation",
    description:
      "If the incubator no longer fits your needs, or you stop participating, your membership may be removed, with no hard feelings.",
  },
];

export const notRequired: IncubatorItem[] = [
  {
    title: "No daily meetings",
    description: "Daily or multiple weekly meetings are not required.",
  },
  {
    title: "No T4P ownership",
    description: "Official T4P branding or ownership of your work is not required.",
  },
  {
    title: "Your own tools",
    description: "Use whatever infrastructure or tools work best for your project.",
  },
];

/** `when` is what the applicant sees first: how long a step takes or when it happens. */
export interface ApplicationStep extends IncubatorItem {
  when: string;
}

export const applicationSteps: ApplicationStep[] = [
  {
    when: "10 to 30 minutes",
    title: "Apply",
    description: "Fill out the application form. It takes 10 to 30 minutes.",
  },
  {
    when: "After you apply",
    title: "Review",
    description:
      "We review your application and invite selected projects to interview. Sometimes we reach out for more information first.",
  },
  {
    when: "A 30-minute call",
    title: "Interview",
    description:
      "A 30-minute call about the impact you intend to have and how you'll get there. Please don't prepare slides. Interviews are direct and push on your understanding of the problem.",
  },
  {
    when: "Within 10 days",
    title: "Decision",
    description:
      "We decide whether to admit you and tell you as soon as possible. Sometimes we follow up with more questions first.",
  },
  {
    when: "If admitted",
    title: "Next steps",
    description:
      "If admitted, you'll get an email with next steps and access to Tech for Palestine's resources.",
  },
];
