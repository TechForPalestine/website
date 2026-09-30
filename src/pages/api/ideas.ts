import type { APIRoute } from "astro";
import { fetchNotionIdeas } from "../../store/notionClient.js";
import { reportAndFlush } from "../../lib/report-error";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const ideas = await fetchNotionIdeas(locals);

    return new Response(JSON.stringify(ideas), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    reportAndFlush(error, { context: "ideas" }, locals);

    return new Response(JSON.stringify({ error: "Failed to fetch ideas" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
