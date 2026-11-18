// Collection access for the guide pages. Kept apart from guideNav.ts, which
// stays free of astro:content so it can be unit tested.

import { getCollection } from "astro:content";
import { sortChapters, type GuideChapter } from "./guideNav";

/** Every playbook chapter, in reading order. The glob loader uses the file name as the id. */
export async function getGuideChapters(): Promise<GuideChapter[]> {
  const entries = await getCollection("incubatorGuide");
  return sortChapters(entries.map((e) => ({ slug: e.id, ...e.data })));
}
