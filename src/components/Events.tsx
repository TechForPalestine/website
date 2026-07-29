import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Card,
  Button,
  Link,
  Fade,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  Chip,
} from "@mui/material";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import { hasMeaningfulDescription, primaryEventLink, type EventItem } from "../store/eventsClient";
import {
  displayTitle,
  getUpcomingEvents,
  groupIntoSections,
  type EventSection,
  type UpcomingEvent,
} from "../utils/eventSections";
import { copyAnchorLink } from "../utils/copyAnchorLink";
import { parseEventDescription, renderInlineText } from "../utils/eventDescription";

const UPCOMING_WINDOW_DAYS = 60;
const COPIED_FEEDBACK_MS = 1500;
const SCROLL_EDGE_TOLERANCE_PX = 8;

// This page's own accent palette — same structure/content as the new-design
// events page, deliberately kept on this site's original MUI colors rather
// than the new page's cream/rose design tokens.
const RED = "#EA4335";
const RED_HOVER = "#C5341F";
const GREEN = "#168039";

interface SelectedEvent {
  event: EventItem;
  isPast: boolean;
}

const EventModalContext = createContext<(selected: SelectedEvent) => void>(() => {});

interface EventsProps {
  events: EventItem[];
  loading?: boolean;
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

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseDateParts(dateStr: string): DateParts {
  const [year, month, day] = dateStr.split("-");
  return {
    day: parseInt(day, 10),
    month: MONTH_NAMES[parseInt(month, 10) - 1],
    year,
    full: `${parseInt(day, 10)} ${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`,
  };
}

function weekdayAbbrev(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return WEEKDAY_NAMES[new Date(year, month - 1, day).getDay()];
}

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
    <Box component="span" className="relative inline-flex shrink-0">
      <Link
        component="button"
        type="button"
        onClick={handleClick}
        aria-label="Copy link to this section"
        className="font-bold no-underline"
        sx={{ color: "grey.400", fontSize: "1.25rem", "&:hover": { color: RED } }}
      >
        #
      </Link>
      {copied && (
        <Typography
          component="span"
          role="status"
          className="absolute left-1/2 whitespace-nowrap rounded-full px-3 py-1 text-white"
          sx={{ top: -34, transform: "translateX(-50%)", backgroundColor: "grey.900", fontSize: "0.75rem" }}
        >
          Copied!
        </Typography>
      )}
    </Box>
  );
}

function EventDescription({ text }: { text: string }) {
  const blocks = parseEventDescription(text);

  return (
    <Box className="flex flex-col gap-3 break-words">
      {blocks.map((block, i) => {
        if (block.type === "hr") {
          return <Box key={i} component="hr" className="border-gray-200" />;
        }
        if (block.type === "heading") {
          return (
            <Typography key={i} variant="subtitle1" className="font-bold text-gray-900">
              {renderInlineText(block.text, `h-${i}`)}
            </Typography>
          );
        }
        if (block.type === "list") {
          return (
            <Box
              key={i}
              component={block.ordered ? "ol" : "ul"}
              className={block.ordered ? "list-decimal pl-5" : "list-disc pl-5"}
            >
              {block.items.map((item, j) => (
                <Typography key={j} component="li" variant="body2" className="text-gray-600">
                  {renderInlineText(item, `l-${i}-${j}`)}
                </Typography>
              ))}
            </Box>
          );
        }
        return (
          <Typography key={i} variant="body2" className="text-gray-600">
            {renderInlineText(block.text, `p-${i}`)}
          </Typography>
        );
      })}
    </Box>
  );
}

