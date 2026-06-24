export interface Tag {
  id: number;
  name: string;
  type: string;
}

export interface ProjectItem {
  id: number;
  name: string;
  description: string;
  impactStatement?: string;
  elevatorPitch?: string;
  websiteUrl?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
  leadName?: string;
  leaderPhoto?: string;
  leaderBio?: string;
  publicEmail?: string;
  donationUrl?: string;
  involvementUrl?: string;
  categoryName?: string;
  discordUsername?: string;
  mentor?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  telegramUrl?: string;
  mastodonUrl?: string;
  blueskyUrl?: string;
  tiktokUrl?: string;
  signalUrl?: string;
  upscrolledUrl?: string;
  tags?: Tag[];
  featured?: boolean;
}

/** Only allow http: and https: URLs to prevent javascript: / data: XSS vectors. */
export function sanitizeUrl(url: string | undefined): string {
  if (!url) return "";
  try {
    const parsed = new URL(url, "https://placeholder.invalid");
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return url;
  } catch {
    // malformed URL
  }
  return "";
}

export function sanitizeEmail(email: string | undefined): string {
  if (!email) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1 && words[0].length > 0) return words[0][0].toUpperCase();
  return "P";
}

export function getProjectText(project: ProjectItem): string {
  return project.description || project.elevatorPitch || project.impactStatement || "";
}

export function resolveLogoSrc(url: string | undefined): string {
  if (!url) return "";
  return url.startsWith("/") ? `https://projecthub.techforpalestine.org${url}` : url;
}

export function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function formatMonthYear(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
