import type { APIRoute } from "astro";
import { constantTimeEqual } from "../../utils/crypto";
import { getEnv } from "../../utils/getEnv";

export const prerender = false;

const MEMBERSHIP_FORM_ID = "1116610";
const EO_MEMBERS_LIST_URL =
  "https://emailoctopus.com/api/1.6/lists/8adc2ed4-f798-11ef-b60f-115427c25a1c/contacts";

// QGiv webhook endpoint to receive donation notifications
// Form: T4P Website Donation Form (embed ID: 83460)
// Form: T4P Membership Form (Form Id: 1116610)
export const POST: APIRoute = async ({ request, locals }) => {
  const runtime = (locals as { runtime?: { env?: Record<string, string> } }).runtime?.env;
  const webhookSecret = runtime?.QGIV_WEBHOOK_SECRET ?? import.meta.env.QGIV_WEBHOOK_SECRET;

  const token = request.headers.get("X-Webhook-Secret");

  if (!webhookSecret || !token || !constantTimeEqual(token, webhookSecret)) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await request.json();

    // Check if this is a membership dues payment (recurring donation on the membership form)
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
                    console.error(`Hub invite failed for [redacted]@${email.split("@")[1]}:`, res.status, await res.json().catch(() => ({})));
                  }
                })
                .catch((err) => console.error("Error calling Hub API:", err))
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
                    console.error(`EmailOctopus failed for [redacted]@${email.split("@")[1]}:`, res.status, await res.json().catch(() => ({})));
                  }
                })
                .catch((err) => console.error("Error calling EmailOctopus API:", err))
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

    // Determine donation type based on QGiv payload
    let donationType: "monthly" | "onetime" | null = null;

    // Check QGiv's actual field formats
    // isRecurring: "y" or "n" (string)
    // type: "one time" or "recurring" (string with space)
    if (payload.isRecurring === "y" || payload.type === "recurring") {
      donationType = "monthly";
    } else if (payload.isRecurring === "n" || payload.type === "one time") {
      donationType = "onetime";
    }

    // If we detected a donation type, send event to Plausible directly
    if (donationType) {
      const eventName = donationType === "monthly" ? "Monthly-donate" : "One-time-donate";

      // Call Plausible Events API
      try {
        const plausibleResponse = await fetch("https://plausible.io/api/event", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "QGiv-Webhook/1.0",
          },
          body: JSON.stringify({
            domain: "techforpalestine.org",
            name: eventName,
            url: "https://techforpalestine.org/donate",
            props: {
              source: "webhook",
              form: payload.form?.name || "Unknown",
              amount: payload.value || payload.donationAmount || "0",
              transactionId: payload.id || payload.transactionId || "",
            },
          }),
        });

        if (plausibleResponse.ok) {
          console.log(`✅ Plausible event sent: ${eventName}`);

          return new Response(
            JSON.stringify({
              success: true,
              donationType,
              eventName,
              formId,
              message: "Donation tracked successfully in Plausible",
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
        } else {
          console.error("Plausible API error:", await plausibleResponse.text());

          return new Response(
            JSON.stringify({
              success: false,
              error: "Failed to send event to Plausible",
              donationType,
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
        }
      } catch (plausibleError) {
        console.error("Error calling Plausible API:", plausibleError);

        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to call Plausible API",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Webhook received but donation type unclear" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing QGiv webhook:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to process webhook",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
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
