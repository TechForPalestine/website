import { describe, expect, it } from "vitest";
import {
  attachProjectLinks,
  getApplyTarget,
  getRoleApplicationUrl,
  MEMBERSHIP_URL,
  normalizeOpenRoles,
  VOLUNTEER_SURVEY_URL,
  type OpenRole,
} from "./openRoleData";

const projectRole: OpenRole = {
  id: "e5b542b4-fba2-43e9-be60-36dcc6e9ae89",
  title: "Data Entry & Research",
  description: "",
  orgName: "Demilitarise Education",
  projectPath: "",
  type: "project",
  skillCategories: [],
  areasOfInterest: [],
  timeCommitment: "",
  createdAt: "2026-10-14T18:35:10.338Z",
};

describe("getRoleApplicationUrl", () => {
  it("passes the role id, title and project name as encoded survey params", () => {
    const url = new URL(getRoleApplicationUrl(projectRole));

    expect(`${url.origin}${url.pathname}`).toBe(VOLUNTEER_SURVEY_URL);
    expect(url.searchParams.get("role_id")).toBe(projectRole.id);
    expect(url.searchParams.get("role_title")).toBe("Data Entry & Research");
    expect(url.searchParams.get("org_name")).toBe("Demilitarise Education");
  });

  it("omits org_name when the role has no project or team name", () => {
    const url = new URL(getRoleApplicationUrl({ ...projectRole, orgName: "" }));

    expect(url.searchParams.has("org_name")).toBe(false);
  });
});

describe("getApplyTarget", () => {
  it("sends project roles to the volunteer survey with the role attached", () => {
    const target = getApplyTarget(projectRole);

    expect(target.label).toBe("Apply to volunteer");
    expect(target.href).toBe(getRoleApplicationUrl(projectRole));
  });

  it("sends team roles to membership", () => {
    expect(getApplyTarget({ ...projectRole, type: "team" }).href).toBe(MEMBERSHIP_URL);
  });
});

describe("normalizeOpenRoles", () => {
  const hubRow = {
    id: "14a4bd4a-a8ab-4dec-9c05-730f062a56dc",
    title: "Tester",
    type: "team",
    team: { id: "585dfb99", name: "Social Media Crossposting Team" },
    project: null,
    createdAt: "2026-09-11T08:49:46.227Z",
  };

  it("reads the team or project name from the Hub's nested shape", () => {
    expect(normalizeOpenRoles([hubRow])[0].orgName).toBe("Social Media Crossposting Team");
  });

  it("keeps the name when normalizing an already-normalized role, as the client does", () => {
    const once = normalizeOpenRoles([hubRow]);
    const twice = normalizeOpenRoles(JSON.parse(JSON.stringify(once)));

    expect(twice[0].orgName).toBe("Social Media Crossposting Team");
  });
});

describe("attachProjectLinks", () => {
  const projects = [
    { id: 323, name: "Demilitarise Education" },
    { id: 24, name: "Tribe-X" },
  ];

  it("links a role to its project page when the names match", () => {
    const [linked] = attachProjectLinks([projectRole], projects);

    expect(linked.projectPath).toBe("/projects/demilitarise-education-323");
  });

  it("matches names regardless of case and punctuation", () => {
    const [linked] = attachProjectLinks([{ ...projectRole, orgName: "tribe x" }], projects);

    expect(linked.projectPath).toBe("/projects/tribe-x-24");
  });

  it("leaves the link empty when no project matches", () => {
    const [unlinked] = attachProjectLinks([{ ...projectRole, orgName: "Awdeh" }], projects);

    expect(unlinked.projectPath).toBe("");
  });

  it("survives the client re-normalizing the API response", () => {
    const linked = attachProjectLinks([projectRole], projects);
    const [renormalized] = normalizeOpenRoles(JSON.parse(JSON.stringify(linked)));

    expect(renormalized.projectPath).toBe("/projects/demilitarise-education-323");
  });

  it("drops a projectPath that is not a directory link", () => {
    const [role] = normalizeOpenRoles([
      { ...projectRole, projectPath: "https://evil.example/projects/x-1" },
    ]);

    expect(role.projectPath).toBe("");
  });
});
