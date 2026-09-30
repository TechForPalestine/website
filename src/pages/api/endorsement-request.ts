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
    const body = await request.json();

    // Non-string JSON values are treated as missing (400) instead of being
    // forwarded to Notion, which used to answer 500 for them.
    const endorsementData = {
      contactName: readString(body.contactName),
      contactEmail: readString(body.contactEmail),
      organizationName: readString(body.organizationName),
      organizationWebsite: readString(body.organizationWebsite),
      campaignName: readString(body.campaignName),
      request: readString(body.request),
      campaignPurpose: readString(body.campaignPurpose),
      campaignLink: readString(body.campaignLink),
      notableSupporters: readString(body.notableSupporters),
      isT4PProject: body.isT4PProject as boolean,
    };

    if (
      !endorsementData.contactName ||
      !endorsementData.contactEmail ||
      !endorsementData.organizationName ||
      !endorsementData.organizationWebsite ||
      !endorsementData.campaignName ||
      !endorsementData.request ||
      !endorsementData.campaignPurpose ||
      !endorsementData.campaignLink
    ) {
      return badRequest("All required fields must be filled");
    }

    if (!isEmail(endorsementData.contactEmail)) return badRequest("Invalid email address");
    if (!isParsableUrl(endorsementData.organizationWebsite)) {
      return badRequest("Invalid organization website URL");
    }
    if (!isParsableUrl(endorsementData.campaignLink)) {
      return badRequest("Invalid campaign link URL");
    }

    const tooLong = firstTooLong({
      contactName: endorsementData.contactName,
      organizationName: endorsementData.organizationName,
      campaignName: endorsementData.campaignName,
      request: endorsementData.request,
      campaignPurpose: endorsementData.campaignPurpose,
      notableSupporters: endorsementData.notableSupporters,
    });
    if (tooLong) return badRequest(tooLong);

    const notionSecret = getEnv("NOTION_SECRET", locals);
    const databaseId = getEnv("NOTION_ENDORSEMENTS_DB_ID", locals);

    const notion = new Client({
      auth: notionSecret,
    });

    if (!databaseId) {
      throw new Error("NOTION_ENDORSEMENTS_DB_ID not configured");
    }

    await notion.pages.create({
      parent: {
        database_id: databaseId,
      },
      properties: {
        "Contact Name": titleProp(endorsementData.contactName),
        "Contact Email": emailProp(endorsementData.contactEmail),
        "Org Name": richTextProp(endorsementData.organizationName),
        "Org Website": urlProp(endorsementData.organizationWebsite),
        "Campaign Name": richTextProp(endorsementData.campaignName),
        Request: richTextProp(endorsementData.request),
        "Campaign Purpose": richTextProp(endorsementData.campaignPurpose),
        "Campaign Link": urlProp(endorsementData.campaignLink),
        "Notable Supporters": richTextProp(endorsementData.notableSupporters),
        "Is T4P Project": {
          checkbox: endorsementData.isT4PProject,
        },
        "Submitted At": {
          date: {
            start: new Date().toISOString(),
          },
        },
      },
    });

    return jsonResponse(
      { success: true, message: "Endorsement request submitted successfully" },
      201,
      corsHeaders(origin, "POST")
    );
  } catch (error) {
    reportError(error, { context: "endorsement-request" });
    ctx?.waitUntil(Promise.resolve(Sentry.flush(2000)));

    return jsonError(500, "Failed to process endorsement request", { headers: acao });
  }
});
