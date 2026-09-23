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
import { copyAnchorLink, copyEventLink } from "../utils/copyAnchorLink";
import { eventPath, findEventBySlug } from "../utils/eventSlug";
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
  LinkIcon,
  EventModalContext,
  useCarouselScroll,
  useEventDate,
  type SelectedEvent,
} from "./events/eventsShared";

const UPCOMING_WINDOW_DAYS = 60;
const COPIED_FEEDBACK_MS = 1500;
const EVENT_COPY_FEEDBACK_MS = 2500;

// Font sizes only (not family/weight/color) matched to /events-new's type
// scale in src/styles/design-system.css, stepped at the same 390/810/1200
// breakpoints. Each constant is named after the .ts-* role it mirrors.
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
        className="inline-flex h-11 w-11 items-center justify-center text-[28px] leading-none text-gray-400 transition-colors duration-150 hover:text-[#EA4335] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4335]"
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
            <p key={i} className={`font-medium text-gray-900 ${TS_EYEBROW_SIZE}`}>
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
    const ok = await copyEventLink();
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), EVENT_COPY_FEEDBACK_MS);
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
            className={`block font-medium leading-none tracking-tight text-[#EA4335] ${TS_HEADING_SIZE}`}
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

        <div className="flex items-center justify-between gap-4">
          {/* Day/month/year is already shown above in the date badge — this
              line adds the info the badge doesn't carry (weekday, time)
              instead of repeating the same date. */}
          <p className={`text-gray-500 ${TS_BODY_SMALL_SIZE}`}>
            {weekday}
            {time && <span> · {time}</span>}
            {event.location && <span> · {event.location}</span>}
          </p>

          <span className="relative inline-flex shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className={`inline-flex items-center gap-1.5 text-[#EA4335] underline underline-offset-4 transition-colors duration-150 hover:text-[#C5341F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4335] ${TS_LABEL_SIZE}`}
            >
              <LinkIcon size={16} />
              Share
            </button>
            {copied && (
              <span
                role="status"
                className={`absolute right-0 top-full mt-2 whitespace-nowrap rounded-full bg-gray-900 px-3 py-1.5 text-white ${TS_CAPTION_SIZE}`}
              >
                Event URL copied to clipboard successfully
              </span>
            )}
          </span>
        </div>

        {event.description && <EventDescription text={event.description} />}
      </DialogContent>
      {(infoLink || event.locationLink) && (
        <DialogActions className="flex-wrap items-center gap-4 border-t border-gray-200 px-6 py-4">
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
  // Whether there's anywhere to send someone yet — a placeholder like a
  // not-yet-detailed community call gets a neutral "Soon" instead of red.
  const isConfirmed = showPopup || Boolean(infoLink);

  const dateColumn = (
    <time dateTime={isoDate} className="grid gap-0.5 leading-none">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
        {weekday}
      </span>
      <span
        className={`text-[32px] font-semibold tracking-[-0.02em] ${isConfirmed ? "text-[#EA4335]" : "text-gray-900"}`}
      >
        {day}
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
        {month}
      </span>
    </time>
  );

  const body = (
    <div className="grid min-w-0 gap-2">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.1em] text-[#EA4335]">
        <span>{sectionDef.title}</span>
        {time && (
          <>
            <span className="text-gray-300">/</span>
            <span className="text-gray-400">{time}</span>
          </>
        )}
      </div>
      <h3 className="text-2xl font-semibold leading-[1.2] tracking-[-0.02em] text-gray-900">
        {title}
      </h3>
      {teaser && <p className="max-w-[62ch] text-[15px] leading-[1.5] text-gray-600">{teaser}</p>}
    </div>
  );

  const cta = isConfirmed ? (
    <span className="whitespace-nowrap pt-1 text-sm font-semibold text-[#EA4335]">
      {showPopup ? "More info" : infoLabel} →
    </span>
  ) : (
    <span className="whitespace-nowrap pt-1 text-sm font-semibold text-gray-400">Soon</span>
  );

  const rowClasses =
    "grid grid-cols-[76px_minmax(0,1fr)_auto] items-start gap-7 rounded-[18px] border border-gray-200 px-6 py-6 text-left transition-colors duration-150 hover:border-gray-300";

  if (showPopup) {
    return (
      <button type="button" onClick={() => openModal({ event, isPast: false })} className={rowClasses}>
        {dateColumn}
        {body}
        {cta}
      </button>
    );
  }

  if (infoLink) {
    return (
      <a href={infoLink} target="_blank" rel="noopener noreferrer" className={rowClasses}>
        {dateColumn}
        {body}
        {cta}
      </a>
    );
  }

  return (
    <div className={rowClasses}>
      {dateColumn}
      {body}
      {cta}
    </div>
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
      <div className="mb-2 flex items-baseline gap-3.5">
        <h2 className="text-[15px] font-semibold tracking-[0.02em] text-gray-900">Upcoming</h2>
        <span className="text-xs font-semibold text-gray-400">
          {String(items.length).padStart(2, "0")}
        </span>
      </div>

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
    <article className="grid h-full content-start gap-3.5">
      <div className="aspect-[16/10] overflow-hidden rounded-[14px] border border-gray-200 bg-gray-100">
        <EventPreviewImage event={event} alt={title} className="h-full w-full object-cover" />
      </div>
      <div className="grid gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
          {full}
        </span>
        <h4 className="line-clamp-2 text-[17px] font-semibold leading-[1.28] tracking-[-0.01em] text-gray-900">
          {title}
        </h4>
        {showPopup ? (
          <button
            type="button"
            onClick={() => openModal({ event, isPast: true })}
            className="w-fit text-sm font-semibold text-[#168039] transition-colors duration-150 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4335]"
          >
            More info →
          </button>
        ) : infoLink ? (
          <a
            href={infoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit text-sm font-semibold text-[#168039] transition-colors duration-150 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4335]"
          >
            {infoLabel} →
          </a>
        ) : (
          <span className="text-sm font-semibold text-gray-400">—</span>
        )}
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
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
          <h3 className="flex items-center gap-2 text-[30px] font-bold leading-[1.1] tracking-[-0.025em] text-gray-900">
            <CategoryAnchorButton slug={def.key} />
            {def.title}
          </h3>
          <p className="text-sm text-gray-600">{def.subtitle}</p>
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
      <p className={`mb-2 text-gray-900 ${TS_BODY_LARGE_SIZE}`}>No events found</p>
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

  // A direct load of /events/<slug> (see eventPath/findEventBySlug) is this
  // same page — the modal for that specific event just needs opening once
  // the real event list is in.
  useEffect(() => {
    if (loading || events.length === 0 || deepLinkHandled.current) return;
    deepLinkHandled.current = true;
    const slug = window.location.pathname.replace(/^\/events\//, "");
    if (slug === window.location.pathname) return; // no /events/<slug> segment
    const event = findEventBySlug(events, slug);
    if (!event) return;
    setSelectedEvent({ event, isPast: isEventPast(event) });
  }, [loading, events.length]);

  // Keeps the address bar and the modal in sync with browser back/forward.
  // Only ever reads the URL here — never pushes a new one — so this can't
  // stack extra history entries on top of what pushEvent/closeModal already
  // pushed.
  useEffect(() => {
    const onPopState = () => {
      const slug = window.location.pathname.replace(/^\/events\//, "");
      if (slug === window.location.pathname) {
        setSelectedEvent(null);
        return;
      }
      const event = findEventBySlug(events, slug);
      setSelectedEvent(event ? { event, isPast: isEventPast(event) } : null);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [events]);

  const openEvent = (selected: SelectedEvent) => {
    history.pushState(null, "", eventPath(selected.event));
    setSelectedEvent(selected);
  };

  const closeModal = () => {
    history.pushState(null, "", "/events");
    setSelectedEvent(null);
  };

  const sections = groupIntoSections(events);
  const hasPastEvents = sections.some((section) => section.past.length > 0);

  return (
    <EventModalContext.Provider value={openEvent}>
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
                <h2 className="text-[15px] font-semibold tracking-[0.02em] text-gray-900">
                  Past events
                </h2>
              </section>
            )}

            <div className="mt-2 space-y-12">
              {sections.map((section) => (
                <PastEventsCategorySection key={section.def.key} section={section} />
              ))}
            </div>
          </div>
        )}
      </div>
      <EventDetailsDialog selected={selectedEvent} onClose={closeModal} />
    </EventModalContext.Provider>
  );
}
