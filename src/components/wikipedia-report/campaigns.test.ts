import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  campaignSpan,
  campaignYears,
  campaignsFromToc,
  parseCampaign,
  tickYears,
  yearX,
  type TocItem,
} from "./campaigns";

const item = (number: string, title: string): TocItem => ({ number, title, id: "x" });

describe("parseCampaign", () => {
  it("reads every date format used in Section 3", () => {
    expect(parseCampaign(item("3.1", "JIDF (2001-2015)"))).toMatchObject({
      name: "JIDF",
      start: 2001,
      end: 2015,
      ongoing: false,
    });
    expect(parseCampaign(item("3.2", "Israeli Government (2007)"))).toMatchObject({
      start: 2007,
      end: 2007,
    });
    expect(parseCampaign(item("3.5", "Kohelet Policy Forum (2013–ongoing)"))).toMatchObject({
      name: "Kohelet Policy Forum",
      start: 2013,
      end: undefined,
      ongoing: true,
    });
    expect(parseCampaign(item("3.8", "The Israel Group (2015*–2021)"))).toMatchObject({
      start: 2015,
      end: 2021,
    });
    expect(parseCampaign(item("3.18", "“Wikipedia Lobby Group” (2024-ongoing)"))).toMatchObject({
      name: "“Wikipedia Lobby Group”",
      ongoing: true,
    });
  });

  it("ignores headings that are not dated Section 3 campaigns", () => {
    expect(parseCampaign(item("3.1", "Background"))).toBeNull();
    expect(parseCampaign(item("4.1", "JIDF (2001-2015)"))).toBeNull();
    expect(parseCampaign(item("3.1.2", "JIDF (2001-2015)"))).toBeNull();
    expect(parseCampaign({ title: "JIDF (2001-2015)", id: "x" })).toBeNull();
    expect(parseCampaign(item("3.1", "Backwards (2015-2001)"))).toBeNull();
  });
});

describe("campaignsFromToc", () => {
  it("orders by start year, then section number", () => {
    const toc = [item("3.6", "B (2012–ongoing)"), item("3.5", "A (2013)"), item("3.4", "C (2012)")];
    expect(campaignsFromToc(toc).map((c) => c.number)).toEqual(["3.4", "3.6", "3.5"]);
  });

  it("finds the report's 18 campaigns, 9 of them still active", () => {
    const md = readFileSync("src/content/wikipedia-report/section-3.md", "utf8");
    const toc = [...md.matchAll(/number: "([\d.]+)", title: "((?:[^"\\]|\\.)*)"/g)].map(
      ([, number, title]) => item(number, title.replace(/\\"/g, '"'))
    );
    const campaigns = campaignsFromToc(toc);
    expect(campaigns).toHaveLength(18);
    expect(campaigns.filter((c) => c.ongoing)).toHaveLength(9);
    expect(campaigns[0].start).toBe(2001);
  });
});

describe("geometry", () => {
  const axis = { firstYear: 2001, lastYear: 2026, x0: 0, x1: 260 };

  it("maps whole years to the axis", () => {
    expect(yearX(2001, axis)).toBe(0);
    expect(yearX(2027, axis)).toBe(260);
    expect(yearX(2014, axis)).toBe(130);
  });

  it("draws single years as dots, ranges through their last year, ongoing to the end", () => {
    const base = { number: "3.1", id: "x", name: "n" };
    expect(campaignSpan({ ...base, start: 2007, end: 2007, ongoing: false }, 2026)).toEqual({
      kind: "dot",
      from: 2007.5,
      to: 2007.5,
    });
    expect(campaignSpan({ ...base, start: 2001, end: 2015, ongoing: false }, 2026)).toEqual({
      kind: "range",
      from: 2001,
      to: 2016,
    });
    expect(campaignSpan({ ...base, start: 2013, ongoing: true }, 2026)).toEqual({
      kind: "ongoing",
      from: 2013,
      to: 2027,
    });
  });

  it("ticks the first year and every fifth year", () => {
    expect(tickYears(2001, 2026)).toEqual([2001, 2005, 2010, 2015, 2020, 2025]);
  });

  it("describes years for screen readers", () => {
    const base = { number: "3.1", id: "x", name: "n" };
    expect(campaignYears({ ...base, start: 2001, end: 2015, ongoing: false })).toBe("2001–2015");
    expect(campaignYears({ ...base, start: 2007, end: 2007, ongoing: false })).toBe("2007");
    expect(campaignYears({ ...base, start: 2013, ongoing: true })).toBe("2013 to today");
  });
});
