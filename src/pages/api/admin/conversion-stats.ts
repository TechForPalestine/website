import type { APIRoute } from "astro";
import * as Sentry from "@sentry/astro";
import { isAuthorized, unauthorizedResponse } from "../../../utils/basicAuth";
import { getEnv } from "../../../utils/getEnv";
import { reportError } from "../../../lib/report-error";

const PLAUSIBLE_API = "https://plausible.io/api/v2/query";
const SITE_ID = "techforpalestine.org";
const GOALS = ["Monthly-donate", "One-time-donate", "Membership-complete"];

interface PlausibleResult {
  dimensions: string[];
  metrics: number[];
}

interface DailyCount {
  date: string;
  goal: string;
  source: string;
  count: number;
}

const SOURCED_GOALS = ["One-time-donate", "Monthly-donate"];

interface DroppedEvent {
  eventName: string;
  timestamp: string;
  props: Record<string, string>;
  hasIp: boolean;
  hasUserAgent: boolean;
}

function defaultDateRange(): [string, string] {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return [from.toISOString().slice(0, 10), to.toISOString().slice(0, 10)];
}

async function fetchPlausibleStatsForGoal(
  apiKey: string,
  goal: string,
  dateFrom: string,
  dateTo: string
): Promise<DailyCount[]> {
  const isSourced = SOURCED_GOALS.includes(goal);
  const dimensions = isSourced
    ? ["time:day", "event:goal", "event:props:source"]
    : ["time:day", "event:goal"];

  const response = await fetch(PLAUSIBLE_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      site_id: SITE_ID,
      metrics: ["events"],
      date_range: [dateFrom, dateTo],
      filters: [["is", "event:goal", [goal]]],
      dimensions,
    }),
  });

  if (!response.ok) return [];

  const data = (await response.json()) as { results: PlausibleResult[] };

  return data.results.map((r) => ({
    date: r.dimensions[0],
    goal: r.dimensions[1],
    source: isSourced ? r.dimensions[2] || "" : "",
    count: r.metrics[0],
  }));
}

async function fetchPlausibleStats(
  apiKey: string,
  dateFrom: string,
  dateTo: string
): Promise<DailyCount[]> {
  const results = await Promise.all(
    GOALS.map((goal) => fetchPlausibleStatsForGoal(apiKey, goal, dateFrom, dateTo))
  );
  return results.flat();
}

interface ConversionDetail {
  goal: string;
  amount: string;
  variant: string;
  source: string;
  count: number;
}

async function fetchPlausibleConversionDetails(
  apiKey: string,
  goal: string,
  props: string[],
  dateFrom: string,
  dateTo: string
): Promise<ConversionDetail[]> {
  const response = await fetch(PLAUSIBLE_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      site_id: SITE_ID,
      metrics: ["events"],
      date_range: [dateFrom, dateTo],
      filters: [["is", "event:goal", [goal]]],
      dimensions: props.map((p) => `event:props:${p}`),
    }),
  });

  if (!response.ok) return [];

  const data = (await response.json()) as { results: PlausibleResult[] };

  return data.results.map((r) => ({
    goal,
    amount: r.dimensions[props.indexOf("amount")] ?? "",
    variant: r.dimensions[props.indexOf("membership_variant")] ?? "",
    source: r.dimensions[props.indexOf("source")] ?? "",
    count: r.metrics[0],
  }));
}

async function fetchConversionDetails(
  apiKey: string,
  dateFrom: string,
  dateTo: string
): Promise<ConversionDetail[]> {
  const queries = [
    fetchPlausibleConversionDetails(apiKey, "One-time-donate", ["amount", "source"], dateFrom, dateTo),
    fetchPlausibleConversionDetails(apiKey, "Monthly-donate", ["amount", "source"], dateFrom, dateTo),
    fetchPlausibleConversionDetails(apiKey, "Membership-complete", ["amount", "membership_variant"], dateFrom, dateTo),
  ];
  const results = await Promise.all(queries);
  return results.flat();
}

async function fetchDroppedEvents(
  kv: KVNamespace,
  dateFrom: string,
  dateTo: string
): Promise<{ daily: DailyCount[]; details: ConversionDetail[] }> {
  const allKeys: string[] = [];
  let cursor: string | undefined;
  do {
    const result = await kv.list({
      prefix: "dropped:",
      limit: 1000,
      cursor,
    });
    for (const key of result.keys) {
      allKeys.push(key.name);
    }
    cursor = result.list_complete ? undefined : result.cursor;
  } while (cursor);

  const entries = await Promise.all(
    allKeys.map(async (key) => {
      const raw = await kv.get(key);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as DroppedEvent;
      } catch {
        return null;
      }
    })
  );

  const events = entries.filter((e): e is DroppedEvent => e !== null);

  const filtered = events.filter((e) => {
    const date = e.timestamp.slice(0, 10);
    return date >= dateFrom && date <= dateTo;
  });

  const counts = new Map<string, number>();
  for (const e of filtered) {
    const date = e.timestamp.slice(0, 10);
    const source = SOURCED_GOALS.includes(e.eventName) ? String(e.props.source ?? "") : "";
    const key = `${date}:${e.eventName}:${source}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const daily: DailyCount[] = [];
  for (const [key, count] of counts) {
    const [date, goal, source] = key.split(":");
    daily.push({ date, goal, source, count });
  }

  const detailCounts = new Map<string, number>();
  for (const e of filtered) {
    const amount = String(e.props.amount ?? "");
    const variant = String(e.props.membership_variant ?? "");
    const source = String(e.props.source ?? "");
    const key = `${e.eventName}:${amount}:${variant}:${source}`;
    detailCounts.set(key, (detailCounts.get(key) || 0) + 1);
  }

  const details: ConversionDetail[] = [];
  for (const [key, count] of detailCounts) {
    const [goal, amount, variant, source] = key.split(":");
    details.push({ goal, amount, variant, source, count });
  }

  return { daily, details };
}

export const GET: APIRoute = async ({ request, locals }) => {
  if (!isAuthorized(request, locals)) {
    return unauthorizedResponse();
  }

  const url = new URL(request.url);

  const apiKey = getEnv("PLAUSIBLE_API_KEY", locals);
  const kv = locals.runtime?.env?.DROPPED_CONVERSIONS;

  const [defaultFrom, defaultTo] = defaultDateRange();
  const dateFrom = url.searchParams.get("date_from") || defaultFrom;
  const dateTo = url.searchParams.get("date_to") || defaultTo;

  const ctx = locals.runtime?.ctx;
  try {
    const [plausible, dropped, details] = await Promise.all([
      apiKey
        ? fetchPlausibleStats(apiKey, dateFrom, dateTo)
        : Promise.resolve([]),
      kv
        ? fetchDroppedEvents(kv, dateFrom, dateTo)
        : Promise.resolve({ daily: [], details: [] }),
      apiKey
        ? fetchConversionDetails(apiKey, dateFrom, dateTo)
        : Promise.resolve([]),
    ]);

    return new Response(
      JSON.stringify({
        plausible,
        dropped: dropped.daily,
        details: [...details, ...dropped.details],
        dateFrom,
        dateTo,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    reportError(error, { context: "conversion-stats" });
    ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));

    return new Response(JSON.stringify({ error: "Failed to fetch stats" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
};
