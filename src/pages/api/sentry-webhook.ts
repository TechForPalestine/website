import type { APIRoute } from "astro";
import { getEnv } from "../../utils/getEnv";
import { verifyHmacSha256Hex } from "../../utils/crypto";

/** The subset of Sentry's webhook payload we read. Everything is optional. */
export interface SentryWebhookPayload {
  action?: string;
  data?: {
    triggered_rule?: string;
    issue?: {
      title?: string;
      permalink?: string;
      project?: { name?: string };
      tags?: Array<{ key?: string; value?: string }>;
      metadata?: { value?: string };
    };
    event?: {
      title?: string;
      web_url?: string;
      issue_url?: string;
      environment?: string;
    };
  };
}

function isPayload(value: unknown): value is SentryWebhookPayload {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function formatMessage(body: SentryWebhookPayload): string {
  const action = body.action ?? "unknown";
  const issue = body.data?.issue;
  const event = body.data?.event;
  const rule = body.data?.triggered_rule ?? "";

  if (issue) {
    const title = issue.title ?? issue.metadata?.value ?? "Unknown error";
    const url = issue.permalink ?? "";
    const project = issue.project?.name ?? "";
    const env = issue.tags?.find((t) => t.key === "environment")?.value ?? "";

    const envTag = env ? ` \`${env}\`` : "";
    const actionLabel: Record<string, string> = {
      created: "🔴 New issue",
      resolved: "✅ Resolved",
      assigned: "👤 Assigned",
      unresolved: "🔁 Regressed",
      archived: "📦 Archived",
    };
    const label = actionLabel[action] ?? `Issue ${action}`;

    return [
      `**[Website]** ${label} in **${project}**${envTag}`,
      `**${title}**`,
      url ? `[View in Sentry](${url})` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (event) {
    const title = event.title ?? "Error";
    const url = event.web_url ?? event.issue_url ?? "";
    const env = event.environment ?? "";
    const envTag = env ? ` \`${env}\`` : "";

    return [
      `**[Website]** 🚨 Alert triggered${rule ? `: ${rule}` : ""}${envTag}`,
      `**${title}**`,
      url ? `[View in Sentry](${url})` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return `**Sentry event**: \`${action}\``;
}

// Failures here use console.error only, not reportAndFlush: reporting a Sentry
// webhook failure back to Sentry could loop.
export const POST: APIRoute = async ({ request, locals }) => {
  const origin = request.headers.get("Origin");
  if (origin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  const secret = getEnv("SENTRY_WEBHOOK_SECRET", locals);
  const mmUrl = getEnv("MATTERMOST_URL", locals);
  const mmToken = getEnv("MATTERMOST_BOT_TOKEN", locals);
  const mmChannelId = getEnv("MATTERMOST_CHANNEL_ID", locals);

  if (!secret || !mmUrl || !mmToken || !mmChannelId) {
    console.error(
      "Missing SENTRY_WEBHOOK_SECRET, MATTERMOST_URL, MATTERMOST_BOT_TOKEN, or MATTERMOST_CHANNEL_ID"
    );
    return new Response(JSON.stringify({ error: "Not configured" }), { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("sentry-hook-signature") ?? "";

  if (!signature || !(await verifyHmacSha256Hex(secret, rawBody, signature))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let body: SentryWebhookPayload;
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (!isPayload(parsed)) throw new Error("payload is not an object");
    body = parsed;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const text = formatMessage(body);

  try {
    const res = await fetch(`${mmUrl}/api/v4/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mmToken}`,
      },
      body: JSON.stringify({ channel_id: mmChannelId, message: text }),
    });

    if (!res.ok) {
      console.error("Mattermost API failed:", res.status, await res.text());
      return new Response(JSON.stringify({ error: "Failed to notify Mattermost" }), {
        status: 502,
      });
    }
  } catch (err) {
    console.error("Error forwarding to Mattermost:", err);
    return new Response(JSON.stringify({ error: "Failed to process request" }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
