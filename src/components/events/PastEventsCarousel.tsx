import { useContext, useState } from "react";
import { hasMeaningfulDescription, primaryEventLink, type EventItem } from "../../store/eventsClient";
import { displayTitle, type EventSection } from "../../utils/eventSections";
import {
  ArrowRight,
  CategoryAnchorButton,
  ChevronDown,
  EventModalContext,
  parseDateParts,
  useCarouselScroll,
} from "./eventsShared";
import { EventPreviewImage } from "./EventPreviewImage";

interface PastEventCardProps {
  event: EventItem;
}

function PastEventCard({ event }: PastEventCardProps) {
  const { full } = parseDateParts(event.date);
  const openModal = useContext(EventModalContext);
  const showPopup = hasMeaningfulDescription(event);
  const { link: infoLink, label: infoLabel } = primaryEventLink(event, true);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[16px] border border-butter bg-page">
      <div className="flex aspect-video items-center justify-center overflow-hidden bg-sand">
        <EventPreviewImage event={event} alt={displayTitle(event)} className="h-full w-full object-contain" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="ts-body-small text-ink-secondary">{full}</p>

        <h3 className="ts-label line-clamp-2 text-ink">{displayTitle(event)}</h3>

        <div className="mt-auto pt-2">
          {showPopup ? (
            <button
              type="button"
              onClick={() => openModal({ event, isPast: true })}
              className="ts-label text-brand transition-colors duration-150 hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              More info
            </button>
          ) : infoLink ? (
            <a
              href={infoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="ts-label text-brand transition-colors duration-150 hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {infoLabel}
            </a>
          ) : (
            <span className="ts-label text-ink-secondary/50">—</span>
          )}
        </div>
      </div>
    </article>
  );
}

interface PastEventsCarouselProps {
  events: EventItem[];
}

// A horizontal, uniform-card carousel — deliberately not a "featured 2 +
// hidden rest" list, since every card here needs equal visual weight (no
// event should look more prominent than another in an archive). Cards are
// sized so ~3.5 are visible on desktop, narrowing on smaller viewports; the
// partial trailing card is a native side effect of overflow, not a manual
// crop, so it always matches however many actually fit.
function PastEventsCarousel({ events }: PastEventsCarouselProps) {
  const { trackRef, canScrollLeft, canScrollRight, updateScrollState, scrollByCard } =
    useCarouselScroll(events.length);

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          aria-label="Show earlier past events"
          className="absolute -left-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 rotate-180 items-center justify-center rounded-full bg-butter text-ink shadow-sm transition-colors duration-150 hover:bg-brand hover:text-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand min-[640px]:flex"
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
        className="flex gap-4 overflow-x-auto motion-safe:scroll-smooth motion-reduce:scroll-auto focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
            className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-page to-transparent"
          />
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            aria-label="Show more past events"
            className="absolute -right-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-butter text-ink shadow-sm transition-colors duration-150 hover:bg-brand hover:text-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand min-[640px]:flex"
          >
            <ArrowRight size={18} />
          </button>
        </>
      )}
    </div>
  );
}

interface PastEventsCategorySectionProps {
  section: EventSection;
}

// Renders a category as a pure archive: no featured/highlighted cards, since
// mixing weights here is exactly what made the old page confusing. A category
// with zero past events is skipped entirely (its anchor link is only valid
// once it has at least one past event to show).
export function PastEventsCategorySection({ section }: PastEventsCategorySectionProps) {
  const { def, past } = section;
  const [expanded, setExpanded] = useState(true);

  if (past.length === 0) return null;

  return (
    <section
      id={def.key}
      className="scroll-mt-24 border-t border-ink-divider bg-page px-6 py-12 min-[810px]:px-10 min-[810px]:py-16"
      aria-label={def.title}
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="ts-editorial mb-3 flex items-center gap-2 text-ink">
              <CategoryAnchorButton slug={def.key} />
              {def.title}
            </h2>
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
          <div className="mt-8">
            <PastEventsCarousel events={past} />
          </div>
        )}
      </div>
    </section>
  );
}
