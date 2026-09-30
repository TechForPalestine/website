import type { RichTextSegment } from "./richText";

// Minimal shapes for the parts of the Notion API response this site reads.
// Every property is optional because a database row may lack any column.

export interface NotionFilesProperty {
  files?: Array<
    { type: "external"; external: { url: string } } | { type: "file"; file: { url: string } }
  >;
}

export interface NotionTitleProperty {
  title?: Array<{ plain_text: string }>;
}

export interface NotionRichTextProperty {
  rich_text?: Array<{ plain_text: string }>;
}

export interface NotionUrlProperty {
  url?: string | null;
}

export interface NotionNumberProperty {
  number?: number | null;
}

export interface NotionSelectProperty {
  select?: { name?: string } | null;
}

export interface NotionCheckboxProperty {
  checkbox?: boolean;
}

export interface NotionDateValueProperty {
  date?: { start: string; time_zone?: string | null } | null;
}

export interface NotionRelationProperty {
  relation?: Array<{ id: string }>;
}

/** A page (database row) with its properties keyed by column name. */
export interface NotionPage<P = Record<string, unknown>> {
  id: string;
  properties: P;
}

export interface NotionQueryResponse<P = Record<string, unknown>> {
  results: NotionPage<P>[];
}

/** Row properties read by each fetcher, keyed by the Notion column name. */
export interface FaqProperties {
  Question?: NotionTitleProperty;
  Answer?: { rich_text?: RichTextSegment[] };
  Position?: NotionNumberProperty;
}

export interface IdeaProperties {
  Name?: NotionTitleProperty;
  Category?: NotionSelectProperty;
  Description?: { rich_text?: RichTextSegment[] };
}

export interface AgendaProperties {
  Title?: NotionTitleProperty;
  Description?: NotionRichTextProperty;
  Time?: NotionRichTextProperty;
  Moderator?: NotionRelationProperty;
}

export interface SpeakerProperties {
  Name?: NotionTitleProperty;
  Title?: NotionRichTextProperty;
  "Speaker bio"?: NotionRichTextProperty;
  Photo?: NotionFilesProperty;
}

export interface SignatoryProperties {
  Name?: NotionTitleProperty;
  Company?: NotionRichTextProperty;
  Position?: NotionRichTextProperty;
  "LinkedIn URL"?: NotionUrlProperty;
  "Signed At"?: NotionDateValueProperty;
  Approved?: NotionCheckboxProperty;
}

export interface CommunityCallProperties {
  Date?: NotionDateValueProperty;
  Title?: NotionTitleProperty;
  Description?: { rich_text?: RichTextSegment[] };
  "YouTube URL"?: NotionUrlProperty;
  "YouTube Vertical URL"?: NotionUrlProperty;
  "LinkedIn URL"?: NotionUrlProperty;
  "X URL"?: NotionUrlProperty;
}
