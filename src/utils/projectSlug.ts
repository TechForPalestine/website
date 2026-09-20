import type { ProjectItem } from "../components/projects/projectData";
import { slugify } from "./slugify";

// Isomorphic (no Node-only APIs): used from Astro frontmatter on the server
// and from the React island, so the two cannot disagree about what a
// shareable project URL looks like. Mirrors eventSlug.ts, with one deliberate
// difference: the id alone identifies a project. The name part is cosmetic,
// so a renamed project's old links still resolve (and can be redirected to
// the current slug) instead of breaking.

type Sluggable = Pick<ProjectItem, "id" | "name">;

const FALLBACK_NAME = "project";

export function projectSlug(project: Sluggable): string {
  return `${slugify(project.name ?? "") || FALLBACK_NAME}-${project.id}`;
}

export function projectPath(project: Sluggable): string {
  return `/projects/${projectSlug(project)}`;
}

/** The trailing id of a `<name>-<id>` slug, or null when it has none. */
export function parseProjectId(slug: string): number | null {
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    // malformed percent-encoding: fall through and fail to match below
  }
  const match = /-(\d+)\/?$/.exec(decoded);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) ? id : null;
}

export function findProjectBySlug<T extends Sluggable>(projects: T[], slug: string): T | undefined {
  const id = parseProjectId(slug);
  if (id === null) return undefined;
  return projects.find((project) => project.id === id);
}
