import { useContext } from "react";
import {
  hasMeaningfulDescription,
  primaryEventLink,
  type EventItem,
} from "../../store/eventsClient";
import { displayTitle, getUpcomingEvents, type UpcomingEvent } from "../../utils/eventSections";
import { formatSpeakerList, getDescriptionExcerpt, getEventSpeakers } from "../../utils/eventDescription";
import { ArrowRight, EventModalContext, useEventDate } from "./eventsShared";
import { EventPreviewImage } from "./EventPreviewImage";

const UPCOMING_WINDOW_DAYS = 60;

interface UpcomingEventCardProps {
  item: UpcomingEvent;
}

function UpcomingEventCard({ item }: UpcomingEventCardProps) {
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
  const speakers = event.description ? getEventSpeakers(event.description) : [];
  const teaser = speakers.length > 0
    ? `Featuring ${formatSpeakerList(speakers)}`
    : event.description
      ? getDescriptionExcerpt(event.description)
      : "";

  return (
    <article className="flex flex-col gap-4 rounded-[16px] border border-l-4 border-ink-divider border-l-brand bg-page p-5 min-[640px]:flex-row min-[640px]:items-center min-[640px]:gap-6">
      {/* Mobile-only lead image: on the stacked mobile layout this reads as
          a proper card banner. At the 640px row layout there's no good
          place for it alongside a centered date badge and a single text
          column, so it drops entirely rather than being squeezed in as a
          small thumbnail. */}
      <EventPreviewImage
        event={event}
        alt=""
        className="aspect-video w-full rounded-[12px] bg-sand object-cover min-[640px]:hidden"
      />

      {/* Fixed width (not shrink-to-fit) at the row breakpoint: without it,
          this box sizes itself to whichever child is widest — a 2-digit day
          number is wider than the weekday text, a 1-digit day number is
          narrower — so every card's box ends up a different width and the
          centered content lands at a different x per card. A shared fixed
          width makes every card's date column line up like a table column. */}
      <time dateTime={isoDate} className="flex shrink-0 flex-col items-center min-[640px]:w-16">
        <span className="ts-overline text-ink-secondary">{weekday}</span>
        <span className="ts-heading leading-none text-brand">{day}</span>
        <span className="ts-overline text-ink-secondary">{month}</span>
      </time>

      <div className="min-w-0 flex-1">
        <span className="ts-caption mb-1.5 inline-flex items-center rounded-pill bg-butter px-2.5 py-1 text-ink-secondary">
          {sectionDef.title}
        </span>
        <h3 className="ts-subheading truncate text-ink">{displayTitle(event)}</h3>
        {time && <p className="ts-body-small text-ink-secondary">{time}</p>}
        {teaser && <p className="ts-body-small mt-1 line-clamp-2 text-ink-secondary">{teaser}</p>}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-4">
        {showPopup ? (
          <button
            type="button"
            onClick={() => openModal({ event, isPast: false })}
            className="ts-label inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-brand px-6 py-3.5 text-page transition-colors duration-150 hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98]"
          >
            More info
            <ArrowRight size={16} />
          </button>
        ) : infoLink ? (
          <a
            href={infoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="ts-label inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-brand px-6 py-3.5 text-page transition-colors duration-150 hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98]"
          >
            {infoLabel}
            <ArrowRight size={16} />
          </a>
        ) : (
          <span className="ts-label text-ink-secondary/50">—</span>
        )}
      </div>
    </article>
  );
}

function NoUpcomingEvents() {
  return (
    <div className="rounded-[16px] border border-dashed border-ink-divider bg-sand px-6 py-10 text-center">
      <p className="ts-body text-ink-secondary">
        No upcoming events right now — check back soon, or{" "}
        <a
          href="#past-events"
          className="text-brand underline underline-offset-2 transition-colors duration-150 hover:text-brand-hover"
        >
          browse recordings below
        </a>
        .
      </p>
    </div>
  );
}

interface UpcomingEventsSectionProps {
  events: EventItem[];
}

export function UpcomingEventsSection({ events }: UpcomingEventsSectionProps) {
  const { items, hasMore } = getUpcomingEvents(events, UPCOMING_WINDOW_DAYS);

  return (
    <section
      className="bg-page px-6 py-12 min-[810px]:px-10 min-[810px]:py-16"
      aria-label="Upcoming Events"
    >
      <div className="mx-auto max-w-[1400px]">
        <h2 className="ts-editorial mb-8 text-ink">Upcoming Events</h2>

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
          <p className="ts-body-small mt-6 text-ink-secondary">
            More events are already scheduled beyond the next {UPCOMING_WINDOW_DAYS} days.
          </p>
        )}
      </div>
    </section>
  );
}
