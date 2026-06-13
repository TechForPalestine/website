import type { APIRoute } from "astro";
import * as Sentry from "@sentry/astro";
import { constantTimeEqual } from "../../../utils/crypto";
import { getEnv } from "../../../utils/getEnv";
import { reportError } from "../../../lib/report-error";

const PLAUSIBLE_API = "https://plausible.io/api/v2/query";
const SITE_ID = "techforpalestine.org";
const GOALS = ["Monthly-donate", "One-time-donate"];

interface PlausibleResult {
  dimensions: string[];
  metrics: number[];
}

interface DailyCount {
  date: string;
  goal: string;
  count: number;
}

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

async function fetchPlausibleStats(
  apiKey: string,
  dateFrom: string,
  dateTo: string
): Promise<DailyCount[]> {
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
      filters: [["is", "event:goal", GOALS]],
      dimensions: ["time:day", "event:goal"],
    }),
  });

  if (!response.ok) {
    throw new Error(`Plausible API error: ${response.status}`);
  }

  const data = (await response.json()) as { results: PlausibleResult[] };

  return data.results.map((r) => ({
    date: r.dimensions[0],
    goal: r.dimensions[1],
    count: r.metrics[0],
  }));
}

async function fetchDroppedEvents(
  kv: KVNamespace,
  dateFrom: string,
  dateTo: string
): Promise<{ daily: DailyCount[]; events: DroppedEvent[] }> {
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
    const key = `${date}:${e.eventName}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const daily: DailyCount[] = [];
  for (const [key, count] of counts) {
    const [date, ...goalParts] = key.split(":");
    daily.push({ date, goal: goalParts.join(":"), count });
  }

  return { daily, events: filtered.reverse() };
}

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const expectedToken = getEnv("DROPPED_CONVERSIONS_TOKEN", locals);

  if (!expectedToken || !token || !constantTimeEqual(token, expectedToken)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const apiKey = getEnv("PLAUSIBLE_API_KEY", locals);
  const kv = locals.runtime?.env?.DROPPED_CONVERSIONS;

  const [defaultFrom, defaultTo] = defaultDateRange();
  const dateFrom = url.searchParams.get("date_from") || defaultFrom;
  const dateTo = url.searchParams.get("date_to") || defaultTo;

  const ctx = locals.runtime?.ctx;
  try {
    const [plausible, dropped] = await Promise.all([
      apiKey
        ? fetchPlausibleStats(apiKey, dateFrom, dateTo)
        : Promise.resolve([]),
      kv
        ? fetchDroppedEvents(kv, dateFrom, dateTo)
        : Promise.resolve({ daily: [], events: [] }),
    ]);

    return new Response(
      JSON.stringify({
        plausible,
        dropped: dropped.daily,
        droppedEvents: dropped.events,
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
