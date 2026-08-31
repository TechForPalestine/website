import { useContext, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogActions } from "@mui/material";
import { hasMeaningfulDescription, primaryEventLink, type EventItem } from "../store/eventsClient";
import {
  displayTitle,
  getUpcomingEvents,
  groupIntoSections,
  isEventPast,
  type EventSection,
  type UpcomingEvent,
} from "../utils/eventSections";
import { copyAnchorLink, copyEventLink, clearEventLinkParam } from "../utils/copyAnchorLink";
import {
  formatSpeakerList,
  getDescriptionExcerpt,
  getEventSpeakers,
  parseEventDescription,
  renderInlineText,
} from "../utils/eventDescription";
import { EventPreviewImage } from "./events/EventPreviewImage";
import {
  ArrowRight,
  ChevronDown,
  CloseIcon,
  EventModalContext,
  ShareIcon,
  useCarouselScroll,
  useEventDate,
  type SelectedEvent,
} from "./events/eventsShared";

const UPCOMING_WINDOW_DAYS = 60;
const COPIED_FEEDBACK_MS = 1500;

// Font sizes only (not family/weight/color) matched to /events-new's type
// scale in src/styles/design-system.css, stepped at the same 390/810/1200
// breakpoints. Each constant is named after the .ts-* role it mirrors.
const TS_EDITORIAL_SIZE =
  "text-[36px] leading-[1.18] min-[810px]:text-[42px] min-[1200px]:text-[48px]"; // section headings
const TS_HEADING_SIZE =
  "text-[32px] leading-[1.22] min-[810px]:text-[36px] min-[1200px]:text-[38px]"; // day-of-month numerals
const TS_SUBHEADING_SIZE =
  "text-[28px] leading-[1.22] min-[810px]:text-[30px] min-[1200px]:text-[32px]"; // event titles
const TS_EYEBROW_SIZE =
  "text-[18px] leading-[1.32] min-[810px]:text-[19px] min-[1200px]:text-[24px]"; // description sub-headings
const TS_BODY_LARGE_SIZE = "text-[18px] leading-[1.48] min-[810px]:text-[20px]"; // empty-state message
const TS_BODY_SIZE = "text-[16px] leading-[1.22] min-[810px]:text-[18px]"; // category subtitle, description paragraphs
const TS_LABEL_SIZE = "text-[16px] leading-[1] min-[810px]:text-[18px]"; // button labels, past-card titles
const TS_BODY_SMALL_SIZE = "text-[14px] leading-[1.22] min-[810px]:text-[16px]"; // event time/date supporting text
const TS_CAPTION_SIZE = "text-[14px] leading-[1]"; // category chip pill
const TS_OVERLINE_SIZE = "text-[12px]"; // weekday/month labels — already matches text-xs

// This page's own accent palette — same structure/content as the new-design
// events page, deliberately kept on this site's original colors rather than
// the new page's cream/rose design tokens. MUI is retained only for the
// modal Dialog (focus trap, escape handling, scroll lock); everything else
// is plain markup so the page shares the site's font and visual weight.
//
// Colors are expressed as Tailwind arbitrary values so they stay literal:
// red #EA4335 (accent), #C5341F (hover), green #168039 (past-card links).
const PRIMARY_BUTTON_CLASSES = `inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#EA4335] px-6 py-2.5 font-medium text-white transition-colors duration-150 hover:bg-[#C5341F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4335] active:scale-[0.98] ${TS_LABEL_SIZE}`;

const CAROUSEL_ARROW_CLASSES =
  "absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-gray-100 text-gray-700 shadow-sm transition-colors duration-150 hover:bg-[#EA4335] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4335] sm:flex";

interface EventsProps {
  events: EventItem[];
  loading?: boolean;
}

// A hashtag-style permalink button next to a category heading, so a specific
// section (e.g. Book Club) can be shared directly instead of the whole page.
// Mirrors the same feature on /events-new.
function CategoryAnchorButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    const ok = await copyAnchorLink(slug);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  };

  return (
    <span className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={handleClick}
        aria-label="Copy link to this section"
        className={`inline-flex h-11 w-11 items-center justify-center font-bold text-gray-400 transition-colors duration-150 hover:text-[#EA4335] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4335] ${TS_EDITORIAL_SIZE}`}
      >
        #
      </button>
      {copied && (
        <span
          role="status"
          className={`absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gray-900 px-3 py-1 text-white ${TS_CAPTION_SIZE}`}
        >
          Copied!
        </span>
      )}
    </span>
  );
}

