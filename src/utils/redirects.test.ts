import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const redirects = readFileSync("public/_redirects", "utf8")
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"))
  .map((line) => line.split(/\s+/));

/** Removed `-new` page routes that must keep a 301. */
const REMOVED_ROUTES = [
  "/about-new",
  "/contact-new",
  "/donate-new",
  "/donate-2-new",
  "/e4p-new",
  "/e4p/pledge-new",
  "/endorsements-new",
  "/events-new",
  "/faq-new",
  "/get-involved-new",
  "/help/hire-new",
  "/home-new",
  "/ideas-new",
  "/incubator-new",
  "/legal-new",
  "/london-gathering-new",
  "/media-new",
  "/mentorship-new",
  "/privacy-policy-new",
  "/projects-new",
  "/team-new",
  "/terms-new",
  "/tools-new",
  "/volunteer-new",
];

describe("public/_redirects", () => {
  for (const route of REMOVED_ROUTES) {
    for (const from of [route, `${route}/`]) {
      it(`301s ${from}`, () => {
        const rule = redirects.find(([source]) => source === from);
        expect(rule, `missing redirect for ${from}`).toBeDefined();
        expect(rule?.[2]).toBe("301");
      });
    }
  }
});
