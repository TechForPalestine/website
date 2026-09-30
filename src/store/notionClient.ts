import axios from "axios";
import { getEnv } from "../utils/getEnv.js";
import { sanitizeUrl } from "../utils/sanitizeUrl";
import { resolveDateToUtcIso } from "../utils/icalDate";
import type { RichTextSegment } from "../types/richText";
import type {
  AgendaProperties,
  CommunityCallProperties,
  FaqProperties,
  IdeaProperties,
  NotionFilesProperty,
  NotionPage,
  NotionQueryResponse,
  NotionRichTextProperty,
  NotionTitleProperty,
  NotionUrlProperty,
  SignatoryProperties,
  SpeakerProperties,
} from "../types/notion";

// Server-side Notion client (FAQ, ideas, agenda/speakers, E4P signatories,
// community calls). Cache policy: none here, every call queries Notion.
// Timeout: none set (axios default, i.e. none). Failure: missing credentials
// throw a "Missing Notion credentials" Error; an API failure propagates the
// axios error to the caller (the API routes turn it into a generic response).
// Only a failed speaker lookup in fetchNotionAgenda is swallowed (logged, and
// that speaker is dropped).
//
// Pagination: a Notion query returns at most 100 rows and none of these
// fetchers follow `next_cursor`, so databases are capped at 100 rows. This is
// a known limitation, deliberately left as is.

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

type NotionAxios = ReturnType<typeof createNotionAxios>;

