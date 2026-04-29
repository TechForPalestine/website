import type { APIRoute } from "astro";
import { getEnv } from "../../utils/getEnv";

async function verifySignature(
  secret: string,
  body: string,
  signature: string
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  // constant-time comparison
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

function formatMessage(body: Record<string, any>): string {
  const action: string = body.action ?? "unknown";
  const issue = body.data?.issue;
  const event = body.data?.event;
  const rule: string = body.data?.triggered_rule ?? "";

  if (issue) {
    const title: string = issue.title ?? issue.metadata?.value ?? "Unknown error";
    const url: string = issue.permalink ?? "";
    const level: string = issue.level ?? "error";
    const project: string = issue.project?.name ?? "";
    const env: string = issue.tags?.find((t: any) => t.key === "environment")?.value ?? "";

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
      `**${label}** in **${project}**${envTag}`,
      `**${title}**`,
      url ? `[View in Sentry](${url})` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (event) {
    const title: string = event.title ?? "Error";
    const url: string = event.web_url ?? event.issue_url ?? "";
    const env: string = event.environment ?? "";
    const envTag = env ? ` \`${env}\`` : "";

    return [
      `**🚨 Alert triggered**${rule ? `: ${rule}` : ""}${envTag}`,
      `**${title}**`,
      url ? `[View in Sentry](${url})` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return `**Sentry event**: \`${action}\``;
}

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
    console.error("Missing SENTRY_WEBHOOK_SECRET, MATTERMOST_URL, MATTERMOST_BOT_TOKEN, or MATTERMOST_CHANNEL_ID");
    return new Response(JSON.stringify({ error: "Not configured" }), { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("sentry-hook-signature") ?? "";

  if (!signature || !(await verifySignature(secret, rawBody, signature))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let body: Record<string, any>;
  try {
    body = JSON.parse(rawBody);
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
