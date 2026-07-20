import React, { createContext, useContext, useState, useEffect } from "react";
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
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";
import { hasMeaningfulDescription, primaryEventLink, type EventItem } from "../store/eventsClient";
import { groupIntoSections, type EventSection } from "../utils/eventSections";
import { buildGoogleCalendarLink } from "../utils/googleCalendarLink";
import { toWebcalUrl } from "../utils/webcal";
import { parseEventDescription, renderInlineText } from "../utils/eventDescription";

const PAST_EVENTS_PAGE_SIZE = 5;

// This page's own accent palette — same structure as the new-design events
// page, different colors to match the site's existing MUI look.
const RED = "#EA4335";
const RED_HOVER = "#C5341F";
const GREEN = "#168039";
// Dedicated "Upcoming" status color — kept separate from GREEN (used for
// action links) so it stays consistent with the same muted sage used on
// the new-design events page instead of a generic bright green.
const POSITIVE = "#5C7A52";
const POSITIVE_TINT = "#EDF1E8";

interface SelectedEvent {
  event: EventItem;
  isPast: boolean;
}

const EventModalContext = createContext<(selected: SelectedEvent) => void>(() => {});

function isEventPast(event: EventItem): boolean {
  return !event.dateUtcIso || new Date(event.dateUtcIso).getTime() < Date.now();
}

