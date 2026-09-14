import type { APIRoute } from "astro";
import * as Sentry from "@sentry/astro";
import { reportError } from "../../lib/report-error";
import { normalizeOpenRoles } from "../../components/volunteer/openRoleData";

export const prerender = false;

const HUB_OPEN_ROLES_URL = "https://hub.techforpalestine.org/api/public/open-roles";

/** Upstream can cold-start; one retry on a 5xx covers it without stalling the page. */
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 500;

async function fetchOpenRoles(): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(HUB_OPEN_ROLES_URL, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "T4P-Website/1.0",
        },
      });

      // 4xx is a real answer — retrying won't change it.
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      lastError = new Error(`Hub API returned ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    if (attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  throw lastError ?? new Error("Failed to reach Hub API");
}

export const GET: APIRoute = async ({ locals }) => {
  const ctx = locals.runtime?.ctx;

  try {
    const response = await fetchOpenRoles();
    if (!response.ok) {
      throw new Error(`Hub API returned ${response.status}: ${response.statusText}`);
    }

    const payload = await response.json();
    // Tolerate both a bare array and a wrapped envelope.
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.roles)
          ? payload.roles
          : [];

    const roles = normalizeOpenRoles(rows);

    return new Response(JSON.stringify({ roles }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Read-only endpoint over public data.
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    reportError(error, { context: "open-roles" });
    ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));

    return new Response(JSON.stringify({ error: "Failed to fetch open roles" }), {
      status: 502,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  }
};
