import type { APIRoute } from "astro";
import { fetchNotionFAQ } from "../../store/notionClient";

export const prerender = false;
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const showAll = url.searchParams.get("showAll") === "yes";

    const faqs = await fetchNotionFAQ(showAll, locals);

    return new Response(JSON.stringify(faqs), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return new Response(JSON.stringify([]), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