interface EventsProps {
  events: EventItem[];
  loading?: boolean;
  icsUrl?: string;
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

function parseDateParts(dateStr: string): DateParts {
  const [year, month, day] = dateStr.split("-");
  return {
    day: parseInt(day, 10),
    month: MONTH_NAMES[parseInt(month, 10) - 1],
    year,
    full: `${parseInt(day, 10)} ${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`,
  };
}

function SubscribeNote({ icsUrl }: { icsUrl: string }) {
  if (!icsUrl) return null;

  return (
    <Box className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4">
      <Typography variant="body2" className="text-gray-600">
        Want every new T4P event on your own calendar automatically?
      </Typography>
      <Link
        href={toWebcalUrl(icsUrl)}
        className="flex items-center gap-1 font-medium hover:underline"
        sx={{ color: GREEN }}
      >
        <EventAvailableIcon fontSize="small" className="mr-1" />
        Subscribe to this calendar
      </Link>
    </Box>
  );
}

function EventDescription({ text }: { text: string }) {
  const blocks = parseEventDescription(text);

  return (
    <Box className="flex flex-col gap-3">
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
  const calendarLink = isPast ? null : buildGoogleCalendarLink(event);

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <Box className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-gray-100">
        <img src={event.image} alt={event.title} className="h-full w-full object-contain" />
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
          {event.title}
        </Typography>

        <Typography variant="body2" className="text-gray-500">
          {full}
          {event.time && <span> · {event.time}</span>}
        </Typography>

        {event.description && <EventDescription text={event.description} />}
      </DialogContent>
      {(infoLink || event.locationLink || calendarLink) && (
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
          {calendarLink && (
            <Link
              href={calendarLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-medium text-gray-600 hover:underline"
            >
              <EventAvailableIcon fontSize="small" className="mr-1" />
              Add to calendar
            </Link>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}

function FeaturedEventCard({ event, isPast }: { event: EventItem; isPast: boolean }) {
  const [imgFailed, setImgFailed] = useState(false);
  const { day, month, year } = parseDateParts(event.date);
  const calendarLink = isPast ? null : buildGoogleCalendarLink(event);
  const openModal = useContext(EventModalContext);
  const showPopup = hasMeaningfulDescription(event);
  const { link: infoLink, label: infoLabel } = primaryEventLink(event, isPast);

  return (
    <Card
      className="flex flex-col overflow-hidden rounded-2xl"
      sx={
        isPast
          ? { border: "1px solid", borderColor: "grey.200" }
          : { border: "2px solid", borderColor: POSITIVE, backgroundColor: POSITIVE_TINT }
      }
    >
      <Box className="flex aspect-[16/10] items-center justify-center overflow-hidden bg-gray-100">
        <img
          src={imgFailed ? "/images/default.jpg" : event.image}
          alt={event.title}
          className="h-full w-full object-contain"
          onError={() => setImgFailed(true)}
          loading="lazy"
          decoding="async"
        />
      </Box>
      <Box className="flex flex-1 flex-col gap-3 p-6">
        <Box className="flex items-start justify-between gap-3">
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
          {!isPast && (
            <Chip
              label="UPCOMING"
              sx={{
                backgroundColor: POSITIVE,
                color: "#fff",
                fontWeight: 700,
                letterSpacing: "0.04em",
              }}
            />
          )}
        </Box>

        <Typography variant="h6" className="font-bold tracking-tight text-gray-900">
          {event.title}
        </Typography>

        {event.time && (
          <Box className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <AccessTimeIcon fontSize="small" />
              {event.time}
            </span>
          </Box>
        )}

        {event.description && (
          <Typography variant="body2" className="line-clamp-3 text-gray-600">
            {event.description}
          </Typography>
        )}

        <Box className="mt-auto flex flex-wrap items-center gap-4 pt-2">
          {showPopup ? (
            <Button
              onClick={() => openModal({ event, isPast })}
              variant="contained"
              endIcon={<ArrowForwardIcon fontSize="small" />}
              sx={{
                backgroundColor: RED,
                "&:hover": { backgroundColor: RED_HOVER },
              }}
            >
              More info
            </Button>
          ) : (
            infoLink && (
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
            )
          )}
          {calendarLink && (
            <Link
              href={calendarLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-medium text-gray-600 hover:underline"
            >
              <EventAvailableIcon fontSize="small" className="mr-1" />
              Add to calendar
            </Link>
          )}
        </Box>
      </Box>
    </Card>
  );
}

function PastEventRow({ event }: { event: EventItem }) {
  const { full } = parseDateParts(event.date);
  const openModal = useContext(EventModalContext);
  const isPast = isEventPast(event);
  const showPopup = hasMeaningfulDescription(event);
  const { link: infoLink, label: infoLabel } = primaryEventLink(event, isPast);

  return (
    <Box className="border-b border-gray-200 py-3 last:border-b-0">
      <Box className="flex items-center justify-between gap-4">
        <Box className="flex min-w-0 flex-1 items-center gap-2">
          {!isPast && (
            <Chip
              label="UPCOMING"
              size="small"
              className="shrink-0"
              sx={{
                backgroundColor: POSITIVE,
                color: "#fff",
                fontWeight: 700,
                letterSpacing: "0.04em",
                height: 22,
              }}
            />
          )}
          <Typography className="min-w-0 truncate font-medium text-gray-900">
            {event.title}
          </Typography>
        </Box>
        {showPopup ? (
          <Link
            component="button"
            type="button"
            onClick={() => openModal({ event, isPast })}
            className="shrink-0 font-medium hover:underline"
            sx={{ color: GREEN }}
          >
            More info
          </Link>
        ) : infoLink ? (
          <Link
            href={infoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 font-medium hover:underline"
            sx={{ color: GREEN }}
          >
            {infoLabel}
          </Link>
        ) : (
          <Typography variant="body2" className="shrink-0 text-gray-300">
            —
          </Typography>
        )}
      </Box>
      <Typography variant="body2" className="mt-1 text-gray-500">
        {full}
        {event.time && <span> · {event.time}</span>}
      </Typography>
    </Box>
  );
}

function PastEventsList({ events }: { events: EventItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? events : events.slice(0, PAST_EVENTS_PAGE_SIZE);
  const remaining = events.length - visible.length;

  return (
    <div>
      <Typography variant="overline" className="mb-4 block text-gray-500">
        Past events
      </Typography>
      <div>
        {visible.map((event) => (
          <PastEventRow key={event.id} event={event} />
        ))}
      </div>
      {remaining > 0 && (
        <Button
          size="small"
          variant="text"
          onClick={() => setExpanded(true)}
          sx={{ color: RED, mt: 2 }}
        >
          Show {remaining} more
        </Button>
      )}
    </div>
  );
}

const FEATURED_COUNT = 2;

function EventSectionBlock({ section }: { section: EventSection }) {
  const { def, upcoming, past } = section;
  const [expanded, setExpanded] = useState(true);

  // Always feature the most-recent events (soonest-upcoming first, filling
  // any remaining slots from the latest past events) rather than only ever
  // spotlighting upcoming ones — most categories are past-heavy.
  const featuredUpcoming = upcoming.slice(0, FEATURED_COUNT);
  const featuredPast = past.slice(0, FEATURED_COUNT - featuredUpcoming.length);
  const featured = [
    ...featuredUpcoming.map((event) => ({ event, isPast: false })),
    ...featuredPast.map((event) => ({ event, isPast: true })),
  ];
  const rest = [...upcoming.slice(featuredUpcoming.length), ...past.slice(featuredPast.length)];

  return (
    <Box component="section" aria-label={def.title}>
      <Box className="flex items-start justify-between gap-4">
        <Box>
          <Typography variant="h5" className="font-bold tracking-tight text-gray-900">
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
        <div
          className={
            rest.length > 0
              ? "mt-8 grid gap-8 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]"
              : "mt-8"
          }
        >
          <div className="grid gap-6 min-[640px]:grid-cols-2">
            {featured.map(({ event, isPast }) => (
              <FeaturedEventCard key={event.id} event={event} isPast={isPast} />
            ))}
          </div>

          {rest.length > 0 && <PastEventsList events={rest} />}
        </div>
      )}
    </Box>
  );
}

export default function Events({
  events: initialEvents,
  loading: initialLoading = false,
  icsUrl = "",
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

  const sections = groupIntoSections(events);

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
              <SubscribeNote icsUrl={icsUrl} />
              <div className="space-y-12">
                {sections.map((section) => (
                  <EventSectionBlock key={section.def.key} section={section} />
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