function EventDescription({ text }: { text: string }) {
  const blocks = parseEventDescription(text);

  return (
    <div className="flex flex-col gap-3 break-words">
      {blocks.map((block, i) => {
        if (block.type === "hr") {
          return <hr key={i} className="border-gray-200" />;
        }
        if (block.type === "heading") {
          return (
            <p key={i} className={`font-bold text-gray-900 ${TS_EYEBROW_SIZE}`}>
              {renderInlineText(block.text, `h-${i}`)}
            </p>
          );
        }
        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={i}
              className={`${block.ordered ? "list-decimal pl-5" : "list-disc pl-5"} ${TS_BODY_SIZE}`}
            >
              {block.items.map((item, j) => (
                <li key={j} className="text-gray-600">
                  {renderInlineText(item, `l-${i}-${j}`)}
                </li>
              ))}
            </ListTag>
          );
        }
        return (
          <p key={i} className={`text-gray-600 ${TS_BODY_SIZE}`}>
            {renderInlineText(block.text, `p-${i}`)}
          </p>
        );
      })}
    </div>
  );
}

function EventDetailsDialog({
  selected,
  onClose,
}: {
  selected: SelectedEvent | null;
  onClose: () => void;
}) {
  // The body is split out so its hooks aren't called conditionally — `selected`
  // toggles between null and set every time the dialog opens.
  if (!selected) return null;
  return <EventDetailsDialogBody selected={selected} onClose={onClose} />;
}

