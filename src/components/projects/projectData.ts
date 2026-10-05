import type { ProjectItem } from "../../types/projects";

// Compat: these moved to types/projects.ts and utils/sanitizeUrl.ts (so the
// server-side store can use them without importing from a component folder).
export type { ProjectItem, Tag } from "../../types/projects";
export { sanitizeUrl } from "../../utils/sanitizeUrl";

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
