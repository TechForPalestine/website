export const prerender = false;

export async function POST({ request }: { request: Request }) {
  const hubApiUrl = import.meta.env.HUB_API_URL;
  const hubApiKey = import.meta.env.HUB_API_KEY;

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