function EventDetailsDialogBody({
  selected,
  onClose,
}: {
  selected: SelectedEvent;
  onClose: () => void;
}) {
  const { event, isPast } = selected;
  const {
    parts: { day, month, year },
    weekday,
    time,
    isoDate,
  } = useEventDate(event);
  const { link: infoLink, label: infoLabel } = primaryEventLink(event, isPast);
  const title = displayTitle(event);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const ok = await copyEventLink(event.id);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  };

  // MUI Dialog is kept for its focus trap, escape handling, and scroll lock;
  // everything inside the paper is plain markup.
  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: "16px" } }}
    >
      {/* No fixed aspect ratio or box height here: YouTube thumbnails are
          16:9, but flyer-style previews are often taller. Forcing w-full
          with a height cap on the box clips the image via overflow-hidden
          instead of shrinking it — cap only the img's own max-height and
          let width follow the ratio, so the box sizes itself exactly to
          the (uncropped) rendered image. */}
      <div className="relative flex items-center justify-center bg-gray-100">
        <EventPreviewImage
          event={event}
          alt={title}
          className="max-h-[70vh] w-auto max-w-full object-contain"
        />
        <span className="absolute right-16 top-3 inline-flex">
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label="Copy link to this event"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm transition-colors duration-150 hover:bg-[#EA4335] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4335]"
          >
            <ShareIcon />
          </button>
          {copied && (
            <span
              role="status"
              className={`absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gray-900 px-3 py-1 text-white ${TS_CAPTION_SIZE}`}
            >
              Copied!
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm transition-colors duration-150 hover:bg-[#EA4335] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4335]"
        >
          <CloseIcon />
        </button>
      </div>
      <DialogContent className="flex flex-col gap-4">
        <time dateTime={isoDate}>
          <span
            className={`block font-bold leading-none tracking-tight text-[#EA4335] ${TS_HEADING_SIZE}`}
          >
            {day}
          </span>
          <span
            className={`mt-1 block font-medium uppercase tracking-wide text-gray-500 ${TS_OVERLINE_SIZE}`}
          >
            {month} {year}
          </span>
        </time>

        <h2 className={`font-bold tracking-tight text-gray-900 ${TS_SUBHEADING_SIZE}`}>
          {title}
        </h2>

        {/* Day/month/year is already shown above in the date badge — this
            line adds the info the badge doesn't carry (weekday, time)
            instead of repeating the same date. */}
        <p className={`text-gray-500 ${TS_BODY_SMALL_SIZE}`}>
          {weekday}
          {time && <span> · {time}</span>}
        </p>

        {event.description && <EventDescription text={event.description} />}
      </DialogContent>
      {(infoLink || event.locationLink) && (
        <DialogActions className="flex-wrap gap-4 border-t border-gray-200 px-6 py-4">
          {infoLink && (
            <a
              href={infoLink}
              target="_blank"
              rel="noopener noreferrer"
              className={PRIMARY_BUTTON_CLASSES}
            >
              {infoLabel}
              <ArrowRight size={16} />
            </a>
          )}
          {event.locationLink && (
            <a
              href={event.locationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gray-600 underline-offset-4 transition-colors duration-150 hover:text-gray-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4335]"
            >
              View location
            </a>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}

// ---------- Upcoming Events ----------

function UpcomingEventCard({ item }: { item: UpcomingEvent }) {
  const { event, sectionDef } = item;
  const {
    parts: { day, month },
    weekday,
    time,
    isoDate,
  } = useEventDate(event);
  const openModal = useContext(EventModalContext);
  const showPopup = hasMeaningfulDescription(event);
  const { link: infoLink, label: infoLabel } = primaryEventLink(event, false);
  const title = displayTitle(event);
  const speakers = event.description ? getEventSpeakers(event.description) : [];
  const teaser = speakers.length > 0
    ? `Featuring ${formatSpeakerList(speakers)}`
    : event.description
      ? getDescriptionExcerpt(event.description)
      : "";

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-l-4 border-gray-200 border-l-[#EA4335] p-5 sm:flex-row sm:items-center sm:gap-6">
      {/* Mobile-only lead image: on the stacked mobile layout this reads as
          a proper card banner. At sm (row layout) there's no good place for
          it alongside a centered date badge and a single text column, so it
          drops entirely rather than being squeezed in as a small thumbnail. */}
      <EventPreviewImage
        event={event}
        alt=""
        className="aspect-video w-full rounded-xl bg-gray-100 object-cover sm:hidden"
      />

      {/* Fixed width (not shrink-to-fit) at the row breakpoint: without it,
          this box sizes itself to whichever child is widest — a 2-digit day
          number is wider than the weekday text, a 1-digit day number is
          narrower — so every card's box ends up a different width and the
          centered content lands at a different x per card. A shared fixed
          width makes every card's date column line up like a table column. */}
      <time dateTime={isoDate} className="flex shrink-0 flex-col items-center sm:w-16">
        <span className={`font-medium uppercase tracking-wide text-gray-500 ${TS_OVERLINE_SIZE}`}>
          {weekday}
        </span>
        <span
          className={`font-bold leading-none tracking-tight text-[#EA4335] ${TS_HEADING_SIZE}`}
        >
          {day}
        </span>
        <span className={`font-medium uppercase tracking-wide text-gray-500 ${TS_OVERLINE_SIZE}`}>
          {month}
        </span>
      </time>

      <div className="min-w-0 flex-1">
        <span
          className={`mb-1.5 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-700 ${TS_CAPTION_SIZE}`}
        >
          {sectionDef.title}
        </span>
        <h3 className={`truncate font-bold text-gray-900 ${TS_SUBHEADING_SIZE}`}>{title}</h3>
        {time && <p className={`text-gray-500 ${TS_BODY_SMALL_SIZE}`}>{time}</p>}
        {teaser && <p className={`mt-1 line-clamp-2 text-gray-500 ${TS_BODY_SMALL_SIZE}`}>{teaser}</p>}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-4">
        {showPopup ? (
          <button
            type="button"
            onClick={() => openModal({ event, isPast: false })}
            className={PRIMARY_BUTTON_CLASSES}
          >
            More info
            <ArrowRight size={16} />
          </button>
        ) : infoLink ? (
          <a
            href={infoLink}
            target="_blank"
            rel="noopener noreferrer"
            className={PRIMARY_BUTTON_CLASSES}
          >
            {infoLabel}
            <ArrowRight size={16} />
          </a>
        ) : (
          <span className={`text-gray-400 ${TS_LABEL_SIZE}`}>—</span>
        )}
      </div>
    </article>
  );
}

function NoUpcomingEvents() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
      <p className={`text-gray-600 ${TS_BODY_SIZE}`}>
        No upcoming events right now — check back soon, or{" "}
        <a
          href="#past-events"
          className="font-medium text-[#EA4335] underline-offset-4 transition-colors duration-150 hover:text-[#C5341F] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4335]"
        >
          browse recordings below
        </a>
        .
      </p>
    </div>
  );
}

function UpcomingEventsSection({ events }: { events: EventItem[] }) {
  const { items, hasMore } = getUpcomingEvents(events, UPCOMING_WINDOW_DAYS);

  return (
    <section aria-label="Upcoming Events">
      <h2 className={`mb-8 font-bold tracking-tight text-gray-900 ${TS_EDITORIAL_SIZE}`}>
        Upcoming Events
      </h2>

      {items.length === 0 ? (
        <NoUpcomingEvents />
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <UpcomingEventCard key={item.event.id} item={item} />
          ))}
        </div>
      )}

      {hasMore && (
        <p className={`mt-6 text-gray-500 ${TS_BODY_SMALL_SIZE}`}>
          More events are already scheduled beyond the next {UPCOMING_WINDOW_DAYS} days.
        </p>
      )}
    </section>
  );
}

// ---------- Past Events ----------

function PastEventCard({ event }: { event: EventItem }) {
  const {
    parts: { full },
  } = useEventDate(event);
  const openModal = useContext(EventModalContext);
  const showPopup = hasMeaningfulDescription(event);
  const { link: infoLink, label: infoLabel } = primaryEventLink(event, true);
  const title = displayTitle(event);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-[border-color,box-shadow] duration-150 hover:border-gray-300 hover:shadow-sm">
      <div className="flex aspect-video items-center justify-center overflow-hidden bg-gray-100">
        <EventPreviewImage event={event} alt={title} className="h-full w-full object-contain" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className={`text-gray-500 ${TS_BODY_SMALL_SIZE}`}>{full}</p>
        <h3 className={`line-clamp-2 font-bold text-gray-900 ${TS_LABEL_SIZE}`}>{title}</h3>
        <div className="mt-auto pt-2">
          {showPopup ? (
            <button
              type="button"
              onClick={() => openModal({ event, isPast: true })}
              className={`font-medium text-[#168039] underline-offset-4 transition-colors duration-150 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4335] ${TS_LABEL_SIZE}`}
            >
              More info
            </button>
          ) : infoLink ? (
            <a
              href={infoLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`font-medium text-[#168039] underline-offset-4 transition-colors duration-150 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4335] ${TS_LABEL_SIZE}`}
            >
              {infoLabel}
            </a>
          ) : (
            <span className={`text-gray-400 ${TS_LABEL_SIZE}`}>—</span>
          )}
        </div>
      </div>
    </article>
  );
}

// A horizontal, uniform-card carousel — every past event gets equal visual
// weight (no "featured 2 + hidden rest" split). Cards are sized so ~3.5 are
// visible on desktop, narrowing on smaller viewports; the partial trailing
// card is a native side effect of overflow, not a manual crop. Mirrors the
// same component on /events-new.
function PastEventsCarousel({ events }: { events: EventItem[] }) {
  const { trackRef, canScrollLeft, canScrollRight, updateScrollState, scrollByCard } =
    useCarouselScroll(events.length);

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          aria-label="Show earlier past events"
          className={`${CAROUSEL_ARROW_CLASSES} -left-3 rotate-180`}
        >
          <ArrowRight size={18} />
        </button>
      )}

      <div
        ref={trackRef}
        onScroll={updateScrollState}
        role="region"
        aria-roledescription="carousel"
        aria-label="Past events"
        tabIndex={0}
        className="flex gap-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EA4335] motion-safe:scroll-smooth motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden"
      >
        {events.map((event) => (
          <div
            key={event.id}
            data-carousel-card
            className="w-[68%] shrink-0 min-[640px]:w-[42%] min-[900px]:w-[29%]"
          >
            <PastEventCard event={event} />
          </div>
        ))}
      </div>

      {canScrollRight && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent"
          />
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            aria-label="Show more past events"
            className={`${CAROUSEL_ARROW_CLASSES} -right-3`}
          >
            <ArrowRight size={18} />
          </button>
        </>
      )}
    </div>
  );
}

