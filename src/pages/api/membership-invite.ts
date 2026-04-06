import { constantTimeEqual } from "../../utils/crypto";
import { getEnv } from "../../utils/getEnv";

export const prerender = false;

export async function POST({ request, locals }: { request: Request; locals: App.Locals }) {
  const hubApiUrl = getEnv("HUB_API_URL", locals);
  const hubApiKey = getEnv("HUB_API_KEY", locals);
  const inviteSecret = getEnv("MEMBERSHIP_INVITE_SECRET", locals);

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!inviteSecret || !token || !constantTimeEqual(token, inviteSecret)) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!hubApiUrl || !hubApiKey) {
    return new Response(JSON.stringify({ message: "Hub API not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ message: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const upstream = await fetch(`${hubApiUrl}/api/auth/invite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${hubApiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await upstream.json();
  return new Response(JSON.stringify(data), {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
