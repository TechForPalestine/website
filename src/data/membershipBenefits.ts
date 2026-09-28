export interface MembershipBenefit {
  label: string;
  supporting: boolean;
  member: boolean;
}

/**
 * Supporting Member vs Member comparison, shown on both supporting-member pages.
 * Members get a superset of the Supporting Member benefits.
 */
export const membershipBenefits: MembershipBenefit[] = [
  { label: "Dues support initiatives for Palestinian liberation", supporting: true, member: true },
  {
    label:
      "Invites to community events, online webinars, regional in-person events, and local meetups",
    supporting: true,
    member: true,
  },
  { label: "Receive updates on our latest projects and teams", supporting: true, member: true },
  {
    label:
      "Support our projects via mentorship, or be contacted when your subject matter expertise may be valuable",
    supporting: true,
    member: true,
  },
  {
    label: "Participate in advocacy projects",
    supporting: false,
    member: true,
  },
  { label: "Join our internal member chat community", supporting: false, member: true },
  {
    label:
      "Help run T4P by joining our support teams in areas like marketing, engineering, finance, and compliance",
    supporting: false,
    member: true,
  },
];

/** What members do once they join — shown on /membership beside the hero photo. */
export const memberBenefits: string[] = [
  "Meet and connect with fellow activists",
  "Join regional summits, online webinars, book clubs and other events",
  "Attend weekly All Hands and internal meetings (Marketing, Engineering, Events, etc.)",
  "Volunteer for our projects",
  "Participate in internal chatroom conversations",
  "Take part in one-off quests and missions to expand your personal advocacy",
  "Receive updates on our latest projects and teams",
  "Propose and start new initiatives for Palestinian liberation",
];

export interface ShowcaseProject {
  name: string;
  logo: string;
  url: string;
  /** True when `logo` is a wordmark (name baked into the image) rather than a
   * bare icon mark — the logo wall only prints a text label next to icon
   * marks, since a wordmark already names itself. */
  hasWordmark?: boolean;
}

/** Projects shown in the logo wall next to the "10M+ users" reach stat. */
export const showcaseProjects: ShowcaseProject[] = [
  {
    name: "UpScrolled",
    logo: "/images/new-homepage/portfolio/proj-logo-5.webp",
    url: "https://upscrolled.com/en/",
    hasWordmark: true,
  },
  {
    name: "Boycat",
    logo: "/images/new-homepage/portfolio/proj-logo-3.webp",
    url: "https://www.boycat.io/",
    hasWordmark: true,
  },
  {
    name: "Find a Protest",
    logo: "/images/new-homepage/portfolio/proj-logo-findaprotest.webp",
    url: "https://www.findaprotest.info/",
    hasWordmark: true,
  },
  {
    name: "Thaura",
    logo: "/images/new-homepage/portfolio/proj-logo-4.webp",
    url: "https://thaura.ai/home",
    hasWordmark: true,
  },
  {
    name: "Apricot",
    logo: "/images/new-homepage/portfolio/proj-logo-2.webp",
    url: "https://apricotinternational.org/",
    hasWordmark: true,
  },
  {
    name: "NewsCord",
    logo: "/newscord.svg",
    url: "https://newscord.org/",
  },
  {
    name: "GazaBridge",
    logo: "/gazabridge.png",
    url: "https://gazabridge.org/",
  },
  {
    name: "Ethicly",
    logo: "https://www.ethicly.ch/ethicly_logo.svg",
    url: "https://www.ethicly.ch/",
    hasWordmark: true,
  },
  {
    name: "A Ween Rayeh",
    logo: "https://projecthub.techforpalestine.org/public-objects/logos/logo-ebc2f68f-6f71-4a-1761304170508.webp",
    url: "https://aweenrayeh.com/",
  },
  {
    name: "JayWalk",
    logo: "https://jaywalkapp.org/assets/jaywalk-hero-6843ef1f.png",
    url: "https://jaywalkapp.org/",
    hasWordmark: true,
  },
];
