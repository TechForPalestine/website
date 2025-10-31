import axios from "axios";
import { getProxiedImageUrl } from "../utils/imageProxy.js";
import { getEnv } from "../utils/getEnv.js";

// Helper function to create Notion axios instance with runtime environment variables
function createNotionAxios(secret: string) {
  return axios.create({
    baseURL: "https://api.notion.com/v1/",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
  });
}

export const fetchNotionEvents = async (showAll: boolean = false, locals?: any) => {
  const secret = getEnv("NOTION_SECRET", locals);
  const dbId = getEnv("NOTION_DB_ID", locals);

  if (!secret || !dbId) {
    throw new Error("Missing Notion credentials: NOTION_SECRET and NOTION_DB_ID are required");
  }

  const notionAxios = createNotionAxios(secret);
  const filter = showAll
    ? {}
    : {
        filter: {
          property: "Visibility",
          checkbox: {
            equals: true,
          },
        },
      };

  const response = await notionAxios.post(`databases/${dbId}/query`, filter);

  const events = response.data.results.map((page: any) => {
    const props = page.properties;

    let headerImage = "";
    if (props["Header"]?.files?.length > 0) {
      const file = props["Header"].files[0];
      console.log("Event header file found:", {
        eventTitle: props["Title"]?.title?.[0]?.plain_text,
        fileType: file.type,
        file,
      });
      if (file.type === "external") {
        headerImage = file.external.url;
        console.log("Using external URL:", headerImage);
      } else if (file.type === "file") {
        // Create hash from URL to detect when file changes
        const base64 = (globalThis as any).Buffer
          ? (globalThis as any).Buffer.from(file.file.url).toString("base64")
          : btoa(file.file.url);
        const urlHash = base64.slice(0, 8);
        const timestamp = Date.now();

        // Add cache busting parameter with both hash and timestamp
        const baseProxyUrl = getProxiedImageUrl(file.file.url);
        headerImage = `${baseProxyUrl}?cb=${timestamp}&hash=${urlHash}`;
        console.log("Using proxied URL with aggressive cache bust:", {
          original: file.file.url,
          proxied: headerImage,
          urlHash,
          timestamp: new Date(timestamp).toISOString(),
        });
      }
    } else {
      console.log("No header image found for event:", props["Title"]?.title?.[0]?.plain_text);
    }

    const description = props["Description"]?.rich_text?.[0]?.plain_text || "";

    const registerLink = props["Link to registration"]?.url || "";
    const recordingLink = props["Link to recording"]?.url || "";

    return {
      id: page.id,
      title: props["Title"]?.title?.[0]?.plain_text || "Untitled",
      date: props["Date of event"]?.date?.start || "",
      status: props["Stage"]?.select?.name || "",
      location: props["Type of event"]?.multi_select?.[0]?.name || "",
      image: headerImage || "/images/default.jpg",
      link: page.url,
      description,
      registerLink,
      recordingLink,
    };
  });

  // Sort by date (descending)
  return events.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const fetchNotionEventById = async (pageId: string, locals?: any) => {
  const secret = getEnv("NOTION_SECRET", locals);

  if (!secret) {
    throw new Error("Missing Notion credentials: NOTION_SECRET is required");
  }

  const notionAxios = createNotionAxios(secret);
  const response = await notionAxios.get(`pages/${pageId}`);

  const props = response.data.properties;

  // Image from "Header" files property
  let headerImage = "";
  if (props["Header"]?.files?.length > 0) {
    const file = props["Header"].files[0];
    if (file.type === "external") {
      headerImage = file.external.url;
    } else if (file.type === "file") {
      // Create hash from URL to detect when file changes
      const base64 = (globalThis as any).Buffer
        ? (globalThis as any).Buffer.from(file.file.url).toString("base64")
        : btoa(file.file.url);
      const urlHash = base64.slice(0, 8);
      const timestamp = Date.now();

      // Add cache busting parameter with both hash and timestamp
      const baseProxyUrl = getProxiedImageUrl(file.file.url);
      headerImage = `${baseProxyUrl}?cb=${timestamp}&hash=${urlHash}`;
    }
  }

  const description = props["Description"]?.rich_text?.[0]?.plain_text || "";
  const registerLink = props["Link to registration"]?.url || "";
  const recordingLink = props["Link to recording"]?.url || "";

  return {
    id: response.data.id,
    title: props["Title"]?.title?.[0]?.plain_text || "Untitled",
    date: props["Date of event"]?.date?.start || "",
    status: props["Stage"]?.select?.name || "",
    location: props["Type of event"]?.multi_select?.[0]?.name || "",
    image: headerImage || "/images/default.jpg",
    link: response.data.url,
    description,
    registerLink,
    recordingLink,
  };
};

export const fetchNotionFAQ = async (showAll: boolean = false, locals?: any) => {
  const secret = getEnv("NOTION_SECRET", locals);
  const faqDbId = getEnv("NOTION_FAQ_DB_ID", locals);

  if (!secret || !faqDbId) {
    throw new Error("Missing Notion credentials: NOTION_SECRET and NOTION_FAQ_DB_ID are required");
  }

  const notionAxios = createNotionAxios(secret);
  const queryBody = {
    ...(showAll
      ? {}
      : {
          filter: {
            property: "Visibility",
            checkbox: {
              equals: true,
            },
          },
        }),
  };

  const response = await notionAxios.post(`databases/${faqDbId}/query`, queryBody);

  const faqs = response.data.results.map((page: any) => {
    const props = page.properties;

    const question = props["Question"]?.title?.[0]?.plain_text || "";
    const answer = props["Answer"]?.rich_text || [];
    const position = props["Position"]?.number ?? 999999; // Default to high number if no position

    return {
      id: page.id,
      question,
      answer,
      position,
    };
  });

  // Sort by position ascending
  return faqs.sort((a: any, b: any) => a.position - b.position);
};

export const fetchNotionIdeas = async (locals?: any) => {
  const secret = getEnv("NOTION_SECRET", locals);
  const ideasDbId = getEnv("NOTION_IDEAS_DB_ID", locals);

  if (!secret || !ideasDbId) {
    throw new Error(
      "Missing Notion credentials: NOTION_SECRET and NOTION_IDEAS_DB_ID are required"
    );
  }

  const notionAxios = createNotionAxios(secret);
  const queryBody = {
    sorts: [
      {
        property: "Name",
        direction: "ascending",
      },
    ],
  };

  const response = await notionAxios.post(`databases/${ideasDbId}/query`, queryBody);

  const ideas = response.data.results.map((page: any) => {
    const props = page.properties;

    const name = props["Name"]?.title?.[0]?.plain_text || "";
    const category = props["Category"]?.select?.name || "";
    const description = props["Description"]?.rich_text || [];

    return {
      id: page.id,
      name,
      category,
      description,
    };
  });

  return ideas;
};

export const fetchNotionAgenda = async (locals?: any) => {
  const secret = getEnv("NOTION_SECRET", locals);
  const agendaDbId = getEnv("NOTION_AGENDA_DB_ID", locals);

  if (!secret || !agendaDbId) {
    throw new Error(
      "Missing Notion credentials: NOTION_SECRET and NOTION_AGENDA_DB_ID are required"
    );
  }

  const notionAxios = createNotionAxios(secret);
  const response = await notionAxios.post(`databases/${agendaDbId}/query`, {});

  // Collect all unique moderator IDs
  const moderatorIds = new Set<string>();
  response.data.results.forEach((page: any) => {
    const moderators = page.properties["Moderator"]?.relation || [];
    moderators.forEach((mod: any) => moderatorIds.add(mod.id));
  });

  // Fetch all moderator/speaker pages in parallel for better performance
  const speakerMap = new Map();
  const speakerPromises = Array.from(moderatorIds).map(async (modId) => {
    try {
      const speakerResponse = await notionAxios.get(`pages/${modId}`);
      const props = speakerResponse.data.properties;

      const name = props["Name"]?.title?.[0]?.plain_text || "";
      const title = props["Title"]?.rich_text?.[0]?.plain_text || "";

      // Concatenate all rich_text blocks for bio
      const bioArray = props["Speaker bio"]?.rich_text || [];
      const bio = bioArray.map((block: any) => block.plain_text).join("");

      // Get photo from files property
      let photo = "";
      if (props["Photo"]?.files?.length > 0) {
        const file = props["Photo"].files[0];
        if (file.type === "external") {
          photo = file.external.url;
        } else if (file.type === "file") {
          photo = getProxiedImageUrl(file.file.url);
        }
      }

      return {
        id: modId,
        data: {
          id: modId,
          name,
          title,
          bio,
          photo: photo || "/images/default.jpg",
        },
      };
    } catch (error) {
      console.error(`Error fetching speaker ${modId}:`, error);
      return null;
    }
  });

  const speakerResults = await Promise.all(speakerPromises);
  speakerResults.forEach((result) => {
    if (result) {
      speakerMap.set(result.id, result.data);
    }
  });

  // Map agenda items with resolved speaker data
  const agendaItems = response.data.results.map((page: any) => {
    const props = page.properties;

    const title = props["Title"]?.title?.[0]?.plain_text || "";
    const description = props["Description"]?.rich_text?.[0]?.plain_text || "";
    const time = props["Time"]?.rich_text?.[0]?.plain_text || "";

    const moderatorRelations = props["Moderator"]?.relation || [];
    const moderator =
      moderatorRelations.length > 0 ? speakerMap.get(moderatorRelations[0].id) : null;

    return {
      id: page.id,
      title,
      description,
      time,
      moderator,
    };
  });

  // Return both agenda items and unique speakers (sorted alphabetically by name)
  const speakers = Array.from(speakerMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  return {
    agendaItems,
    speakers,
  };
};
