import type { ProjectItem } from "../types/projects";

// Picks the projects featured on /monthly-challenge out of the full ProjectHub list.
// Matched by name because the list comes from the challenge copy, not from
// ProjectHub ids; aliases cover projects whose ProjectHub name differs.
// Names must match whole (after normalizing), so "Spotify" never pulls in an
// unrelated "Spotify Export"-style project.

export interface WantedProject {
  /** Display name from the challenge copy. */
  name: string;
  /** Other names the project may be listed under in ProjectHub. */
  aliases?: string[];
}

export function normalizeProjectName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function pickChallengeProjects(
  projects: ProjectItem[],
  wanted: WantedProject[]
): ProjectItem[] {
  const byName = new Map(projects.map((p) => [normalizeProjectName(p.name ?? ""), p]));
  const picked: ProjectItem[] = [];

  for (const { name, aliases = [] } of wanted) {
    const match = [name, ...aliases]
      .map((candidate) => byName.get(normalizeProjectName(candidate)))
      .find((project) => project !== undefined);
    if (match && !picked.includes(match)) picked.push(match);
  }

  return picked;
}
