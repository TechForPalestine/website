import { useEffect, useRef, useState } from "react";
import type { EventItem } from "../../store/eventsClient";
import { groupIntoSections } from "../../utils/eventSections";
import { eventPath } from "../../utils/eventSlug";
import { EventDetailsDialog } from "./EventDetailsDialog";
import { EventModalContext, type SelectedEvent } from "./EventsShared";
import { hasPastEvents, resolveSelectedEvent } from "./eventsLogic";
import { PastEventsCategorySection } from "./PastEventsSection";
import { TS_BODY_LARGE_SIZE, TS_BODY_SIZE } from "./typeScale";
import { UpcomingEventsSection } from "./UpcomingEventsSection";

interface EventsProps {
  events: EventItem[];
  loading?: boolean;
}

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
    const selected = resolveSelectedEvent(events, window.location.pathname);
    if (selected) setSelectedEvent(selected);
  }, [loading, events.length]);

  // Keeps the address bar and the modal in sync with browser back/forward.
  // Only ever reads the URL here — never pushes a new one — so this can't
  // stack extra history entries on top of what pushEvent/closeModal already
  // pushed.
  useEffect(() => {
    const onPopState = () => {
      setSelectedEvent(resolveSelectedEvent(events, window.location.pathname));
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

  return (
    <EventModalContext.Provider value={openEvent}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        {loading && events.length === 0 && <LoadingSkeleton />}

        {!loading && events.length === 0 && <EmptyState />}

        {events.length > 0 && (
          <div>
            <UpcomingEventsSection events={events} />

            {hasPastEvents(sections) && (
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
