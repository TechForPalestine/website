import type { APIRoute } from "astro";
import * as Sentry from "@sentry/astro";
import { fetchNotionFAQ } from "../../store/notionClient";
import { reportError } from "../../lib/report-error";

export const prerender = false;
export const GET: APIRoute = async ({ request, locals }) => {
  const ctx = locals.runtime?.ctx;
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
    reportError(error, { context: "faq" });
    ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));

    return new Response(JSON.stringify([]), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
