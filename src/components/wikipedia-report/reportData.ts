// Collection access for the reader pages. Kept apart from reportNav.ts, which
// stays free of astro:content so it can be unit tested.

import { getCollection } from "astro:content";
import { sortEntries, type ReportEntryMeta } from "./reportNav";

interface CollectionEntryLike {
  id: string;
  data: Omit<ReportEntryMeta, "slug">;
}

/** The navigation fields of an entry. The glob loader uses `slug` as the id. */
export function toEntryMeta(entry: CollectionEntryLike): ReportEntryMeta {
  return {
    slug: entry.id,
    kind: entry.data.kind,
    label: entry.data.label,
    title: entry.data.title,
    order: entry.data.order,
    toc: entry.data.toc,
  };
}

/** Every page of the report, in reading order. */
export async function getReportEntries(): Promise<ReportEntryMeta[]> {
  return sortEntries((await getCollection("wikipediaReport")).map(toEntryMeta));
}
