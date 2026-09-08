/**
 * Shape and normalization helpers for open volunteer roles coming from the
 * T4P Hub (`/api/public/open-roles`, proxied through `/api/open-roles`).
 *
 * The upstream payload is nested (`project.name` / `team.name`) and carries
 * fields the website has no use for. Normalizing at the boundary keeps the UI
 * free of optional-chaining noise and means a shape change upstream fails in
 * one place.
 */

/** How a role is staffed, which decides where its apply button points. */
export type OpenRoleType = "project" | "team";

export interface OpenRole {
  id: string;
  title: string;
  description: string;
  /** Name of the coalition project or T4P team the role sits in. */
  orgName: string;
  type: OpenRoleType;
  skillCategories: string[];
  areasOfInterest: string[];
  /** Free text, e.g. "5 hours a week". Absent on most roles. */
  timeCommitment: string;
  createdAt: string;
}

export const VOLUNTEER_FORM_URL = "https://techforpalestine.org/volunteer-form";
export const MEMBERSHIP_URL = "/membership";

/** Upstream descriptions are free text; cap them so one bad row can't bloat the page. */
const MAX_DESCRIPTION_LENGTH = 4000;

function toTrimmedString(value: unknown, maxLength = 500): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => toTrimmedString(entry, 120)).filter(Boolean);
}

function toOrgName(raw: Record<string, unknown>): string {
  const nested = (key: "project" | "team") => {
    const container = raw[key];
    if (!container || typeof container !== "object") return "";
    return toTrimmedString((container as Record<string, unknown>).name, 200);
  };
  return nested("project") || nested("team");
}

/**
 * Converts one upstream row into an `OpenRole`, or returns null when the row
 * lacks the fields the UI needs to render anything meaningful.
 */
export function normalizeOpenRole(raw: unknown): OpenRole | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;

  const id = toTrimmedString(row.id, 100);
  const title = toTrimmedString(row.title, 200);
  if (!id || !title) return null;

  return {
    id,
    title,
    description: toTrimmedString(row.description, MAX_DESCRIPTION_LENGTH),
    orgName: toOrgName(row),
    type: row.type === "team" ? "team" : "project",
    skillCategories: toStringArray(row.skillCategories),
    areasOfInterest: toStringArray(row.areasOfInterest),
    timeCommitment: toTrimmedString(row.timeCommitment, 120),
    createdAt: toTrimmedString(row.createdAt, 40),
  };
}

export function normalizeOpenRoles(raw: unknown): OpenRole[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeOpenRole)
    .filter((role): role is OpenRole => role !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Where a role's apply button points, per how the role is staffed. */
export function getApplyTarget(role: OpenRole): { href: string; label: string } {
  return role.type === "team"
    ? { href: MEMBERSHIP_URL, label: "Become a member" }
    : { href: VOLUNTEER_FORM_URL, label: "Apply to volunteer" };
}

export interface SkillFilter {
  name: string;
  count: number;
}

/** Skill categories present in the given roles, most common first. */
export function getSkillFilters(roles: OpenRole[]): SkillFilter[] {
  const counts = new Map<string, number>();
  for (const role of roles) {
    for (const skill of role.skillCategories) {
      counts.set(skill, (counts.get(skill) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
