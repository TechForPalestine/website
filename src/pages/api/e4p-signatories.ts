import type { APIRoute } from "astro";
import * as Sentry from "@sentry/astro";
import { Client } from "@notionhq/client";
import { getEnv } from "../../utils/getEnv.js";
import { reportError } from "../../lib/report-error";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const ctx = locals.runtime?.ctx;
  try {
    const notionSecret = getEnv("NOTION_SECRET", locals);
    const databaseId = getEnv("NOTION_SIGNATORIES_DB_ID", locals);

    const notion = new Client({
      auth: notionSecret,
    });

    if (!databaseId) {
      throw new Error("NOTION_SIGNATORIES_DB_ID not configured");
    }

    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "Approved",
        checkbox: {
          equals: true,
        },
      },
      sorts: [
        {
          property: "Signed At",
          direction: "ascending",
        },
      ],
    });

    const signatories = response.results.map((page: any) => {
      const props = page.properties;

      return {
        id: page.id,
        name: props.Name?.title?.[0]?.text?.content || "",
        company: props.Company?.rich_text?.[0]?.text?.content || "",
        position: props.Position?.rich_text?.[0]?.text?.content || "",
        linkedinUrl: props["LinkedIn URL"]?.url || "",
        signedAt: props["Signed At"]?.date?.start || "",
        approved: props.Approved?.checkbox || false,
      };
    });

    return new Response(JSON.stringify(signatories), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    reportError(error, { context: "e4p-signatories" });
    ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));

    return new Response(JSON.stringify({ error: "Failed to fetch signatories" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};