// Renders a category as a pure archive: no featured/highlighted cards. A
// category with zero past events is skipped entirely (its anchor link is
// only valid once it has at least one past event to show).
function PastEventsCategorySection({ section }: { section: EventSection }) {
  const { def, past } = section;
  const [expanded, setExpanded] = useState(true);

  if (past.length === 0) return null;

  return (
    <section
      id={def.key}
      aria-label={def.title}
      className="scroll-mt-24 border-t border-gray-200 pt-12"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3
            className={`mb-1 flex items-center gap-2 font-bold tracking-tight text-gray-900 ${TS_EDITORIAL_SIZE}`}
          >
            <CategoryAnchorButton slug={def.key} />
            {def.title}
          </h3>
          <p className={`text-gray-500 ${TS_BODY_SIZE}`}>{def.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse section" : "Expand section"}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors duration-150 hover:bg-[#EA4335] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4335]"
        >
          <ChevronDown expanded={expanded} size={18} />
        </button>
      </div>

      {expanded && (
        <div className="mt-8">
          <PastEventsCarousel events={past} />
        </div>
      )}
    </section>
  );
}

// ---------- Page states ----------

// Mirrors the real page shape (upcoming rows, then a past-events card row) so
// the layout doesn't jump when content arrives.
function LoadingSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="mb-8 h-8 w-56 animate-pulse rounded bg-gray-100" />
      <div className="flex flex-col gap-4">
        {[...Array(2)].map((_, index) => (
          <div
            key={`upcoming-skeleton-${index}`}
            className="flex items-center gap-6 rounded-2xl border border-gray-200 p-5"
          >
            <div className="h-14 w-10 shrink-0 animate-pulse rounded bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="hidden h-11 w-32 shrink-0 animate-pulse rounded-full bg-gray-100 sm:block" />
          </div>
        ))}
      </div>
      <div className="mt-14 border-t border-gray-200 pt-12">
        <div className="mb-8 h-7 w-48 animate-pulse rounded bg-gray-100" />
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, index) => (
            <div
              key={`past-skeleton-${index}`}
              className="w-[68%] shrink-0 min-[640px]:w-[42%] min-[900px]:w-[29%]"
            >
              <div className="overflow-hidden rounded-2xl border border-gray-200">
                <div className="aspect-video animate-pulse bg-gray-100" />
                <div className="space-y-2 p-4">
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
      <p className={`mb-2 font-bold text-gray-900 ${TS_BODY_LARGE_SIZE}`}>No events found</p>
      <p className={`text-gray-500 ${TS_BODY_SIZE}`}>
        There are no events available at the moment. Check back later!
      </p>
    </div>
  );
}

