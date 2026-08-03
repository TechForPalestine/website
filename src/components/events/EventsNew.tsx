import { useEffect, useState } from "react";
import type { EventItem } from "../../store/eventsClient";
import { groupIntoSections } from "../../utils/eventSections";
import { EventModalContext, type SelectedEvent } from "./eventsShared";
import { EventModal } from "./EventModal";
import { UpcomingEventsSection } from "./UpcomingEvents";
import { PastEventsCategorySection } from "./PastEventsCarousel";

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

interface EventsNewProps {
  initialEvents?: EventItem[];
}

export default function EventsNew({ initialEvents = [] }: EventsNewProps) {
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

  // Direct links to a category (e.g. /events-new#book-club) land here before
  // this island has rendered its sections, so the browser's native hash jump
  // has nothing to scroll to yet. This page scrolls via Lenis (window.__lenis),
  // which intercepts native scrolling, so once content is up we scroll to the
  // hash target ourselves — same pattern as the modal's Lenis stop/start.
  useEffect(() => {
    if (loading) return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const target = document.getElementById(hash);
    if (!target) return;

    const lenis = (window as any).__lenis;
    if (lenis?.scrollTo) {
      lenis.scrollTo(target);
    } else {
      target.scrollIntoView({ block: "start" });
    }
  }, [loading]);

  const sections = groupIntoSections(events);
  const hasPastEvents = sections.some((section) => section.past.length > 0);

  return (
    <EventModalContext.Provider value={setSelectedEvent}>
      <div className="pb-16 min-[810px]:pb-24">
        {loading ? (
          <LoadingSkeleton />
        ) : events.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <UpcomingEventsSection events={events} />

            {hasPastEvents && (
              <div id="past-events" className="scroll-mt-24 bg-page px-6 pt-14 min-[810px]:px-10 min-[810px]:pt-20">
                <div className="mx-auto max-w-[1400px] border-t border-ink-divider pt-14 min-[810px]:pt-16">
                  <h2 className="ts-editorial text-ink">Past Events</h2>
                </div>
              </div>
            )}
            {sections.map((section) => (
              <PastEventsCategorySection key={section.def.key} section={section} />
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
