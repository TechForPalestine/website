import type { APIRoute } from "astro";
import * as Sentry from "@sentry/astro";
import { Client } from "@notionhq/client";
import { getEnv } from "../../utils/getEnv.js";
import { reportError } from "../../lib/report-error";
import { isAllowedOrigin, corsHeaders } from "../../utils/origin";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const ctx = locals.runtime?.ctx;
  const origin = request.headers.get("Origin");
  if (!isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await request.formData();

    const pledgeData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      company: formData.get("company") as string,
      position: formData.get("position") as string,
      linkedin: formData.get("linkedin") as string,
      agreement: formData.get("agreement") === "on",
      submittedAt: new Date().toISOString(),
    };

    if (
      !pledgeData.name ||
      !pledgeData.email ||
      !pledgeData.company ||
      !pledgeData.position ||
      !pledgeData.linkedin ||
      !pledgeData.agreement
    ) {
      return new Response(
        JSON.stringify({ error: "All fields are required and agreement must be checked" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin,
          },
        }
      );
    }

    // Validation — format and length
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(pledgeData.email)) {
      return new Response(JSON.stringify({ error: "Invalid email address" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin },
      });
    }

    try {
      new URL(pledgeData.linkedin);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid LinkedIn URL" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin },
      });
    }

    const MAX = 2000;
    const textFields: [string, string][] = [
      ["name", pledgeData.name],
      ["company", pledgeData.company],
      ["position", pledgeData.position],
    ];
    for (const [field, value] of textFields) {
      if (value.length > MAX) {
        return new Response(
          JSON.stringify({ error: `Field '${field}' exceeds maximum length of ${MAX} characters` }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin },
          }
        );
      }
    }

    const notionSecret = getEnv("NOTION_SECRET", locals);
    const databaseId = getEnv("NOTION_SIGNATORIES_DB_ID", locals);

    const notion = new Client({
      auth: notionSecret,
    });

    if (!databaseId) {
      throw new Error("NOTION_SIGNATORIES_DB_ID not configured");
    }

    const response = await notion.pages.create({
      parent: {
        database_id: databaseId,
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: pledgeData.name,
              },
            },
          ],
        },
        Email: {
          email: pledgeData.email,
        },
        Company: {
          rich_text: [
            {
              text: {
                content: pledgeData.company,
              },
            },
          ],
        },
        Position: {
          rich_text: [
            {
              text: {
                content: pledgeData.position,
              },
            },
          ],
        },
        "LinkedIn URL": {
          url: pledgeData.linkedin,
        },
        Approved: {
          checkbox: false,
        },
        "Signed At": {
          date: {
            start: new Date().toISOString(),
          },
        },
      },
    });

    const signatory = {
      id: response.id,
      url: `https://notion.so/${response.id.replace(/-/g, "")}`,
      name: pledgeData.name,
      company: pledgeData.company,
      position: pledgeData.position,
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: "Pledge signed successfully",
        signatory,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin, "POST") },
      }
    );
  } catch (error) {
    reportError(error, { context: "e4p-pledge-sign" });
    ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));

    return new Response(JSON.stringify({ error: "Failed to process pledge" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin,
      },
    });
  }
};
