import type { APIRoute } from "astro";
import { reportError } from "../../lib/report-error";
import { constantTimeEqual } from "../../utils/crypto";
import { getEnv } from "../../utils/getEnv";

export const prerender = false;

const MEMBERSHIP_FORM_ID = "1116610";
const EO_MEMBERS_LIST_URL =
  "https://emailoctopus.com/api/1.6/lists/8adc2ed4-f798-11ef-b60f-115427c25a1c/contacts";

export const POST: APIRoute = async ({ request, locals }) => {
  const runtime = (locals as { runtime?: { env?: Record<string, string> } }).runtime?.env;
  const webhookSecret = runtime?.QGIV_WEBHOOK_SECRET ?? import.meta.env.QGIV_WEBHOOK_SECRET;

  const token = request.headers.get("X-Webhook-Secret");

  if (!webhookSecret || !token || !constantTimeEqual(token, webhookSecret)) {
    reportError(new Error("QGiv webhook auth failed"), {
      context: "auth",
      hasSecret: Boolean(webhookSecret),
      hasToken: Boolean(token),
    });
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await request.json();

    const formId = payload["formId"] ?? payload["Form Id"] ?? null;
    const isMembershipForm = String(formId) === MEMBERSHIP_FORM_ID;
    const isRecurring = payload["isRecurring"] === "y";

    if (isMembershipForm && isRecurring) {
      const email: string = payload["contactEmail"] ?? "";
      if (email) {
        const hubApiUrl = getEnv("HUB_API_URL", locals);
        const hubApiKey = getEnv("HUB_API_KEY", locals);
        const eoApiKey = getEnv("EO_API_KEY", locals);

        await Promise.allSettled([
          hubApiUrl && hubApiKey
            ? fetch(`${hubApiUrl}/api/auth/invite`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${hubApiKey}` },
                body: JSON.stringify({ email, type: "paid" }),
              })
                .then(async (res) => {
                  if (res.ok) {
                    console.log(`✅ Hub invite sent to [redacted]@${email.split("@")[1]}`);
                  } else {
                    const body = await res.json().catch(() => ({}));
                    reportError(new Error(`Hub invite failed: ${res.status}`), { context: "Hub API invite", email: `[redacted]@${email.split("@")[1]}`, status: res.status, body });
                  }
                })
                .catch((err) => reportError(err, { context: "Hub API invite", email: `[redacted]@${email.split("@")[1]}` }))
            : Promise.resolve(console.warn(`Hub API not configured — skipping invite for [redacted]@${email.split("@")[1]}`)),

          eoApiKey
            ? fetch(EO_MEMBERS_LIST_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  api_key: eoApiKey,
                  email_address: email,
                  fields: {
                    FirstName: payload["firstName"] ?? payload["contactFirstName"] ?? "",
                    LastName: payload["lastName"] ?? payload["contactLastName"] ?? "",
                  },
                  tags: ["member"],
                  status: "SUBSCRIBED",
                }),
              })
                .then(async (res) => {
                  if (res.ok) {
                    console.log(`✅ EmailOctopus contact added for [redacted]@${email.split("@")[1]}`);
                  } else {
                    const body = await res.json().catch(() => ({}));
                    reportError(new Error(`EmailOctopus failed: ${res.status}`), { context: "EmailOctopus API", email: `[redacted]@${email.split("@")[1]}`, status: res.status, body });
                  }
                })
                .catch((err) => reportError(err, { context: "EmailOctopus API", email: `[redacted]@${email.split("@")[1]}` }))
            : Promise.resolve(console.warn(`EO_API_KEY not configured — skipping EmailOctopus for [redacted]@${email.split("@")[1]}`)),
        ]);
      } else {
        console.warn("Membership webhook received but no Contact Email in payload");
      }

      return new Response(JSON.stringify({ success: true, message: "Membership invite processed" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    let donationType: "monthly" | "onetime" | null = null;

    if (payload.isRecurring === "y" || payload.type === "recurring") {
      donationType = "monthly";
    } else if (payload.isRecurring === "n" || payload.type === "one time") {
      donationType = "onetime";
    }

    if (donationType) {
      const eventName = donationType === "monthly" ? "Monthly-donate" : "One-time-donate";

      const donorIp = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "";

      fetch("https://plausible.io/api/event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; T4P-Webhook/1.0)",
          ...(donorIp && { "X-Forwarded-For": donorIp }),
        },
        body: JSON.stringify({
          domain: "techforpalestine.org",
          name: eventName,
          url: "https://techforpalestine.org/donate",
          props: {
            source: "webhook",
            form: String(payload.form?.name || "Unknown"),
            amount: String(payload.value ?? payload.donationAmount ?? "0"),
            transactionId: String(payload.id ?? payload.transactionId ?? ""),
          },
        }),
      })
        .then(async (res) => {
          if (res.ok) {
            console.log(`✅ Plausible event sent: ${eventName}`);
          } else {
            const body = await res.text();
            reportError(new Error(`Plausible API error: ${res.status}`), { context: "Plausible API", eventName, body });
          }
        })
        .catch((err) => reportError(err, { context: "Plausible API", eventName }));

      return new Response(
        JSON.stringify({ success: true, donationType, eventName, formId, message: "Donation tracked" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Webhook received but donation type unclear" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    reportError(error, { context: "QGiv webhook processing" });

    return new Response(
      JSON.stringify({ error: "Failed to process webhook" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Handle OPTIONS for CORS preflight
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "https://techforpalestine.org",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Webhook-Secret",
    },
  });
};
