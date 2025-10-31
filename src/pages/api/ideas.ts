import type { APIRoute } from "astro";
import { fetchNotionIdeas } from "../../store/notionClient.js";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const ideas = await fetchNotionIdeas(locals);

    return new Response(JSON.stringify(ideas), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error fetching ideas:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch ideas" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
