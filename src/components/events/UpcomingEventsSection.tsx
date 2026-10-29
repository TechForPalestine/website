import { useContext, useState, type ReactNode } from "react";
import {
  hasMeaningfulDescription,
  primaryEventLink,
  type EventItem,
} from "../../store/eventsClient";
import { displayTitle, getUpcomingEvents, type UpcomingEvent } from "../../utils/eventSections";
import { EventPreviewImage } from "./EventPreviewImage";
import { EventModalContext, useEventDate } from "./EventsShared";
import {
  formatUpcomingCount,
  hasPreviewImage,
  isUpcomingConfirmed,
  splitSpotlight,
  upcomingTeaser,
} from "./eventsLogic";
import { TS_BODY_SIZE, TS_BODY_SMALL_SIZE } from "./typeScale";

const UPCOMING_WINDOW_DAYS = 60;
const THUMBNAIL_PX = 72;

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grove";

// The popup when there's a real description, else the event's own link, else
// nothing clickable. Shared by the spotlight and the rows so both open the
// same destination.
function useUpcomingAction(event: EventItem) {
  const openModal = useContext(EventModalContext);
  const showPopup = hasMeaningfulDescription(event);
  const { link: infoLink, label: infoLabel } = primaryEventLink(event, false);
  return {
    showPopup,
    infoLink,
    ctaLabel: showPopup ? "More info" : infoLabel,
    open: () => openModal({ event, isPast: false }),
  };
}

