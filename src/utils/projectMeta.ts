import { resolveLogoSrc, sanitizeUrl, type ProjectItem } from "../components/projects/projectData";

const SITE_ORIGIN = "https://techforpalestine.org";
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/t4p-social-logo.png`;
const DEFAULT_PROJECT_LOGO = "/images/default.jpg";
const DEFAULT_DESCRIPTION =
  "A project in the Tech for Palestine Incubator, building technology for Palestinian liberation.";

// Chat and social previews clip long descriptions at around this length.
const EXCERPT_MAX_LENGTH = 180;

export interface ProjectMeta {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  /** A project logo is a small square, which the large card crops badly. */
  twitterCard: "summary" | "summary_large_image";
}

function excerpt(text: string): string {
  const plain = text.replace(/\s+/g, " ").trim();
  if (plain.length <= EXCERPT_MAX_LENGTH) return plain;
  const cut = plain.slice(0, EXCERPT_MAX_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : EXCERPT_MAX_LENGTH)}…`;
}

// Builds the title, description and image for a shared project link's
// OG/Twitter preview. What someone expects to see when a project is pasted
// into Slack or X: what it is, what it does, and who leads it.
export function projectMetaTags(project: ProjectItem): ProjectMeta {
  const title = `${project.name} - Tech for Palestine Incubator`;

  // Prefer the short pitch; the full description is often a long paragraph.
  const summary = excerpt(
    project.elevatorPitch || project.description || project.impactStatement || ""
  );
  const byline = project.leadName ? `Led by ${project.leadName}.` : "";
  const description = [summary || DEFAULT_DESCRIPTION, byline].filter(Boolean).join(" ");

  const hasLogo = !!project.logoUrl && project.logoUrl !== DEFAULT_PROJECT_LOGO;
  const logo = hasLogo ? sanitizeUrl(resolveLogoSrc(project.logoUrl)) : "";

  return {
    title,
    description,
    image: logo || DEFAULT_OG_IMAGE,
    imageAlt: logo ? `${project.name} logo` : "Tech for Palestine",
    twitterCard: logo ? "summary" : "summary_large_image",
  };
}
