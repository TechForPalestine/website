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
import { DONATION_FORMS, verifyQgivTransaction } from "../../utils/qgivVerify";
import { claimTransaction } from "../../utils/transactionReplay";

export const prerender = false;

const ALLOWED_FORM_IDS = Object.keys(DONATION_FORMS);

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
      return fail(402, "Could not verify transaction");
    }

    const { id, formId, email, firstName, lastName, optedIn } = verified.transaction;
    const tag = DONATION_FORMS[formId].tag;

    // donate.astro checks this client-side, which a forged request can simply
    // omit. Qgiv's own record is what decides whether the donor consented.
    if (!optedIn) {
      return jsonResponse({ success: true, message: "Not opted in" }, 200, cors);
    }

    if (!(await claimTransaction(locals.runtime?.env?.DROPPED_CONVERSIONS, id))) {
      return jsonResponse({ success: true, message: "Already processed" }, 200, cors);
    }

    const eoApiKey = getEnv("EO_API_KEY", locals);

    try {
      if (eoApiKey) {
        await subscribeMember({
          email,
          firstName,
          lastName,
          tag,
          apiKey: eoApiKey,
          context: "donation-complete eo",
        });
      }

      return jsonResponse({ success: true }, 200, cors);
    } catch (error) {
      reportError(error, { context: "donation-complete" });
      ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));

      return fail(500, "Failed to process request");
    }
  },
  { forbidden: () => jsonError(403, "Forbidden", { key: "message" }) }
);

export const OPTIONS: APIRoute = makeOptionsHandler(PAYMENT_ORIGIN_POLICY);
