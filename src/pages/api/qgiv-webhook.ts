import type { APIRoute } from "astro";

export const prerender = false;

const MEMBERSHIP_FORM_ID = "1116610";

// QGiv webhook endpoint to receive donation notifications
// Form: T4P Website Donation Form (embed ID: 83460)
// Form: T4P Membership Form (Form Id: 1116610)
export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await request.json();

    console.log("QGiv webhook received:", JSON.stringify(payload, null, 2));

    // Check if this is a membership dues payment (recurring donation on the membership form)
    const isMembershipForm = String(payload["Form Id"]) === MEMBERSHIP_FORM_ID;
    const isRecurring = payload["is Recurring"] === "y";

    if (isMembershipForm && isRecurring) {
      const email: string = payload["Contact Email"] ?? "";
      if (email) {
        const hubApiUrl = import.meta.env.HUB_API_URL;
        const hubApiKey = import.meta.env.HUB_API_KEY;
        if (hubApiUrl && hubApiKey) {
          try {
            const hubResponse = await fetch(`${hubApiUrl}/api/auth/invite`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${hubApiKey}`,
              },
              body: JSON.stringify({ email, type: "paid" }),
            });
            if (hubResponse.ok) {
              console.log(`✅ Hub invite sent to ${email}`);
            } else {
              const hubData = await hubResponse.json().catch(() => ({}));
              console.error(`Hub invite failed for ${email}:`, hubResponse.status, hubData);
            }
          } catch (hubError) {
            console.error("Error calling Hub API:", hubError);
          }
        } else {
          console.warn("Hub API not configured — skipping invite for", email);
        }
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
    if (
      payload.isRecurring === "y" ||
      payload["is Recurring"] === "y" ||
      payload.type === "recurring" ||
      payload.type === "monthly" ||
      payload.eventType === "Recurring Donation Created" ||
      payload.eventType === "Recurring Donation Billed"
    ) {
      donationType = "monthly";
    } else if (
      payload.isRecurring === "n" ||
      payload["is Recurring"] === "n" ||
      payload.type === "one time" ||
      payload.type === "onetime" ||
      payload.type === "one-time" ||
      payload.eventType === "Donation Created" ||
      payload.eventType === "Transaction Successful"
    ) {
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
            details: plausibleError instanceof Error ? plausibleError.message : "Unknown error",
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

    // If we couldn't determine the donation type, log the payload for debugging
    console.warn("Could not determine donation type from payload:", payload);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook received but donation type unclear",
        payload,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing QGiv webhook:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : "Unknown error",
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
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
