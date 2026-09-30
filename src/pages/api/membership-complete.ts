import type { APIRoute } from "astro";
import * as Sentry from "@sentry/astro";
import { reportError } from "../../lib/report-error";
import { getEnv } from "../../utils/getEnv";
import {
  corsHeaders,
  makeOptionsHandler,
  PAYMENT_ORIGIN_POLICY,
  withOriginGuard,
} from "../../utils/origin";
import { jsonError, jsonResponse } from "../../utils/apiResponse";
import { redactEmail, subscribeMember } from "../../utils/emailOctopus";
import { MEMBERSHIP_FORMS, verifyQgivTransaction } from "../../utils/qgivVerify";
import { claimTransaction } from "../../utils/transactionReplay";

export const prerender = false;

const ALLOWED_FORM_IDS = Object.keys(MEMBERSHIP_FORMS);

export const POST: APIRoute = withOriginGuard(
  PAYMENT_ORIGIN_POLICY,
  async ({ request, locals }, origin) => {
    // Defence in depth against drive-by cross-site calls, not the access control:
    // that is the Qgiv lookup below.
    const cors = corsHeaders(origin);
    const fail = (status: number, message: string) =>
      jsonError(status, message, { key: "message", headers: cors });

    const ctx = (locals as { runtime?: { ctx?: { waitUntil: (p: Promise<unknown>) => void } } })
      .runtime?.ctx;

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return fail(400, "Invalid request body");
    }

    // `transactionId` is the only thing read from the caller. Email, names and
    // tier all come from Qgiv, so a forged request cannot name a victim's
    // address or upgrade itself to the paid tier.
    const verified = await verifyQgivTransaction(body.transactionId, ALLOWED_FORM_IDS, locals);

    if (!verified.ok) {
      // "invalid-id" never reached Qgiv at all — it's malformed client input
      // (or path-traversal probing), not a real verification failure. Reporting
      // it to Sentry would let anyone with the right Origin burn Sentry quota
      // and drown out the genuine "Qgiv propagation lag" signal operators
      // actually need to watch for.
      if (verified.reason !== "invalid-id") {
        reportError(new Error(`Qgiv verification refused: ${verified.reason}`), {
          context: "membership-complete verify",
          reason: verified.reason,
        });
        ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));
      }
      return fail(402, "Could not verify transaction");
    }

    const { id, formId, email, firstName, lastName } = verified.transaction;
    const tier = MEMBERSHIP_FORMS[formId];
    const redacted = redactEmail(email);

    if (!(await claimTransaction(locals.runtime?.env?.DROPPED_CONVERSIONS, id))) {
      return jsonResponse({ success: true, message: "Already processed" }, 200, cors);
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
          ? subscribeMember({
              email,
              firstName,
              lastName,
              tag: tier.tag,
              apiKey: eoApiKey,
              context: "membership-complete eo",
            }).catch((err) =>
              reportError(err, { context: "membership-complete eo", email: redacted })
            )
          : Promise.resolve(),
      ]);

      return jsonResponse({ success: true }, 200, cors);
    } catch (error) {
      reportError(error, { context: "membership-complete" });
      ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));

      return fail(500, "Failed to process request");
    }
  },
  { forbidden: () => jsonError(403, "Forbidden", { key: "message" }) }
);

export const OPTIONS: APIRoute = makeOptionsHandler(PAYMENT_ORIGIN_POLICY);
