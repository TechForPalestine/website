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
      "Support our projects via mentorship or be contacted when your subject matter expertise may be valuable",
    supporting: true,
    member: true,
  },
  {
    label: "Participate in internal teams building advocacy projects",
    supporting: false,
    member: true,
  },
  { label: "Join our internal member chat community", supporting: false, member: true },
  {
    label:
      "Help run T4P by joining our internal teams in areas like marketing, engineering, finance, and compliance",
    supporting: false,
    member: true,
  },
];

export interface ShowcaseProject {
  name: string;
  logo: string;
}

/** Projects shown in the logo wall next to the "10M+ users" reach stat. */
export const showcaseProjects: ShowcaseProject[] = [
  { name: "UpScrolled", logo: "/images/new-homepage/portfolio/proj-logo-5.webp" },
  { name: "Boycat", logo: "/images/new-homepage/portfolio/proj-logo-3.webp" },
  { name: "Find a Protest", logo: "/images/new-homepage/portfolio/proj-logo-findaprotest.webp" },
  { name: "Thaura", logo: "/images/new-homepage/portfolio/proj-logo-4.webp" },
  { name: "Apricot", logo: "/images/new-homepage/portfolio/proj-logo-2.webp" },
];
