import React, { createContext, useContext, useEffect, useState } from "react";
import { hasMeaningfulDescription, primaryEventLink, type EventItem } from "../../store/eventsClient";
import { groupIntoSections, type EventSection } from "../../utils/eventSections";
import { buildGoogleCalendarLink } from "../../utils/googleCalendarLink";
import { toWebcalUrl } from "../../utils/webcal";
import { parseEventDescription, renderInlineText } from "../../utils/eventDescription";

const PAST_EVENTS_PAGE_SIZE = 5;

interface SelectedEvent {
  event: EventItem;
  isPast: boolean;
}

const EventModalContext = createContext<(selected: SelectedEvent) => void>(() => {});

function isEventPast(event: EventItem): boolean {
  return !event.dateUtcIso || new Date(event.dateUtcIso).getTime() < Date.now();
}

interface DateParts {
  day: number;
  month: string;
  year: string;
  full: string;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function parseDateParts(dateStr: string): DateParts {
  const [year, month, day] = dateStr.split("-");
  return {
    day: parseInt(day, 10),
    month: MONTH_NAMES[parseInt(month, 10) - 1],
    year,
    full: `${parseInt(day, 10)} ${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`,
  };
}

function ArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function ChevronDown({ size = 18, expanded }: { size?: number; expanded: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="transition-transform duration-200"
      style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CalendarPlus({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18M12 14v6M9 17h6" />
    </svg>
  );
}

function CloseIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function LoadingSkeleton() {
  return (
    <div>
      {Array.from({ length: 2 }).map((_, i) => (
        <section key={i} className="bg-page px-6 py-12 min-[810px]:px-10 min-[810px]:py-16">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-2 h-6 w-64 animate-pulse rounded-sm bg-butter" />
            <div className="mb-8 h-4 w-96 max-w-full animate-pulse rounded-sm bg-butter" />
            <div className="grid gap-6 min-[810px]:grid-cols-2">
              <div className="aspect-[4/3] w-full animate-pulse rounded-[20px] bg-butter" />
              <div className="aspect-[4/3] w-full animate-pulse rounded-[20px] bg-butter" />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-page px-6 py-24 text-center min-[810px]:px-10">
      <p className="ts-body-large text-ink-secondary">No events right now. Check back soon.</p>
    </div>
  );
}

interface SubscribeNoteProps {
  icsUrl: string;
}

function SubscribeNote({ icsUrl }: SubscribeNoteProps) {
  if (!icsUrl) return null;

  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-10 min-[810px]:px-10">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-butter bg-sand px-6 py-4">
        <p className="ts-body-small text-ink-secondary">
          Want every new T4P event on your own calendar automatically?
        </p>
        <a
          href={toWebcalUrl(icsUrl)}
          className="ts-label inline-flex items-center gap-2 text-brand transition-colors duration-150 hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <CalendarPlus />
          Subscribe to this calendar
        </a>
      </div>
    </div>
  );
}

function EventDescription({ text }: { text: string }) {
  const blocks = parseEventDescription(text);

  return (
    <div className="ts-body flex flex-col gap-3 break-words text-ink-secondary">
      {blocks.map((block, i) => {
        if (block.type === "hr") return <hr key={i} className="border-ink-divider" />;
        if (block.type === "heading") {
          return (
            <h4 key={i} className="ts-eyebrow text-ink">
              {renderInlineText(block.text, `h-${i}`)}
            </h4>
          );
        }
        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag key={i} className={block.ordered ? "list-decimal pl-5" : "list-disc pl-5"}>
              {block.items.map((item, j) => (
                <li key={j}>{renderInlineText(item, `l-${i}-${j}`)}</li>
              ))}
            </ListTag>
          );
        }
        return <p key={i}>{renderInlineText(block.text, `p-${i}`)}</p>;
      })}
    </div>
  );
}

interface EventModalProps {
  selected: SelectedEvent;
  onClose: () => void;
}

function EventModal({ selected, onClose }: EventModalProps) {
  const { event, isPast } = selected;
  const { day, month, year, full } = parseDateParts(event.date);
  const { link: infoLink, label: infoLabel } = primaryEventLink(event, isPast);
  const calendarLink = isPast ? null : buildGoogleCalendarLink(event);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    // This site's pages scroll via Lenis (window.__lenis), which intercepts
    // wheel/touch events itself — CSS `overflow: hidden` on html/body alone
    // doesn't stop it. Stop Lenis while the modal is open, same pattern as
    // ProjectDrawer.tsx.
    const lenis = (window as any).__lenis;
    lenis?.stop();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      lenis?.start();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[20px] bg-page"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={event.title}
      >
        <div data-lenis-prevent className="overflow-y-auto overscroll-y-contain">
          <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-sand">
            <img
              src={event.image}
              alt={event.title}
              className="h-full w-full object-contain"
              loading="lazy"
              decoding="async"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-page text-ink transition-colors duration-150 hover:bg-brand hover:text-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="flex flex-col gap-4 p-6 min-[640px]:p-8">
            <time dateTime={event.date}>
              <span className="ts-heading block leading-none text-brand">{day}</span>
              <span className="ts-overline block text-ink-secondary">
                {month} {year}
              </span>
            </time>

            <h2 className="ts-subheading text-ink">{event.title}</h2>

            <p className="ts-body-small text-ink-secondary">
              {full}
              {event.time && <span> · {event.time}</span>}
            </p>

            {event.description && <EventDescription text={event.description} />}
          </div>
        </div>

        {(infoLink || event.locationLink || calendarLink) && (
          <div className="flex shrink-0 flex-wrap items-center gap-4 border-t border-ink-divider p-6 min-[640px]:p-8">
            {infoLink && (
              <a
                href={infoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="ts-label inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-brand px-6 py-3.5 text-page transition-colors duration-150 hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98]"
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
                className="ts-label inline-flex items-center text-ink-secondary transition-colors duration-150 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                View location
              </a>
            )}
            {calendarLink && (
              <a
                href={calendarLink}
                target="_blank"
                rel="noopener noreferrer"
                className="ts-label inline-flex items-center gap-1.5 text-ink-secondary transition-colors duration-150 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <CalendarPlus />
                Add to calendar
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface FeaturedCardProps {
  event: EventItem;
  isPast: boolean;
}

function FeaturedCard({ event, isPast }: FeaturedCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const { day, month, year } = parseDateParts(event.date);
  const calendarLink = isPast ? null : buildGoogleCalendarLink(event);
  const openModal = useContext(EventModalContext);
  const showPopup = hasMeaningfulDescription(event);
  const { link: infoLink, label: infoLabel } = primaryEventLink(event, isPast);

  return (
    <article
      className={
        isPast
          ? "flex flex-col overflow-hidden rounded-[20px] border border-butter bg-page"
          : "flex flex-col overflow-hidden rounded-[20px] border-2 border-positive bg-positive-tint"
      }
    >
      <div className="flex aspect-[16/10] items-center justify-center overflow-hidden bg-sand">
        <img
          src={imgFailed ? "/images/default.jpg" : event.image}
          alt={event.title}
          className="h-full w-full object-contain"
          onError={() => setImgFailed(true)}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6 min-[810px]:p-8">
        <div className="flex items-start justify-between gap-3">
          <time dateTime={event.date}>
            <span className="ts-heading block leading-none text-brand">{day}</span>
            <span className="ts-overline block text-ink-secondary">
              {month} {year}
            </span>
          </time>
          {!isPast && (
            <span className="ts-label inline-flex items-center gap-1.5 rounded-pill bg-positive px-3.5 py-1.5 font-bold uppercase tracking-wide text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
              Upcoming
            </span>
          )}
        </div>

        <h3 className="ts-subheading text-ink">{event.title}</h3>

        {event.time && <p className="ts-body-small text-ink-secondary">{event.time}</p>}

        {event.description && (
          <p className="ts-body line-clamp-3 text-ink-secondary">{event.description}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-4 pt-2">
          {showPopup ? (
            <button
              type="button"
              onClick={() => openModal({ event, isPast })}
              className="ts-label inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-brand px-6 py-3.5 text-page transition-colors duration-150 hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98]"
            >
              More info
              <ArrowRight size={16} />
            </button>
          ) : (
            infoLink && (
              <a
                href={infoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="ts-label inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-brand px-6 py-3.5 text-page transition-colors duration-150 hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98]"
              >
                {infoLabel}
                <ArrowRight size={16} />
              </a>
            )
          )}
          {calendarLink && (
            <a
              href={calendarLink}
              target="_blank"
              rel="noopener noreferrer"
              className="ts-label inline-flex items-center gap-1.5 text-ink-secondary transition-colors duration-150 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <CalendarPlus />
              Add to calendar
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

interface PastEventRowProps {
  event: EventItem;
}

function PastEventRow({ event }: PastEventRowProps) {
  const { full } = parseDateParts(event.date);
  const openModal = useContext(EventModalContext);
  const isPast = isEventPast(event);
  const showPopup = hasMeaningfulDescription(event);
  const { link: infoLink, label: infoLabel } = primaryEventLink(event, isPast);

  return (
    <div className="border-b border-ink-divider py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <p className="ts-label flex min-w-0 flex-1 items-center gap-2 truncate text-ink">
          {!isPast && (
            <span className="ts-caption inline-flex shrink-0 items-center gap-1 rounded-pill bg-positive px-2.5 py-1 font-bold uppercase tracking-wide text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
              Upcoming
            </span>
          )}
          <span className="truncate">{event.title}</span>
        </p>
        {showPopup ? (
          <button
            type="button"
            onClick={() => openModal({ event, isPast })}
            className="ts-label shrink-0 text-brand transition-colors duration-150 hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            More info
          </button>
        ) : infoLink ? (
          <a
            href={infoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="ts-label shrink-0 text-brand transition-colors duration-150 hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {infoLabel}
          </a>
        ) : (
          <span className="ts-label shrink-0 text-ink-secondary/50">—</span>
        )}
      </div>
      <p className="ts-body-small mt-1 text-ink-secondary">
        {full}
        {event.time && <span> · {event.time}</span>}
      </p>
    </div>
  );
}

interface PastEventsListProps {
  events: EventItem[];
}

function PastEventsList({ events }: PastEventsListProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? events : events.slice(0, PAST_EVENTS_PAGE_SIZE);
  const remaining = events.length - visible.length;

  return (
    <div>
      <p className="ts-overline mb-4 text-ink-secondary">Past events</p>
      <div>
        {visible.map((event) => (
          <PastEventRow key={event.id} event={event} />
        ))}
      </div>
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="ts-label mt-4 text-brand transition-colors duration-150 hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Show {remaining} more
        </button>
      )}
    </div>
  );
}

interface EventSectionBlockProps {
  section: EventSection;
}

const FEATURED_COUNT = 2;

function EventSectionBlock({ section }: EventSectionBlockProps) {
  const { def, upcoming, past } = section;
  const [expanded, setExpanded] = useState(true);

  // Always feature the most-recent events (soonest-upcoming first, filling
  // any remaining slots from the latest past events) rather than only ever
  // spotlighting upcoming ones — most categories are past-heavy.
  const featuredUpcoming = upcoming.slice(0, FEATURED_COUNT);
  const featuredPast = past.slice(0, FEATURED_COUNT - featuredUpcoming.length);
  const featured = [
    ...featuredUpcoming.map((event) => ({ event, isPast: false })),
    ...featuredPast.map((event) => ({ event, isPast: true })),
  ];
  const rest = [...upcoming.slice(featuredUpcoming.length), ...past.slice(featuredPast.length)];

  return (
    <section
      className="border-t border-ink-divider bg-page px-6 py-12 min-[810px]:px-10 min-[810px]:py-16"
      aria-label={def.title}
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="ts-editorial mb-3 text-ink">{def.title}</h2>
            <p className="ts-body max-w-[65ch] text-ink-secondary">{def.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse section" : "Expand section"}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-butter text-ink transition-colors duration-150 hover:bg-brand hover:text-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <ChevronDown expanded={expanded} size={18} />
          </button>
        </div>

        {expanded && (
          <div
            className={
              rest.length > 0
                ? "mt-8 grid gap-8 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]"
                : "mt-8"
            }
          >
            <div className="grid gap-6 min-[640px]:grid-cols-2">
              {featured.map(({ event, isPast }) => (
                <FeaturedCard key={event.id} event={event} isPast={isPast} />
              ))}
            </div>

            {rest.length > 0 && <PastEventsList events={rest} />}
          </div>
        )}
      </div>
    </section>
  );
}

interface EventsNewProps {
  initialEvents?: EventItem[];
  icsUrl?: string;
}

export default function EventsNew({ initialEvents = [], icsUrl = "" }: EventsNewProps) {
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [loading, setLoading] = useState(initialEvents.length === 0);
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);

  useEffect(() => {
    if (initialEvents.length > 0) return;
    setLoading(true);
    fetch("/api/events", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: EventItem[]) => setEvents(data))
      .finally(() => setLoading(false));
  }, []);

  const sections = groupIntoSections(events);

  return (
    <EventModalContext.Provider value={setSelectedEvent}>
      <div className="pb-16 min-[810px]:pb-24">
        {loading ? (
          <LoadingSkeleton />
        ) : events.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <SubscribeNote icsUrl={icsUrl} />
            {sections.map((section) => (
              <EventSectionBlock key={section.def.key} section={section} />
            ))}
          </>
        )}
      </div>
      {selectedEvent && (
        <EventModal selected={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </EventModalContext.Provider>
  );
}
