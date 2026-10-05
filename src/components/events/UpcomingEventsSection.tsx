import { useContext } from "react";
import {
  hasMeaningfulDescription,
  primaryEventLink,
  type EventItem,
} from "../../store/eventsClient";
import { displayTitle, getUpcomingEvents, type UpcomingEvent } from "../../utils/eventSections";
import { EventModalContext, useEventDate } from "./EventsShared";
import { formatUpcomingCount, upcomingTeaser } from "./eventsLogic";
import { TS_BODY_SIZE, TS_BODY_SMALL_SIZE } from "./typeScale";

const UPCOMING_WINDOW_DAYS = 60;

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
  const teaser = upcomingTeaser(event.description);
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
      <button
        type="button"
        onClick={() => openModal({ event, isPast: false })}
        className={rowClasses}
      >
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

export function UpcomingEventsSection({ events }: { events: EventItem[] }) {
  const { items, hasMore } = getUpcomingEvents(events, UPCOMING_WINDOW_DAYS);

  return (
    <section aria-label="Upcoming Events">
      <div className="mb-2 flex items-baseline gap-3.5">
        <h2 className="text-[15px] font-semibold tracking-[0.02em] text-gray-900">Upcoming</h2>
        <span className="text-xs font-semibold text-gray-400">
          {formatUpcomingCount(items.length)}
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
