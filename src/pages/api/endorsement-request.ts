import type { APIRoute } from "astro";
import { Client } from "@notionhq/client";
import { getEnv } from "../../utils/getEnv.js";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    const endorsementData = {
      contactName: body.contactName as string,
      contactEmail: body.contactEmail as string,
      organizationName: body.organizationName as string,
      organizationWebsite: body.organizationWebsite as string,
      campaignName: body.campaignName as string,
      request: body.request as string,
      campaignPurpose: body.campaignPurpose as string,
      campaignLink: body.campaignLink as string,
      notableSupporters: (body.notableSupporters as string) || "",
      isT4PProject: body.isT4PProject as boolean,
      submittedAt: new Date().toISOString(),
    };

    // Validation
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
      return new Response(JSON.stringify({ error: "All required fields must be filled" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

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
        "Contact Name": {
          title: [
            {
              text: {
                content: endorsementData.contactName,
              },
            },
          ],
        },
        "Contact Email": {
          email: endorsementData.contactEmail,
        },
        "Org Name": {
          rich_text: [
            {
              text: {
                content: endorsementData.organizationName,
              },
            },
          ],
        },
        "Org Website": {
          url: endorsementData.organizationWebsite,
        },
        "Campaign Name": {
          rich_text: [
            {
              text: {
                content: endorsementData.campaignName,
              },
            },
          ],
        },
        Request: {
          rich_text: [
            {
              text: {
                content: endorsementData.request,
              },
            },
          ],
        },
        "Campaign Purpose": {
          rich_text: [
            {
              text: {
                content: endorsementData.campaignPurpose,
              },
            },
          ],
        },
        "Campaign Link": {
          url: endorsementData.campaignLink,
        },
        "Notable Supporters": {
          rich_text: [
            {
              text: {
                content: endorsementData.notableSupporters,
              },
            },
          ],
        },
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

    return new Response(
      JSON.stringify({
        success: true,
        message: "Endorsement request submitted successfully",
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("Error processing endorsement request:", error);

    return new Response(JSON.stringify({ error: "Failed to process endorsement request" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};
