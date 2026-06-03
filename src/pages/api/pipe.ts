import type { APIRoute } from "astro";

const ALLOWED_ORIGIN = "https://techforpalestine.org";

export const POST: APIRoute = async ({ request }) => {
  const origin = request.headers.get("origin");
  if (origin && origin !== ALLOWED_ORIGIN) {
    return new Response("Forbidden", { status: 403 });
  }

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }
  const userAgent = request.headers.get("user-agent");
  if (userAgent) {
    headers.set("user-agent", userAgent);
  }

  const forwardedFor = request.headers.get("cf-connecting-ip");
  if (forwardedFor) {
    headers.set("x-forwarded-for", forwardedFor);
  }

  const body = await request.text();

  try {
    const response = await fetch("https://plausible.io/api/event", {
      method: "POST",
      headers,
      body,
    });

    return new Response(response.body, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "text/plain" },
    });
  } catch {
    return new Response("", { status: 202 });
  }
};
