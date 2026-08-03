import { createContext, useCallback, useEffect, useRef, useState } from "react";
import type { EventItem } from "../../store/eventsClient";
import { copyAnchorLink } from "../../utils/copyAnchorLink";

export interface SelectedEvent {
  event: EventItem;
  isPast: boolean;
}

export const EventModalContext = createContext<(selected: SelectedEvent) => void>(() => {});

export interface DateParts {
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

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function parseDateParts(dateStr: string): DateParts {
  const [year, month, day] = dateStr.split("-");
  return {
    day: parseInt(day, 10),
    month: MONTH_NAMES[parseInt(month, 10) - 1],
    year,
    full: `${parseInt(day, 10)} ${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`,
  };
}

// Weekday is derived separately (rather than folded into DateParts) since only
// the Upcoming Events list needs it, for Kate's "how far out is this" ask.
export function weekdayAbbrev(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return WEEKDAY_NAMES[new Date(year, month - 1, day).getDay()];
}

export function ArrowRight({ size = 16 }: { size?: number }) {
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

export function ChevronDown({ size = 18, expanded }: { size?: number; expanded: boolean }) {
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

export function CloseIcon({ size = 18 }: { size?: number }) {
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

const SCROLL_EDGE_TOLERANCE_PX = 8;

// Drives the past-events carousel's arrow buttons and their visibility. Pure
// scroll bookkeeping shared by both the new (Tailwind) and legacy (MUI) past
// events carousels — only the rendered markup around it differs.
export function useCarouselScroll(itemCount: number) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > SCROLL_EDGE_TOLERANCE_PX);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - SCROLL_EDGE_TOLERANCE_PX);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = trackRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateScrollState, itemCount]);

  const scrollByCard = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-carousel-card]");
    const amount = card ? card.getBoundingClientRect().width + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: amount * direction });
  };

  return { trackRef, canScrollLeft, canScrollRight, updateScrollState, scrollByCard };
}

const COPIED_FEEDBACK_MS = 1500;

interface CategoryAnchorButtonProps {
  slug: string;
}

// A hashtag-style permalink button next to a category heading, so a specific
// section (e.g. Book Club) can be shared directly instead of the whole page.
export function CategoryAnchorButton({ slug }: CategoryAnchorButtonProps) {
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
        className="ts-editorial text-ink-secondary/40 transition-colors duration-150 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        #
      </button>
      {copied && (
        <span
          role="status"
          className="ts-caption absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-pill bg-ink px-2.5 py-1 text-page"
        >
          Copied!
        </span>
      )}
    </span>
  );
}
