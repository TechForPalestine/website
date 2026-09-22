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
import { DONATION_FORMS, verifyQgivTransaction } from "../../utils/qgivVerify";
import { claimTransaction } from "../../utils/transactionReplay";

export const prerender = false;

const ORIGIN_POLICY: OriginPolicy = {
  allowedOrigins: [ALLOWED_ORIGIN, ...(import.meta.env.PROD ? [] : ["http://localhost:4321"])],
  allowedSuffixes: [".website-aun.pages.dev"],
};
const EO_MEMBERS_LIST_URL =
  "https://emailoctopus.com/api/1.6/lists/8adc2ed4-f798-11ef-b60f-115427c25a1c/contacts";

const ALLOWED_FORM_IDS = Object.keys(DONATION_FORMS);

export const POST: APIRoute = async ({ request, locals }) => {
  // Defence in depth only — the Qgiv lookup below is the access control.
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

  const verified = await verifyQgivTransaction(body.transactionId, ALLOWED_FORM_IDS, locals);

  if (!verified.ok) {
    // "invalid-id" never reached Qgiv at all — it's malformed client input
    // (or path-traversal probing), not a real verification failure. Reporting
    // it to Sentry would let anyone with the right Origin burn Sentry quota
    // and drown out the genuine "Qgiv propagation lag" signal operators
    // actually need to watch for.
    if (verified.reason !== "invalid-id") {
      reportError(new Error(`Qgiv verification refused: ${verified.reason}`), {
        context: "donation-complete verify",
        reason: verified.reason,
      });
      ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));
    }
    return new Response(JSON.stringify({ message: "Could not verify transaction" }), {
      status: 402,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }

  const { id, formId, email, firstName, lastName, optedIn } = verified.transaction;
  const tag = DONATION_FORMS[formId].tag;

  // donate.astro checks this client-side, which a forged request can simply
  // omit. Qgiv's own record is what decides whether the donor consented.
  if (!optedIn) {
    return new Response(JSON.stringify({ success: true, message: "Not opted in" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }

  if (!(await claimTransaction(locals.runtime?.env?.DROPPED_CONVERSIONS, id))) {
    return new Response(JSON.stringify({ success: true, message: "Already processed" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }

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
          fields: { FirstName: firstName, LastName: lastName },
          tags: [tag],
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
