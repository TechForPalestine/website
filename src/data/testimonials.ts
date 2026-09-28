export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  /** Distinguishes internal T4P members from founders of projects T4P has
   * supported — lets consumers filter by audience (e.g. /membership shows
   * only members) instead of matching on name or role text. */
  kind: "member" | "founder";
  /** Single headshot. Mutually exclusive with `headshots`. */
  headshot?: string;
  /** Two overlapping headshots, for quotes attributed to a pair. */
  headshots?: [string, string];
}

/**
 * Testimonials shown in the marquee on /home-new, the membership pages, and the
 * supporting-member pages.
 */
export function getTestimonials(): Testimonial[] {
  return [
    {
      quote:
        "The valuable advice and launch support from T4P was exactly what we needed to finally hit cash-flow positive and build our impact.",
      name: "Hani & Said Chihabi",
      role: "Founders, Thaura",
      kind: "founder",
      headshots: [
        "/images/new-homepage/testimonials/hani.webp",
        "/images/new-homepage/testimonials/said.webp",
      ],
    },
    {
      quote:
        "T4P isn't just a projects incubator, it incubated me too. As someone from Gaza, being part of a team that actively supports and advocates for Palestine makes this work feel deeply personal.",
      name: "Mohanad",
      role: "Member, Tech for Palestine",
      kind: "member",
      headshot: "/images/new-homepage/testimonials/anonymous.svg",
    },
    {
      quote:
        "Tech for Palestine has been a true partner to UpScrolled from the early days, opening doors to their ecosystem and standing by us at every step of the journey.",
      name: "Issam Hijazi",
      role: "Founder, UpScrolled",
      kind: "founder",
      headshot: "/images/new-homepage/testimonials/issam-hijazi.webp",
    },
    {
      quote:
        "Being part of Tech for Palestine is not a duty, it is a privilege. This is work we do to help forge a future for everyone who is being oppressed.",
      name: "Veda",
      role: "Member, Tech for Palestine",
      kind: "member",
      headshot: "/images/new-homepage/testimonials/anonymous.svg",
    },
    {
      quote:
        "With the volunteers and partnerships provided, we went from a minimally viable concept to a full-fledged global platform reaching millions of accounts each month.",
      name: "Nima Akram",
      role: "Founder, Newscord",
      kind: "founder",
      headshot: "/images/new-homepage/testimonials/newscord.webp",
    },
    {
      quote:
        "T4P gave me a meaningful way to support the Palestinian cause and liberation. It is inspiring to connect with T4P's deeply committed people and volunteers, all united in driving positive change, through the high-impact projects we support.",
      name: "Cecile",
      role: "Member, Tech for Palestine",
      kind: "member",
      headshot: "/images/new-homepage/testimonials/anonymous.svg",
    },
  ];
}
