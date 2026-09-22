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
import { MEMBERSHIP_FORMS, verifyQgivTransaction } from "../../utils/qgivVerify";
import { claimTransaction } from "../../utils/transactionReplay";

export const prerender = false;

const ORIGIN_POLICY: OriginPolicy = {
  allowedOrigins: [ALLOWED_ORIGIN, ...(import.meta.env.PROD ? [] : ["http://localhost:4321"])],
  allowedSuffixes: [".website-aun.pages.dev"],
};

const EO_MEMBERS_LIST_URL =
  "https://emailoctopus.com/api/1.6/lists/8adc2ed4-f798-11ef-b60f-115427c25a1c/contacts";

const ALLOWED_FORM_IDS = Object.keys(MEMBERSHIP_FORMS);

export const POST: APIRoute = async ({ request, locals }) => {
  // Kept as defence in depth against drive-by cross-site calls. It is no
  // longer the access control: that is the Qgiv lookup below.
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

  // `transactionId` is the only thing read from the caller. Email, names and
  // tier all come from Qgiv, so a forged request cannot name a victim's
  // address or upgrade itself to the paid tier.
  const verified = await verifyQgivTransaction(body.transactionId, ALLOWED_FORM_IDS, locals);

  if (!verified.ok) {
    reportError(new Error(`Qgiv verification refused: ${verified.reason}`), {
      context: "membership-complete verify",
      reason: verified.reason,
    });
    ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));
    return new Response(JSON.stringify({ message: "Could not verify transaction" }), {
      status: 402,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }

  const { id, formId, email, firstName, lastName } = verified.transaction;
  const tier = MEMBERSHIP_FORMS[formId];
  const redacted = `[redacted]@${email.split("@")[1]}`;

  if (!(await claimTransaction(locals.runtime?.env?.DROPPED_CONVERSIONS, id))) {
    return new Response(JSON.stringify({ success: true, message: "Already processed" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }

  const hubApiUrl = getEnv("HUB_API_URL", locals);
  const hubApiKey = getEnv("HUB_API_KEY", locals);
  const eoApiKey = getEnv("EO_API_KEY", locals);

  try {
    await Promise.allSettled([
      tier.hubInvite && hubApiUrl && hubApiKey
        ? fetch(`${hubApiUrl}/api/auth/invite`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${hubApiKey}` },
            body: JSON.stringify({ email, type: "paid" }),
          })
            .then(async (res) => {
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                reportError(new Error(`Hub invite failed: ${res.status}`), {
                  context: "membership-complete",
                  email: redacted,
                  status: res.status,
                  body: data,
                });
              }
            })
            .catch((err) =>
              reportError(err, { context: "membership-complete hub", email: redacted })
            )
        : Promise.resolve(),

      eoApiKey
        ? fetch(EO_MEMBERS_LIST_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_key: eoApiKey,
              email_address: email,
              fields: { FirstName: firstName, LastName: lastName },
              tags: [tier.tag],
              status: "SUBSCRIBED",
            }),
          })
            .then(async (res) => {
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                reportError(new Error(`EmailOctopus failed: ${res.status}`), {
                  context: "membership-complete eo",
                  email: redacted,
                  status: res.status,
                  body: data,
                });
              }
            })
            .catch((err) =>
              reportError(err, { context: "membership-complete eo", email: redacted })
            )
        : Promise.resolve(),
    ]);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  } catch (error) {
    reportError(error, { context: "membership-complete" });
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