function EventDetailsDialog({
  selected,
  onClose,
}: {
  selected: SelectedEvent | null;
  onClose: () => void;
}) {
  if (!selected) return null;
  const { event, isPast } = selected;
  const { day, month, year, full } = parseDateParts(event.date);
  const { link: infoLink, label: infoLabel } = primaryEventLink(event, isPast);
  const title = displayTitle(event);

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <Box className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-gray-100">
        <img src={event.image} alt={title} className="h-full w-full object-contain" />
        <IconButton
          onClick={onClose}
          aria-label="Close"
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            backgroundColor: "#fff",
            "&:hover": { backgroundColor: RED, color: "#fff" },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent className="flex flex-col gap-4">
        <time dateTime={event.date}>
          <Typography
            component="span"
            className="block font-bold leading-none"
            sx={{ color: RED, fontSize: "2rem" }}
          >
            {day}
          </Typography>
          <Typography component="span" variant="caption" className="block text-gray-500">
            {month} {year}
          </Typography>
        </time>

        <Typography variant="h5" className="font-bold tracking-tight text-gray-900">
          {title}
        </Typography>

        <Typography variant="body2" className="text-gray-500">
          {full}
          {event.time && <span> · {event.time}</span>}
        </Typography>

        {event.description && <EventDescription text={event.description} />}
      </DialogContent>
      {(infoLink || event.locationLink) && (
        <DialogActions className="flex-wrap gap-4 border-t border-gray-200 px-6 py-4">
          {infoLink && (
            <Button
              href={infoLink}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              endIcon={<ArrowForwardIcon fontSize="small" />}
              sx={{
                backgroundColor: RED,
                "&:hover": { backgroundColor: RED_HOVER },
              }}
            >
              {infoLabel}
            </Button>
          )}
          {event.locationLink && (
            <Link
              href={event.locationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gray-600 hover:underline"
            >
              View location
            </Link>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}

// ---------- Upcoming Events ----------

function UpcomingEventCard({ item }: { item: UpcomingEvent }) {
  const { event, sectionDef } = item;
  const { day, month } = parseDateParts(event.date);
  const weekday = weekdayAbbrev(event.date);
  const openModal = useContext(EventModalContext);
  const showPopup = hasMeaningfulDescription(event);
  const { link: infoLink, label: infoLabel } = primaryEventLink(event, false);
  const title = displayTitle(event);

  return (
    <Box
      className="flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:gap-6"
      sx={{ border: "1px solid", borderColor: "grey.200", borderLeft: `4px solid ${RED}` }}
    >
      <time dateTime={event.date} className="flex shrink-0 flex-col items-center">
        <Typography variant="caption" className="text-gray-500">
          {weekday}
        </Typography>
        <Typography className="font-bold leading-none" sx={{ color: RED, fontSize: "1.75rem" }}>
          {day}
        </Typography>
        <Typography variant="caption" className="text-gray-500">
          {month}
        </Typography>
      </time>

      <Box className="min-w-0 flex-1">
        <Chip
          label={sectionDef.title}
          size="small"
          className="mb-1.5"
          sx={{ backgroundColor: "grey.100", fontWeight: 600 }}
        />
        <Typography variant="subtitle1" className="truncate font-bold text-gray-900">
          {title}
        </Typography>
        {event.time && (
          <Typography variant="body2" className="text-gray-500">
            {event.time}
          </Typography>
        )}
      </Box>

      <Box className="flex shrink-0 flex-wrap items-center gap-4">
        {showPopup ? (
          <Button
            onClick={() => openModal({ event, isPast: false })}
            variant="contained"
            endIcon={<ArrowForwardIcon fontSize="small" />}
            sx={{ backgroundColor: RED, "&:hover": { backgroundColor: RED_HOVER } }}
          >
            More info
          </Button>
        ) : infoLink ? (
          <Button
            href={infoLink}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            endIcon={<ArrowForwardIcon fontSize="small" />}
            sx={{ backgroundColor: RED, "&:hover": { backgroundColor: RED_HOVER } }}
          >
            {infoLabel}
          </Button>
        ) : (
          <Typography variant="body2" className="text-gray-300">
            —
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function NoUpcomingEvents() {
  return (
    <Box
      className="rounded-2xl border border-dashed px-6 py-10 text-center"
      sx={{ borderColor: "grey.300", backgroundColor: "grey.50" }}
    >
      <Typography variant="body1" className="text-gray-600">
        No upcoming events right now — check back soon, or{" "}
        <Link href="#past-events" sx={{ color: RED }} className="hover:underline">
          browse recordings below
        </Link>
        .
      </Typography>
    </Box>
  );
}

function UpcomingEventsSection({ events }: { events: EventItem[] }) {
  const { items, hasMore } = getUpcomingEvents(events, UPCOMING_WINDOW_DAYS);

  return (
    <Box component="section" aria-label="Upcoming Events">
      <Typography variant="h4" className="mb-8 font-bold tracking-tight text-gray-900">
        Upcoming Events
      </Typography>

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
        <Typography variant="body2" className="mt-6 text-gray-500">
          More events are already scheduled beyond the next {UPCOMING_WINDOW_DAYS} days.
        </Typography>
      )}
    </Box>
  );
}

// ---------- Past Events ----------

function PastEventCard({ event }: { event: EventItem }) {
  const [imgFailed, setImgFailed] = useState(false);
  const { full } = parseDateParts(event.date);
  const openModal = useContext(EventModalContext);
  const showPopup = hasMeaningfulDescription(event);
  const { link: infoLink, label: infoLabel } = primaryEventLink(event, true);
  const title = displayTitle(event);

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-2xl" sx={{ border: "1px solid", borderColor: "grey.200" }}>
      <Box className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-gray-100">
        <img
          src={imgFailed ? "/images/default.jpg" : event.image}
          alt={title}
          className="h-full w-full object-contain"
          onError={() => setImgFailed(true)}
          loading="lazy"
          decoding="async"
        />
      </Box>
      <Box className="flex flex-1 flex-col gap-2 p-4">
        <Typography variant="body2" className="text-gray-500">
          {full}
        </Typography>
        <Typography variant="subtitle2" className="line-clamp-2 font-bold text-gray-900">
          {title}
        </Typography>
        <Box className="mt-auto pt-2">
          {showPopup ? (
            <Link
              component="button"
              type="button"
              onClick={() => openModal({ event, isPast: true })}
              className="font-medium hover:underline"
              sx={{ color: GREEN }}
            >
              More info
            </Link>
          ) : infoLink ? (
            <Link
              href={infoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline"
              sx={{ color: GREEN }}
            >
              {infoLabel}
            </Link>
          ) : (
            <Typography variant="body2" className="text-gray-300">
              —
            </Typography>
          )}
        </Box>
      </Box>
    </Card>
  );
}

// A horizontal, uniform-card carousel — every past event gets equal visual
// weight (no "featured 2 + hidden rest" split). Cards are sized so ~3.5 are
// visible on desktop, narrowing on smaller viewports; the partial trailing
// card is a native side effect of overflow, not a manual crop. Mirrors the
// same component on /events-new.
function PastEventsCarousel({ events }: { events: EventItem[] }) {
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
  }, [updateScrollState, events.length]);

  const scrollByCard = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-carousel-card]");
    const amount = card ? card.getBoundingClientRect().width + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: amount * direction });
  };

  return (
    <Box className="relative">
      {canScrollLeft && (
        <IconButton
          onClick={() => scrollByCard(-1)}
          aria-label="Show earlier past events"
          sx={{
            display: { xs: "none", sm: "flex" },
            position: "absolute",
            top: "50%",
            left: -12,
            zIndex: 10,
            transform: "translateY(-50%)",
            width: 44,
            height: 44,
            padding: 0,
            backgroundColor: "grey.100",
            boxShadow: 1,
            "&:hover": { backgroundColor: RED, color: "#fff" },
          }}
        >
          <ChevronLeftIcon />
        </IconButton>
      )}

      <Box
        ref={trackRef}
        onScroll={updateScrollState}
        role="region"
        aria-roledescription="carousel"
        aria-label="Past events"
        tabIndex={0}
        className="flex gap-4 overflow-x-auto motion-safe:scroll-smooth motion-reduce:scroll-auto focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EA4335] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {events.map((event) => (
          <div key={event.id} data-carousel-card className="w-[68%] shrink-0 min-[640px]:w-[42%] min-[900px]:w-[29%]">
            <PastEventCard event={event} />
          </div>
        ))}
      </Box>

      {canScrollRight && (
        <IconButton
          onClick={() => scrollByCard(1)}
          aria-label="Show more past events"
          sx={{
            display: { xs: "none", sm: "flex" },
            position: "absolute",
            top: "50%",
            right: -12,
            zIndex: 10,
            transform: "translateY(-50%)",
            width: 44,
            height: 44,
            padding: 0,
            backgroundColor: "grey.100",
            boxShadow: 1,
            "&:hover": { backgroundColor: RED, color: "#fff" },
          }}
        >
          <ChevronRightIcon />
        </IconButton>
      )}
    </Box>
  );
}

