import { useContext, useState } from "react";
import { hasMeaningfulDescription, primaryEventLink, type EventItem } from "../../store/eventsClient";
import { displayTitle, type EventSection } from "../../utils/eventSections";
import { copyAnchorLink } from "../../utils/copyAnchorLink";
import { EventPreviewImage } from "./EventPreviewImage";
import {
  ArrowRight,
  ChevronDown,
  EventModalContext,
  useCarouselScroll,
  useEventDate,
} from "./EventsShared";
import { TS_CAPTION_SIZE } from "./typeScale";

const COPIED_FEEDBACK_MS = 1500;

const CAROUSEL_ARROW_CLASSES =
  "absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-gray-100 text-gray-700 shadow-sm transition-colors duration-150 hover:bg-[#EA4335] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4335] sm:flex";

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
export function PastEventsCategorySection({ section }: { section: EventSection }) {
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
