export const prerender = false;

export async function POST({ request, locals }: { request: Request; locals: App.Locals }) {
  const runtime = (locals as { runtime?: { env?: Record<string, string> } }).runtime?.env;
  const hubApiUrl = runtime?.HUB_API_URL ?? import.meta.env.HUB_API_URL;
  const hubApiKey = runtime?.HUB_API_KEY ?? import.meta.env.HUB_API_KEY;
  const inviteSecret = runtime?.MEMBERSHIP_INVITE_SECRET ?? import.meta.env.MEMBERSHIP_INVITE_SECRET;

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!inviteSecret || !token || token !== inviteSecret) {
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
