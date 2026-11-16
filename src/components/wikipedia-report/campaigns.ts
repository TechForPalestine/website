// The campaigns documented in Section 3 of the report, parsed from the
// section's table of contents ("Kohelet Policy Forum (2013–ongoing)"), so the
// landing-page timeline always matches the published report. Pure helpers;
// CampaignTimeline.astro does the drawing.

export interface TocItem {
  number?: string;
  title: string;
  id: string;
}

export interface Campaign {
  /** Report section, e.g. "3.5". */
  number: string;
  /** Heading id on the section-3 page, e.g. "s3-5". */
  id: string;
  name: string;
  start: number;
  /** Last active year; undefined while ongoing. */
  end?: number;
  ongoing: boolean;
}

/** "Name (2001-2015)", "Name (2007)", "Name (2013–ongoing)", "Name (2015*–2021)". */
const TITLE_RE = /^(.*\S)\s*\((\d{4})\*?(?:\s*[-–]\s*(\d{4}|ongoing))?\)$/;

/** Parse one Section 3 heading into a campaign, or null if it isn't one. */
export function parseCampaign(item: TocItem): Campaign | null {
  if (!item.number || !/^3\.\d+$/.test(item.number)) return null;
  const match = TITLE_RE.exec(item.title.trim());
  if (!match) return null;
  const [, name, startText, endText] = match;
  const start = Number(startText);
  const ongoing = endText === "ongoing";
  const end = ongoing ? undefined : endText ? Number(endText) : start;
  if (end !== undefined && end < start) return null;
  return { number: item.number, id: item.id, name, start, end, ongoing };
}

/** All campaigns in a Section 3 toc, ordered by start year, then section number. */
export function campaignsFromToc(toc: readonly TocItem[]): Campaign[] {
  const minor = (c: Campaign) => Number(c.number.split(".")[1]);
  return toc
    .map(parseCampaign)
    .filter((c): c is Campaign => c !== null)
    .sort((a, b) => a.start - b.start || minor(a) - minor(b));
}

export interface Span {
  kind: "dot" | "range" | "ongoing";
  /** Fractional years on the axis: a campaign active through 2015 runs to 2016. */
  from: number;
  to: number;
}

/** Where a campaign sits on the axis. `lastYear` is the report's year; ongoing
 * campaigns run to its end. */
export function campaignSpan(c: Campaign, lastYear: number): Span {
  if (c.ongoing) return { kind: "ongoing", from: c.start, to: lastYear + 1 };
  if (c.end === c.start) return { kind: "dot", from: c.start + 0.5, to: c.start + 0.5 };
  return { kind: "range", from: c.start, to: (c.end ?? c.start) + 1 };
}

export interface Axis {
  firstYear: number;
  lastYear: number;
  x0: number;
  x1: number;
}

/** Horizontal position of a fractional year between x0 (start of firstYear)
 * and x1 (end of lastYear). */
export function yearX(year: number, axis: Axis): number {
  const span = axis.lastYear + 1 - axis.firstYear;
  return axis.x0 + ((year - axis.firstYear) / span) * (axis.x1 - axis.x0);
}

/** Tick years: the first year, then every multiple of 5 up to lastYear. */
export function tickYears(firstYear: number, lastYear: number): number[] {
  const ticks = [firstYear];
  for (let y = Math.ceil((firstYear + 1) / 5) * 5; y <= lastYear; y += 5) ticks.push(y);
  return ticks;
}

/** "2001–2015", "2007", "2013 to today". */
export function campaignYears(c: Campaign): string {
  if (c.ongoing) return `${c.start} to today`;
  return c.end === c.start ? `${c.start}` : `${c.start}–${c.end}`;
}
