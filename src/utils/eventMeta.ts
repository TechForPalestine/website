import { DEFAULT_EVENT_IMAGE, type EventItem } from "../store/eventsClient";
import { displayTitle } from "./eventSections";
import { getDescriptionExcerpt } from "./eventDescription";

const SITE_ORIGIN = "https://techforpalestine.org";
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/t4p-social-logo.png`;
const DEFAULT_DESCRIPTION = "Join Tech for Palestine for this event.";

export interface EventMeta {
  title: string;
  description: string;
  image: string;
}

// Builds the title/description/image for a shared event link's OG/Twitter
// preview, so pasting a `?event=<id>` URL shows the actual event instead of
// the page's generic "Events" meta.
export function eventMetaTags(event: EventItem): EventMeta {
  const title = `${displayTitle(event)} - Tech for Palestine Events`;
  const description = event.description
    ? getDescriptionExcerpt(event.description) || DEFAULT_DESCRIPTION
    : DEFAULT_DESCRIPTION;

  let image = DEFAULT_OG_IMAGE;
  if (event.image && event.image !== DEFAULT_EVENT_IMAGE) {
    image = event.image.startsWith("http")
      ? event.image
      : new URL(event.image, SITE_ORIGIN).toString();
  }

  return { title, description, image };
}
