import type { APIRoute } from "astro";

const PLAUSIBLE_SCRIPT = "https://plausible.io/js/pa-gMn1NrWB3uBANu6ua9M8N.js";

export const GET: APIRoute = async () => {
  try {
    const response = await fetch(PLAUSIBLE_SCRIPT);
    if (!response.ok) {
      return new Response("", {
        status: 502,
        headers: { "Content-Type": "text/plain" },
      });
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return new Response("", {
      status: 502,
      headers: { "Content-Type": "text/plain" },
    });
  }
};
