import type { APIRoute } from "astro";
import * as Sentry from "@sentry/astro";
import { Client } from "@notionhq/client";
import { getEnv } from "../../utils/getEnv.js";
import { reportError } from "../../lib/report-error";
import { corsHeaders, withOriginGuard } from "../../utils/origin";
import { jsonError, jsonResponse } from "../../utils/apiResponse";
import { firstTooLong, isEmail, isParsableUrl, readString } from "../../utils/validate";
import { emailProp, richTextProp, titleProp, urlProp } from "../../utils/notionProps";

export const prerender = false;

export const POST: APIRoute = withOriginGuard({}, async ({ request, locals }, origin) => {
  const ctx = locals.runtime?.ctx;
  const acao = { "Access-Control-Allow-Origin": origin };
  const badRequest = (message: string) => jsonError(400, message, { headers: acao });

  try {
    const formData = await request.formData();

    // File uploads and other non-string entries count as missing.
    const pledgeData = {
      name: readString(formData.get("name")),
      email: readString(formData.get("email")),
      company: readString(formData.get("company")),
      position: readString(formData.get("position")),
      linkedin: readString(formData.get("linkedin")),
      agreement: formData.get("agreement") === "on",
    };

    if (
      !pledgeData.name ||
      !pledgeData.email ||
      !pledgeData.company ||
      !pledgeData.position ||
      !pledgeData.linkedin ||
      !pledgeData.agreement
    ) {
      return badRequest("All fields are required and agreement must be checked");
    }

    if (!isEmail(pledgeData.email)) return badRequest("Invalid email address");
    if (!isParsableUrl(pledgeData.linkedin)) return badRequest("Invalid LinkedIn URL");

    const tooLong = firstTooLong({
      name: pledgeData.name,
      company: pledgeData.company,
      position: pledgeData.position,
    });
    if (tooLong) return badRequest(tooLong);

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
        Name: titleProp(pledgeData.name),
        Email: emailProp(pledgeData.email),
        Company: richTextProp(pledgeData.company),
        Position: richTextProp(pledgeData.position),
        "LinkedIn URL": urlProp(pledgeData.linkedin),
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

    return jsonResponse(
      { success: true, message: "Pledge signed successfully", signatory },
      201,
      corsHeaders(origin, "POST")
    );
  } catch (error) {
    reportError(error, { context: "e4p-pledge-sign" });
    ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));

    return jsonError(500, "Failed to process pledge", { headers: acao });
  }
});
