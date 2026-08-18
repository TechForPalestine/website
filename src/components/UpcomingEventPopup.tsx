import { useEffect, useState } from "react";
import { primaryEventLink, type EventItem } from "../store/eventsClient";
import { displayTitle, getUpcomingEvents } from "../utils/eventSections";
import { EventPreviewImage } from "./events/EventPreviewImage";
import { ArrowRight, CloseIcon, useEventDate } from "./events/eventsShared";

const SHOW_DELAY_MS = 2000;
const UPCOMING_WINDOW_DAYS = 60;
const DISMISSED_KEY = "dismissed_event_popup_id";
/** Beyond this many days out, a relative label ("In 6 days") reads as noise
 * rather than urgency, so the popup falls back to the plain weekday/date. */
const URGENCY_WINDOW_DAYS = 6;

function track(name: string, event: EventItem) {
  if (typeof window.plausible === "undefined") return;
  window.plausible(name, { props: { event_id: event.id, event_title: event.title } });
}

/** "Today" / "Tomorrow" / "In N days" for events happening soon, or null once
 * an event is far enough out that urgency framing would be misleading. */
function relativeDayLabel(isoDate: string): string | null {
  const [year, month, day] = isoDate.split("-").map(Number);
  const eventDay = new Date(year, month - 1, day);
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((eventDay.getTime() - todayMidnight.getTime()) / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 1 && diffDays <= URGENCY_WINDOW_DAYS) return `In ${diffDays} days`;
  return null;
}

function PopupCard({
  event,
  entered,
  onClose,
}: {
  event: EventItem;
  entered: boolean;
  onClose: () => void;
}) {
  const {
    parts: { day, month },
    weekday,
    time,
    isoDate,
  } = useEventDate(event);
  const { link, label } = primaryEventLink(event, false);
  // "Register" reads as a form to fill out; "Save my spot" reads as claiming
  // something scarce. Overridden here rather than in primaryEventLink()
  // itself, since that label is shared with the full /events page and its
  // cards, where the more neutral wording still fits.
  const ctaLabel = label === "Register" ? "Save my spot" : label;
  const urgency = relativeDayLabel(isoDate);
  const title = displayTitle(event);

  return (
    <div
      role="dialog"
      aria-label="Upcoming event"
      className={`fixed bottom-4 left-4 right-4 z-40 mx-auto flex max-w-sm flex-row items-center gap-3 overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-lg transition-all duration-300 ease-out sm:left-auto sm:right-6 sm:mx-0 sm:flex-col sm:items-stretch sm:gap-0 sm:p-0 motion-reduce:transition-none ${entered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
    >
      <div className="relative shrink-0 sm:shrink">
        <EventPreviewImage
          event={event}
          alt=""
          className="h-14 w-14 rounded-lg bg-gray-100 object-cover sm:aspect-video sm:h-auto sm:w-full sm:rounded-none"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="absolute right-2 top-2 hidden h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm transition-colors duration-150 hover:bg-[#EA4335] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4335] sm:flex"
        >
          <CloseIcon size={16} />
        </button>
      </div>

      <div className="min-w-0 flex-1 sm:flex-none sm:p-4">
        {urgency && (
          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-[#EA4335]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#EA4335]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#EA4335]" />
            {urgency}
          </span>
        )}
        <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-500">
          {weekday}, {month} {day}
          {time ? ` · ${time}` : ""}
        </p>
        {/* The title links to the same registration page as the CTA below —
            that page has the full event details, so it doubles as a "more
            info" surface for anyone who reads the headline before noticing
            the button. */}
        <h3 className="truncate font-bold text-gray-900">
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("Event Popup Title Click", event)}
              className="hover:underline"
            >
              {title}
            </a>
          ) : (
            title
          )}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("Event Popup Register Click", event)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#EA4335] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-[#C5341F] hover:shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4335]"
            >
              {ctaLabel}
              <ArrowRight size={15} />
            </a>
          )}
          <a
            href="/events"
            onClick={() => track("Event Popup All Events Click", event)}
            className="text-sm font-medium text-gray-600 underline-offset-4 hover:text-gray-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4335]"
          >
            All events
          </a>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4335] sm:hidden"
      >
        <CloseIcon size={16} />
      </button>
    </div>
  );
}

// A dismissible bottom-corner card promoting the soonest upcoming event, to
// drive event sign-ups from the homepage without blocking the page like a
// center modal would. Shows once per event: dismissing it is remembered per
// event id, so it won't nag on repeat visits, but a *different* upcoming
// event will still get its own chance to show.
export default function UpcomingEventPopup() {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/events")
      .then((r) => (r.ok ? r.json() : []))
      .then((events: EventItem[]) => {
        if (cancelled) return;
        const { items } = getUpcomingEvents(events, UPCOMING_WINDOW_DAYS);
        const next = items[0]?.event;
        if (!next || !primaryEventLink(next, false).link) return;
        if (localStorage.getItem(DISMISSED_KEY) === next.id) return;

        window.setTimeout(() => {
          if (cancelled) return;
          setEvent(next);
          track("Event Popup Shown", next);
          // Mount first (off-screen/transparent per its initial classes), then
          // flip to the entered state on the next frame so the browser has a
          // "before" state to transition from — setting both at once would
          // just paint the final state directly with no visible motion.
          requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
        }, SHOW_DELAY_MS);
      })
      .catch(() => {
        // ponytail: silent fail — a promo popup isn't worth surfacing an error for
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!event) return null;

  const handleClose = () => {
    localStorage.setItem(DISMISSED_KEY, event.id);
    track("Event Popup Dismissed", event);
    setEntered(false);
    window.setTimeout(() => setEvent(null), 300);
  };

  return <PopupCard event={event} entered={entered} onClose={handleClose} />;
}
