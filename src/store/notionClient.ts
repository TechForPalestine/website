import axios from "axios";
import { getEnv } from "../utils/getEnv.js";
import { sanitizeUrl } from "../components/projects/projectData";

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

interface NotionFilesProperty {
  files?: Array<
    { type: "external"; external: { url: string } } | { type: "file"; file: { url: string } }
  >;
}

interface NotionTitleProperty {
  title?: Array<{ plain_text: string }>;
}

interface NotionRichTextProperty {
  rich_text?: Array<{ plain_text: string }>;
}

function fileUrl(prop: NotionFilesProperty | undefined, fallback: string): string {
  const file = prop?.files?.[0];
  if (!file) return fallback;
  if (file.type === "external") return file.external.url;
  return file.file.url;
}

function titleText(prop: NotionTitleProperty | undefined, fallback = ""): string {
  return prop?.title?.[0]?.plain_text || fallback;
}

function richText(prop: NotionRichTextProperty | undefined, fallback = ""): string {
  return prop?.rich_text?.[0]?.plain_text || fallback;
}

interface NotionDateProperty {
  date?: { start: string; time_zone?: string | null } | null;
}

interface NotionUrlProperty {
  url?: string | null;
}

// Notion returns `start` two different ways depending on whether the date
// property has an explicit time zone override:
//   - no override: the UTC offset is embedded in `start` itself, e.g.
//     "2026-07-22T17:00:00.000-04:00" — Date.parse handles this correctly.
//   - override set: `start` has NO offset ("2026-07-22T17:00:00.000") and
//     the zone lives separately in `time_zone`. Parsing that string with
//     `new Date()` would use the *server's* zone, not the call's — wrong
//     for every visitor outside that zone. Resolve it explicitly instead.
function resolveDateToUtcIso(prop: NotionDateProperty | undefined): string | null {
  const start = prop?.date?.start;
  if (!start) return null;

  // Date-only rows ("2026-07-22", no time component) can't anchor a live
  // window — reject rather than silently defaulting to UTC midnight.
  if (!start.includes("T")) return null;

  const timeZone = prop?.date?.time_zone;
  if (!timeZone) {
    const parsed = new Date(start);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  const [datePart, timePart] = start.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, secondMs] = timePart.split(":");
  const second = Number((secondMs || "0").split(".")[0]);

  // Standard offset-discovery trick: guess the instant is UTC, ask the
  // target time zone what wall-clock time that instant shows, then correct
  // by the difference. Handles arbitrary IANA zones with no dependency.
  const guessUtc = Date.UTC(year, month - 1, day, Number(hour), Number(minute), second);

  let formatted: Intl.DateTimeFormatPart[];
  try {
    formatted = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(new Date(guessUtc));
  } catch {
    return null;
  }

  const part = (type: string) => formatted.find((p) => p.type === type)?.value;
  const asIfUtc = Date.UTC(
    Number(part("year")),
    Number(part("month")) - 1,
    Number(part("day")),
    Number(part("hour")),
    Number(part("minute")),
    Number(part("second"))
  );

  return new Date(guessUtc - (asIfUtc - guessUtc)).toISOString();
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

    const headerImage = fileUrl(props["Header"], "/images/default.jpg");
    const description = richText(props["Description"]);
    const registerLink = props["Link to registration"]?.url || "";
    const recordingLink = props["Link to recording"]?.url || "";

    return {
      id: page.id,
      title: titleText(props["Title"], "Untitled"),
      date: props["Date of event"]?.date?.start || "",
      status: props["Stage"]?.select?.name || "",
      location: props["Type of event"]?.multi_select?.[0]?.name || "",
      image: headerImage,
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

  const headerImage = fileUrl(props["Header"], "/images/default.jpg");
  const description = richText(props["Description"]);
  const registerLink = props["Link to registration"]?.url || "";
  const recordingLink = props["Link to recording"]?.url || "";

  return {
    id: response.data.id,
    title: titleText(props["Title"], "Untitled"),
    date: props["Date of event"]?.date?.start || "",
    status: props["Stage"]?.select?.name || "",
    location: props["Type of event"]?.multi_select?.[0]?.name || "",
    image: headerImage,
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

    const question = titleText(props["Question"]);
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

    const name = titleText(props["Name"]);
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

      const name = titleText(props["Name"]);
      const title = richText(props["Title"]);

      // Concatenate all rich_text blocks for bio
      const bioArray = props["Speaker bio"]?.rich_text || [];
      const bio = bioArray.map((block: any) => block.plain_text).join("");

      const photo = fileUrl(props["Photo"], "/images/default.jpg");

      return {
        id: modId,
        data: {
          id: modId,
          name,
          title,
          bio,
          photo,
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

    const title = titleText(props["Title"]);
    const description = richText(props["Description"]);
    const time = richText(props["Time"]);

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

export const fetchE4PSignatories = async (locals?: any) => {
  const secret = getEnv("NOTION_SECRET", locals);
  const databaseId = getEnv("NOTION_SIGNATORIES_DB_ID", locals);

  if (!secret || !databaseId) {
    throw new Error(
      "Missing Notion credentials: NOTION_SECRET and NOTION_SIGNATORIES_DB_ID are required"
    );
  }

  const notionAxios = createNotionAxios(secret);
  const response = await notionAxios.post(`databases/${databaseId}/query`, {
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

  return response.data.results.map((page: any) => {
    const props = page.properties;

    return {
      id: page.id,
      name: titleText(props["Name"]),
      company: richText(props["Company"]),
      position: richText(props["Position"]),
      linkedinUrl: props["LinkedIn URL"]?.url || "",
      signedAt: props["Signed At"]?.date?.start || "",
      approved: props["Approved"]?.checkbox || false,
    };
  });
};

export interface CommunityCall {
  id: string;
  title: string;
  description: string;
  startUtcIso: string;
  youtubeUrl: string;
  youtubeVerticalUrl: string;
  linkedinUrl: string;
  xUrl: string;
}

function communityCallUrl(prop: NotionUrlProperty | undefined): string {
  return sanitizeUrl(prop?.url || undefined);
}

export const fetchCommunityCalls = async (locals?: any): Promise<CommunityCall[]> => {
  const secret = getEnv("NOTION_SECRET", locals);
  const dbId = getEnv("NOTION_COMMUNITY_CALLS_DB_ID", locals);

  if (!secret || !dbId) {
    throw new Error(
      "Missing Notion credentials: NOTION_SECRET and NOTION_COMMUNITY_CALLS_DB_ID are required"
    );
  }

  const notionAxios = createNotionAxios(secret);
  const response = await notionAxios.post(`databases/${dbId}/query`, {
    filter: {
      property: "Visibility",
      checkbox: {
        equals: true,
      },
    },
  });

  const calls: CommunityCall[] = response.data.results
    .map((page: any) => {
      const props = page.properties;
      const startUtcIso = resolveDateToUtcIso(props["Date"]);
      // A row with no usable start time can't anchor the state machine —
      // drop it rather than let it masquerade as scheduled.
      if (!startUtcIso) return null;

      return {
        id: page.id,
        title: titleText(props["Title"], "Community Call"),
        description: richText(props["Description"]),
        startUtcIso,
        youtubeUrl: communityCallUrl(props["YouTube URL"]),
        youtubeVerticalUrl: communityCallUrl(props["YouTube Vertical URL"]),
        linkedinUrl: communityCallUrl(props["LinkedIn URL"]),
        xUrl: communityCallUrl(props["X URL"]),
      };
    })
    .filter((call: CommunityCall | null): call is CommunityCall => call !== null);

  return calls.sort(
    (a, b) => new Date(b.startUtcIso).getTime() - new Date(a.startUtcIso).getTime()
  );
};