export default function Events({
  events: initialEvents,
  loading: initialLoading = false,
}: EventsProps) {
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [loading, setLoading] = useState(initialLoading);
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);
  const deepLinkHandled = useRef(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/events", {
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (response.ok) {
        const newEvents: EventItem[] = await response.json();
        setEvents(newEvents);
      }
    } catch {
      /*
       * intentional silent error handling: user sees existing/cached events on fetch failure.
       * console.error provides no value in production at this stage; users don't
       * see it, monitoring systems don't capture it; it's purely a debugging tool.
       */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialEvents.length === 0 && initialLoading) {
      fetchEvents();
    } else {
      setLoading(false);
    }
  }, []);

  // This whole component renders client-side only (client:only="react"), so a
  // direct link to a category (e.g. /events#book-club) has nothing in the DOM
  // yet when the browser tries its native hash scroll — scroll to it ourselves
  // once the section is actually rendered.
  useEffect(() => {
    if (loading || events.length === 0) return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    document.getElementById(hash)?.scrollIntoView({ block: "start" });
  }, [loading, events.length]);

  // A "Copy link" button in the event modal encodes the event's id as
  // ?event=<id> (see copyEventLink) — re-open that event's modal on load so
  // the link is actually shareable, not just a URL that looks specific.
  useEffect(() => {
    if (loading || events.length === 0 || deepLinkHandled.current) return;
    deepLinkHandled.current = true;
    const id = new URLSearchParams(window.location.search).get("event");
    if (!id) return;
    const event = events.find((e) => e.id === id);
    if (!event) return;
    setSelectedEvent({ event, isPast: isEventPast(event) });
  }, [loading, events.length]);

  const sections = groupIntoSections(events);
  const hasPastEvents = sections.some((section) => section.past.length > 0);

  return (
    <EventModalContext.Provider value={setSelectedEvent}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        {loading && events.length === 0 && <LoadingSkeleton />}

        {!loading && events.length === 0 && <EmptyState />}

        {events.length > 0 && (
          <div>
            <UpcomingEventsSection events={events} />

            {hasPastEvents && (
              <section
                id="past-events"
                className="mt-14 scroll-mt-24 border-t border-gray-200 pt-14"
              >
                <h2 className={`font-bold tracking-tight text-gray-900 ${TS_EDITORIAL_SIZE}`}>
                  Past Events
                </h2>
              </section>
            )}

            <div className="mt-12 space-y-12">
              {sections.map((section) => (
                <PastEventsCategorySection key={section.def.key} section={section} />
              ))}
            </div>
          </div>
        )}
      </div>
      <EventDetailsDialog
        selected={selectedEvent}
        onClose={() => {
          setSelectedEvent(null);
          clearEventLinkParam();
        }}
      />
    </EventModalContext.Provider>
  );
}
