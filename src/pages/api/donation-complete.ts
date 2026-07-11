import type { APIRoute } from "astro";
import * as Sentry from "@sentry/astro";
import { reportError } from "../../lib/report-error";
import { getEnv } from "../../utils/getEnv";
import {
  isAllowedOrigin,
  corsHeaders,
  ALLOWED_ORIGIN,
  type OriginPolicy,
} from "../../utils/origin";

export const prerender = false;

const ORIGIN_POLICY: OriginPolicy = {
  allowedOrigins: [ALLOWED_ORIGIN, ...(import.meta.env.PROD ? [] : ["http://localhost:4321"])],
  allowedSuffixes: [".website-aun.pages.dev"],
};
const EO_MEMBERS_LIST_URL =
  "https://emailoctopus.com/api/1.6/lists/8adc2ed4-f798-11ef-b60f-115427c25a1c/contacts";
const MAX_NAME_LENGTH = 200;

export const POST: APIRoute = async ({ request, locals }) => {
  const origin = request.headers.get("Origin");
  if (!isAllowedOrigin(origin, ORIGIN_POLICY)) {
    return new Response(JSON.stringify({ message: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ctx = (locals as { runtime?: { ctx?: { waitUntil: (p: Promise<unknown>) => void } } })
    .runtime?.ctx;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ message: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }

  const { email, firstName, lastName } = body as Record<string, unknown>;

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ message: "Invalid or missing email" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }

  const safeFirst = typeof firstName === "string" ? firstName.slice(0, MAX_NAME_LENGTH) : "";
  const safeLast = typeof lastName === "string" ? lastName.slice(0, MAX_NAME_LENGTH) : "";

  const eoApiKey = getEnv("EO_API_KEY", locals);
  const redacted = `[redacted]@${email.split("@")[1]}`;

  try {
    if (eoApiKey) {
      const res = await fetch(EO_MEMBERS_LIST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: eoApiKey,
          email_address: email,
          fields: { FirstName: safeFirst, LastName: safeLast },
          tags: ["donor"],
          status: "SUBSCRIBED",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        reportError(new Error(`EmailOctopus failed: ${res.status}`), {
          context: "donation-complete eo",
          email: redacted,
          status: res.status,
          body: data,
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  } catch (error) {
    reportError(error, { context: "donation-complete" });
    ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));

    return new Response(JSON.stringify({ message: "Failed to process request" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }
};

export const OPTIONS: APIRoute = async ({ request }) => {
  const origin = request.headers.get("Origin");
  if (!isAllowedOrigin(origin, ORIGIN_POLICY)) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, { status: 200, headers: corsHeaders(origin) });
};