// Renders a category as a pure archive: no featured/highlighted cards. A
// category with zero past events is skipped entirely (its anchor link is
// only valid once it has at least one past event to show).
function PastEventsCategorySection({ section }: { section: EventSection }) {
  const { def, past } = section;
  const [expanded, setExpanded] = useState(true);

  if (past.length === 0) return null;

  return (
    <Box
      component="section"
      id={def.key}
      aria-label={def.title}
      className="border-t pt-12"
      sx={{ borderColor: "grey.200", scrollMarginTop: "96px" }}
    >
      <Box className="flex items-start justify-between gap-4">
        <Box>
          <Typography variant="h5" className="mb-1 flex items-center gap-2 font-bold tracking-tight text-gray-900">
            <CategoryAnchorButton slug={def.key} />
            {def.title}
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            {def.subtitle}
          </Typography>
        </Box>
        <IconButton
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse section" : "Expand section"}
          className="shrink-0"
          sx={{
            backgroundColor: "grey.100",
            "&:hover": { backgroundColor: RED, color: "#fff" },
          }}
        >
          <ExpandMoreIcon
            sx={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s" }}
          />
        </IconButton>
      </Box>

      {expanded && (
        <Box className="mt-8">
          <PastEventsCarousel events={past} />
        </Box>
      )}
    </Box>
  );
}

export default function Events({
  events: initialEvents,
  loading: initialLoading = false,
}: EventsProps) {
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [loading, setLoading] = useState(initialLoading);
  const [showEvents, setShowEvents] = useState(initialEvents.length > 0);
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);

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
        setShowEvents(newEvents.length > 0);
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
      if (initialEvents.length > 0) {
        setShowEvents(true);
      }
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

  const sections = groupIntoSections(events);
  const hasPastEvents = sections.some((section) => section.past.length > 0);

  return (
    <EventModalContext.Provider value={setSelectedEvent}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        {loading && events.length === 0 && (
          <div className="space-y-6">
            {[...Array(3)].map((_, index) => (
              <Box
                key={`skeleton-${index}`}
                className="animate-pulse rounded-lg bg-gray-100 p-6 shadow"
              >
                <div className="mb-2 h-4 w-2/3 rounded bg-gray-200"></div>
                <div className="mb-2 h-3 w-1/3 rounded bg-gray-200"></div>
                <div className="h-24 w-full rounded bg-gray-200"></div>
              </Box>
            ))}
          </div>
        )}

        {!loading && events.length === 0 && (
          <Fade in={!loading && events.length === 0}>
            <Box className="py-12 text-center">
              <EventBusyIcon
                sx={{
                  fontSize: 64,
                  color: "text.secondary",
                  marginBottom: 2,
                  opacity: 0.5,
                }}
              />
              <Typography variant="h6" className="mb-2 text-gray-700">
                No events found
              </Typography>
              <Typography variant="body2" className="text-gray-500">
                There are no events available at the moment. Check back later!
              </Typography>
            </Box>
          </Fade>
        )}

        {events.length > 0 && (
          <Fade in={showEvents} timeout={500}>
            <div>
              <UpcomingEventsSection events={events} />

              {hasPastEvents && (
                <Box
                  id="past-events"
                  component="section"
                  className="border-t pt-14"
                  sx={{ borderColor: "grey.200", scrollMarginTop: "96px" }}
                >
                  <Typography variant="h4" className="font-bold tracking-tight text-gray-900">
                    Past Events
                  </Typography>
                </Box>
              )}

              <div className="mt-12 space-y-12">
                {sections.map((section) => (
                  <PastEventsCategorySection key={section.def.key} section={section} />
                ))}
              </div>
            </div>
          </Fade>
        )}
      </div>
      <EventDetailsDialog selected={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </EventModalContext.Provider>
  );
}
