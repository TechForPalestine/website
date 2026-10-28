import { describe, expect, it } from "vitest";
import {
  attachProjectLinks,
  clampPage,
  getPageCount,
  getPageMarkers,
  normalizeOpenRoles,
  type OpenRole,
} from "./openRoleData";

const projectRole: OpenRole = {
  id: "e5b542b4-fba2-43e9-be60-36dcc6e9ae89",
  title: "Data Entry & Research",
  description: "",
  descriptionHtml: "",
  orgName: "Demilitarise Education",
  projectPath: "",
  type: "project",
  skillCategories: [],
  areasOfInterest: [],
  timeCommitment: "",
  createdAt: "2026-10-14T18:35:10.338Z",
};

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

describe("pagination helpers", () => {
  it("counts pages, with at least one for an empty list", () => {
    expect(getPageCount(33, 8)).toBe(5);
    expect(getPageCount(32, 8)).toBe(4);
    expect(getPageCount(0, 8)).toBe(1);
  });

  it("clamps a page into range", () => {
    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage(9, 5)).toBe(5);
    expect(clampPage(3, 5)).toBe(3);
  });

  it("lists every page when there are few", () => {
    expect(getPageMarkers(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPageMarkers(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(getPageMarkers(1, 1)).toEqual([1]);
  });

  it("collapses long runs into gaps around the current page", () => {
    expect(getPageMarkers(1, 10)).toEqual([1, 2, "gap", 10]);
    expect(getPageMarkers(6, 10)).toEqual([1, "gap", 5, 6, 7, "gap", 10]);
    expect(getPageMarkers(10, 10)).toEqual([1, "gap", 9, 10]);
  });

  it("shows a single skipped page instead of a gap", () => {
    expect(getPageMarkers(4, 10)).toEqual([1, 2, 3, 4, 5, "gap", 10]);
  });
});