// Resolves credentials, then queries one database. `dbEnvName` is the env var
// holding the database id and is named in the missing-credentials error.
async function queryDatabase<P>(
  locals: App.Locals | undefined,
  dbEnvName: string,
  body: Record<string, unknown>
): Promise<{ notionAxios: NotionAxios; results: NotionQueryResponse<P>["results"] }> {
  const secret = getEnv("NOTION_SECRET", locals);
  const dbId = getEnv(dbEnvName, locals);

  if (!secret || !dbId) {
    throw new Error(`Missing Notion credentials: NOTION_SECRET and ${dbEnvName} are required`);
  }

  const notionAxios = createNotionAxios(secret);
  const response = await notionAxios.post<NotionQueryResponse<P>>(`databases/${dbId}/query`, body);
  return { notionAxios, results: response.data.results };
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

export interface FaqItem {
  id: string;
  question: string;
  answer: RichTextSegment[];
  position: number;
}

export const fetchNotionFAQ = async (
  showAll: boolean = false,
  locals?: App.Locals
): Promise<FaqItem[]> => {
  const queryBody = showAll
    ? {}
    : {
        filter: {
          property: "Visibility",
          checkbox: {
            equals: true,
          },
        },
      };

  const { results } = await queryDatabase<FaqProperties>(locals, "NOTION_FAQ_DB_ID", queryBody);

  const faqs = results.map((page) => {
    const props = page.properties;

    return {
      id: page.id,
      question: titleText(props["Question"]),
      answer: props["Answer"]?.rich_text || [],
      position: props["Position"]?.number ?? 999999, // Default to high number if no position
    };
  });

  // Sort by position ascending
  return faqs.sort((a, b) => a.position - b.position);
};

export interface IdeaItem {
  id: string;
  name: string;
  category: string;
  description: RichTextSegment[];
}

export const fetchNotionIdeas = async (locals?: App.Locals): Promise<IdeaItem[]> => {
  const { results } = await queryDatabase<IdeaProperties>(locals, "NOTION_IDEAS_DB_ID", {
    sorts: [
      {
        property: "Name",
        direction: "ascending",
      },
    ],
  });

  return results.map((page) => {
    const props = page.properties;

    return {
      id: page.id,
      name: titleText(props["Name"]),
      category: props["Category"]?.select?.name || "",
      description: props["Description"]?.rich_text || [],
    };
  });
};

export interface AgendaSpeaker {
  id: string;
  name: string;
  title: string;
  bio: string;
  photo: string;
}

export interface AgendaItem {
  id: string;
  title: string;
  description: string;
  time: string;
  // undefined when the moderator's page failed to load (speaker dropped)
  moderator: AgendaSpeaker | null | undefined;
}

export interface AgendaResult {
  agendaItems: AgendaItem[];
  speakers: AgendaSpeaker[];
}

export const fetchNotionAgenda = async (locals?: App.Locals): Promise<AgendaResult> => {
  const { notionAxios, results } = await queryDatabase<AgendaProperties>(
    locals,
    "NOTION_AGENDA_DB_ID",
    {}
  );

  // Collect all unique moderator IDs
  const moderatorIds = new Set<string>();
  results.forEach((page) => {
    const moderators = page.properties["Moderator"]?.relation || [];
    moderators.forEach((mod) => moderatorIds.add(mod.id));
  });

  // Fetch all moderator/speaker pages in parallel for better performance
  const speakerMap = new Map<string, AgendaSpeaker>();
  const speakerPromises = Array.from(moderatorIds).map(async (modId) => {
    try {
      const speakerResponse = await notionAxios.get<NotionPage<SpeakerProperties>>(
        `pages/${modId}`
      );
      const props = speakerResponse.data.properties;

      // Concatenate all rich_text blocks for bio
      const bioArray = props["Speaker bio"]?.rich_text || [];

      const data: AgendaSpeaker = {
        id: modId,
        name: titleText(props["Name"]),
        title: richText(props["Title"]),
        bio: bioArray.map((block) => block.plain_text).join(""),
        photo: fileUrl(props["Photo"], "/images/default.jpg"),
      };
      return { id: modId, data };
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
  const agendaItems = results.map((page): AgendaItem => {
    const props = page.properties;

    const moderatorRelations = props["Moderator"]?.relation || [];
    const moderator =
      moderatorRelations.length > 0 ? speakerMap.get(moderatorRelations[0].id) : null;

    return {
      id: page.id,
      title: titleText(props["Title"]),
      description: richText(props["Description"]),
      time: richText(props["Time"]),
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

export interface E4PSignatory {
  id: string;
  name: string;
  company: string;
  position: string;
  linkedinUrl: string;
  signedAt: string;
  approved: boolean;
}

export const fetchE4PSignatories = async (locals?: App.Locals): Promise<E4PSignatory[]> => {
  const { results } = await queryDatabase<SignatoryProperties>(locals, "NOTION_SIGNATORIES_DB_ID", {
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

  return results.map((page) => {
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
  descriptionRichText: RichTextSegment[];
  startUtcIso: string;
  youtubeUrl: string;
  youtubeVerticalUrl: string;
  linkedinUrl: string;
  xUrl: string;
}

function communityCallUrl(prop: NotionUrlProperty | undefined): string {
  return sanitizeUrl(prop?.url || undefined);
}

export const fetchCommunityCalls = async (locals?: App.Locals): Promise<CommunityCall[]> => {
  const { results } = await queryDatabase<CommunityCallProperties>(
    locals,
    "NOTION_COMMUNITY_CALLS_DB_ID",
    {
      filter: {
        property: "Visibility",
        checkbox: {
          equals: true,
        },
      },
    }
  );

  const calls = results
    .map((page): CommunityCall | null => {
      const props = page.properties;
      const startUtcIso = resolveDateToUtcIso(props["Date"]);
      // A row with no usable start time can't anchor the state machine —
      // drop it rather than let it masquerade as scheduled.
      if (!startUtcIso) return null;

      const descriptionRichText: RichTextSegment[] = props["Description"]?.rich_text || [];

      return {
        id: page.id,
        title: titleText(props["Title"], "Community Call"),
        description: descriptionRichText.map((segment) => segment.plain_text).join(""),
        descriptionRichText,
        startUtcIso,
        youtubeUrl: communityCallUrl(props["YouTube URL"]),
        youtubeVerticalUrl: communityCallUrl(props["YouTube Vertical URL"]),
        linkedinUrl: communityCallUrl(props["LinkedIn URL"]),
        xUrl: communityCallUrl(props["X URL"]),
      };
    })
    .filter((call): call is CommunityCall => call !== null);

  return calls.sort(
    (a, b) => new Date(b.startUtcIso).getTime() - new Date(a.startUtcIso).getTime()
  );
};
