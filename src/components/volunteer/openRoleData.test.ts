import { describe, expect, it } from "vitest";
import {
  getApplyTarget,
  getRoleApplicationUrl,
  MEMBERSHIP_URL,
  VOLUNTEER_SURVEY_URL,
  type OpenRole,
} from "./openRoleData";

const projectRole: OpenRole = {
  id: "e5b542b4-fba2-43e9-be60-36dcc6e9ae89",
  title: "Data Entry & Research",
  description: "",
  orgName: "Demilitarise Education",
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