function ActionSurface({
  event,
  className,
  children,
}: {
  event: EventItem;
  className: string;
  children: ReactNode;
}) {
  const { showPopup, infoLink, open } = useUpcomingAction(event);

  if (showPopup) {
    return (
      <button type="button" onClick={open} className={`${className} ${FOCUS_RING}`}>
        {children}
      </button>
    );
  }

  if (infoLink) {
    return (
      <a
        href={infoLink}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} ${FOCUS_RING}`}
      >
        {children}
      </a>
    );
  }

  return <div className={className}>{children}</div>;
}

// Typographic stand-in for a spotlight event with no usable image, so the
// panel never falls back to the generic default.jpg.
function SpotlightDatePanel({ day, month }: { day: number; month: string }) {
  return (
    <div className="grid h-full w-full place-content-center bg-first-light text-center leading-none">
      <span className="text-[88px] font-extrabold tracking-[-0.03em] text-grove md:text-[112px]">
        {day}
      </span>
      <span className="mt-2 text-[13px] font-bold uppercase tracking-[0.14em] text-grove-deep">
        {month}
      </span>
    </div>
  );
}

function SpotlightEvent({ item }: { item: UpcomingEvent }) {
  const { event, sectionDef } = item;
  const {
    parts: { day, month },
    weekday,
    time,
    isoDate,
  } = useEventDate(event);
  const { ctaLabel } = useUpcomingAction(event);
  const [imageFailed, setImageFailed] = useState(false);
  const title = displayTitle(event);
  const teaser = upcomingTeaser(event.description);
  const showImage = hasPreviewImage(event) && !imageFailed;

  return (
    <div className="mb-4">
      <p className="mb-3 text-[12px] font-bold uppercase leading-none tracking-[0.14em] text-grove-deep">
        Next up
      </p>
      <ActionSurface
        event={event}
        className="group grid w-full overflow-hidden rounded-lg border border-ink-divider bg-paper text-left shadow-sm transition-colors duration-150 hover:border-grove md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
      >
        {/* Fixed-height frame with object-contain: flyers are often taller than
            wide and carry their own text, so they're shown whole rather than
            cropped, and the frame doesn't shift layout when the image loads. */}
        <div className="flex h-[min(50vh,280px)] items-center justify-center bg-stone md:h-[320px]">
          {showImage ? (
            <EventPreviewImage
              event={event}
              alt={`Event image for ${title}`}
              className="h-full w-full object-contain"
              loading="eager"
              onUnavailable={() => setImageFailed(true)}
            />
          ) : (
            <SpotlightDatePanel day={day} month={month} />
          )}
        </div>

        <div className="grid content-center gap-3 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] font-bold uppercase tracking-[0.1em]">
            <time dateTime={isoDate} className="text-ink">
              {weekday} {day} {month}
              {time && <span className="text-ink-secondary"> · {time}</span>}
            </time>
            <span className="text-ink-divider" aria-hidden="true">
              /
            </span>
            <span className="text-grove-deep">{sectionDef.title}</span>
          </div>
          <h3 className="text-[28px] font-extrabold leading-[1.15] text-ink md:text-[32px]">
            {title}
          </h3>
          {teaser && (
            <p className="max-w-[60ch] text-[16px] leading-[1.6] text-ink-secondary">{teaser}</p>
          )}
          <span className="mt-2 inline-flex min-h-[44px] w-fit items-center rounded-pill bg-grove px-5 text-[13px] font-bold text-paper transition-colors duration-150 group-hover:bg-grove-deep">
            {ctaLabel} →
          </span>
        </div>
      </ActionSurface>
    </div>
  );
}

// Decorative: the row title right beside it already names the event, so the
// thumbnail is a recognition cue only (alt="") and the full image lives in the
// popup. Removes itself entirely if the image fails, leaving no empty slot.
function RowThumbnail({ event }: { event: EventItem }) {
  const [failed, setFailed] = useState(false);
  if (failed || !hasPreviewImage(event)) return null;

  return (
    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-stone sm:h-[72px] sm:w-[72px]">
      <EventPreviewImage
        event={event}
        alt=""
        className="h-full w-full object-cover"
        width={THUMBNAIL_PX}
        height={THUMBNAIL_PX}
        onUnavailable={() => setFailed(true)}
      />
    </div>
  );
}

function UpcomingEventRow({ item }: { item: UpcomingEvent }) {
  const { event, sectionDef } = item;
  const {
    parts: { day, month },
    weekday,
    time,
    isoDate,
  } = useEventDate(event);
  const { ctaLabel } = useUpcomingAction(event);
  const title = displayTitle(event);
  const teaser = upcomingTeaser(event.description);
  // Whether there's anywhere to send someone yet — a placeholder like a
  // not-yet-detailed community call gets a neutral "Soon" instead of green.
  const isConfirmed = isUpcomingConfirmed(event);

  return (
    <ActionSurface
      event={event}
      className="grid w-full grid-cols-[64px_minmax(0,1fr)_auto] items-start gap-4 rounded-md border border-ink-divider px-4 py-6 text-left transition-colors duration-150 hover:border-grove sm:grid-cols-[76px_minmax(0,1fr)_auto] sm:gap-7 sm:px-6"
    >
      <time dateTime={isoDate} className="grid gap-0.5 leading-none">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-secondary">
          {weekday}
        </span>
        <span
          className={`text-[32px] font-extrabold tracking-[-0.02em] ${isConfirmed ? "text-grove" : "text-ink"}`}
        >
          {day}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-secondary">
          {month}
        </span>
      </time>

      <div className="grid min-w-0 gap-2">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.1em] text-grove-deep">
          <span>{sectionDef.title}</span>
          {time && (
            <>
              <span className="text-ink-divider">/</span>
              <span className="text-ink-secondary">{time}</span>
            </>
          )}
        </div>
        <h3 className="text-2xl font-bold leading-[1.2] tracking-[-0.01em] text-ink">{title}</h3>
        {teaser && (
          <p className="max-w-[62ch] text-[15px] leading-[1.5] text-ink-secondary">{teaser}</p>
        )}
      </div>

      {/* Stacked on mobile so the thumbnail doesn't squeeze the title column. */}
      <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-start sm:gap-5">
        <RowThumbnail event={event} />
        {isConfirmed ? (
          <span className="whitespace-nowrap pt-1 text-sm font-bold text-grove">{ctaLabel} →</span>
        ) : (
          <span className="whitespace-nowrap pt-1 text-sm font-bold text-ink-secondary">Soon</span>
        )}
      </div>
    </ActionSurface>
  );
}

function NoUpcomingEvents() {
  return (
    <div className="rounded-md border border-dashed border-ink-divider bg-stone px-6 py-10 text-center">
      <p className={`text-ink-secondary ${TS_BODY_SIZE}`}>
        No upcoming events right now. Check back soon, or{" "}
        <a
          href="#past-events"
          className={`font-medium text-grove underline-offset-4 transition-colors duration-150 hover:text-grove-hover hover:underline ${FOCUS_RING}`}
        >
          browse recordings below
        </a>
        .
      </p>
    </div>
  );
}

export function UpcomingEventsSection({ events }: { events: EventItem[] }) {
  const { items, hasMore } = getUpcomingEvents(events, UPCOMING_WINDOW_DAYS);
  const { spotlight, rest } = splitSpotlight(items);

  return (
    <section aria-label="Upcoming Events">
      <div className="mb-2 flex items-baseline gap-3.5">
        <h2 className="text-[15px] font-bold tracking-[0.02em] text-ink">Upcoming</h2>
        <span className="text-xs font-bold text-ink-secondary">
          {formatUpcomingCount(items.length)}
        </span>
      </div>

      {items.length === 0 ? (
        <NoUpcomingEvents />
      ) : (
        <>
          {spotlight && <SpotlightEvent item={spotlight} />}
          {rest.length > 0 && (
            <div className="flex flex-col gap-4">
              {rest.map((item) => (
                <UpcomingEventRow key={item.event.id} item={item} />
              ))}
            </div>
          )}
        </>
      )}

      {hasMore && (
        <p className={`mt-6 text-ink-secondary ${TS_BODY_SMALL_SIZE}`}>
          More events are already scheduled beyond the next {UPCOMING_WINDOW_DAYS} days.
        </p>
      )}
    </section>
  );
}
