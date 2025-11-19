import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardMedia,
  Chip,
  Button,
  Link,
  CircularProgress,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

interface EventItem {
  id: string;
  title: string;
  date: string;
  status: string;
  location: string;
  image: string;
  link: string;
  time?: string;
  description?: string;
  registerLink?: string;
  recordingLink?: string;
}

interface EventsProps {
  events: EventItem[];
  loading?: boolean;
}

// Helper function to compare events arrays for changes
const hasEventChanges = (oldEvents: EventItem[], newEvents: EventItem[]): boolean => {
  if (oldEvents.length !== newEvents.length) {
    return true;
  }

  // Create maps for efficient lookup
  const oldEventMap = new Map(oldEvents.map((event) => [event.id, event]));
  const newEventMap = new Map(newEvents.map((event) => [event.id, event]));

  // Check if any old event has been deleted
  for (const oldEvent of oldEvents) {
    if (!newEventMap.has(oldEvent.id)) {
      return true; // Event was deleted
    }
  }

  // Check if any new event was added or existing event was modified
  return newEvents.some((newEvent) => {
    const oldEvent = oldEventMap.get(newEvent.id);
    if (!oldEvent) {
      return true; // New event
    }

    // Compare key properties that might change
    return (
      oldEvent.title !== newEvent.title ||
      oldEvent.date !== newEvent.date ||
      oldEvent.status !== newEvent.status ||
      oldEvent.location !== newEvent.location ||
      oldEvent.description !== newEvent.description ||
      oldEvent.registerLink !== newEvent.registerLink ||
      oldEvent.recordingLink !== newEvent.recordingLink ||
      oldEvent.image !== newEvent.image
    );
  });
};
export default function Events({
  events: initialEvents,
  loading: initialLoading = false,
}: EventsProps) {
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [loading, setLoading] = useState(initialLoading);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());
  const showAll = params?.showAll === "yes";

  // Function to fetch fresh events (for refresh button)
  const fetchFreshEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch(showAll ? "/api/events?showAll=yes" : "/api/events", {
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (response.ok) {
        const newEvents = await response.json();
        setEvents(newEvents);
        setLastUpdated(new Date());
      }
    } catch (error) {
      /*
       * intentional silent error handling: user sees existing/cached events on fetch failure.
       * console.error provides no value in production at this stage; users don't
       * see it, monitoring systems don't capture it; it's purely a debugging tool.
       * if error visibility is needed, potential implementation suggestions could include:
       * - user-facing feedback: Material-UI Snackbar/Alert component
       * - production monitoring: Sentry/LogRocket integration in catch block
       * - error state management: const [error, setError] = useState<string | null>(null)
       *   (although I really do not like using useState for this, or at all)
       */
    } finally {
      setLoading(false);
    }
  };

  // Only fetch fresh events if we don't have initial data
  useEffect(() => {
    if (initialEvents.length === 0 && initialLoading) {
      fetchFreshEvents();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Status indicator */}
      <Box className="mb-4 flex items-center justify-between">
        <Typography variant="caption" className="text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </Typography>
        <Box className="flex items-center gap-4">
          <Button
            size="small"
            variant="outlined"
            onClick={fetchFreshEvents}
            disabled={loading}
            className="text-xs"
          >
            Refresh
          </Button>
          {loading && (
            <Box className="flex items-center gap-2">
              <CircularProgress size={16} />
              <Typography variant="caption" className="text-gray-500">
                Loading...
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {loading && events.length === 0 && (
        <Box className="py-6 text-center">
          <CircularProgress size={32} color="success" />
          <Typography variant="body2" className="mt-4 text-gray-600">
            Loading events from Notion...
          </Typography>
        </Box>
      )}

      <div className="space-y-6">
        {events.map((event, i) => {
          // Parse date string without timezone conversion
          const [year, month, day] = event.date.split("-");
          const monthNames = [
            "JAN",
            "FEB",
            "MAR",
            "APR",
            "MAY",
            "JUN",
            "JUL",
            "AUG",
            "SEP",
            "OCT",
            "NOV",
            "DEC",
          ];
          const monthName = monthNames[parseInt(month) - 1];
          const dayNum = parseInt(day);

          const isPast = event.status?.toLowerCase() === "past";
          const eventUrl = `/event-details?id=${event.id}`;

          return (
            <Card
              key={i}
              className="group flex flex-col items-start gap-4 rounded-2xl border border-gray-200 bg-white p-6 no-underline shadow-sm transition hover:shadow-md md:flex-row"
            >
              {/* Image */}
              <Box className="relative w-full md:w-1/3">
                <img
                  src={event.image}
                  alt={event.title}
                  className="aspect-[4/3] w-full rounded-xl bg-gray-100 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const currentSrc = target.src;

                    // fallback strategy: proxy → original Notion URL → default image
                    if (
                      currentSrc.includes("notion-image-proxy") &&
                      currentSrc !== "/images/default.jpg"
                    ) {
                      // trying to decode the original URL from the proxy URL
                      try {
                        const proxyPath = currentSrc.split("/proxy/")[1];
                        const originalUrl = atob(proxyPath);
                        target.src = originalUrl;
                        return;
                      } catch (decodeError) {
                        // decode failed, fall through to default image
                      }
                    }

                    // Final fallback to default image
                    if (target.src !== "/images/default.jpg") {
                      target.src = "/images/default.jpg";
                    }
                  }}
                />
              </Box>

              {/* Content */}
              <Box className="flex-1 space-y-2 px-2">
                <Box className="flex flex-wrap items-center gap-2">
                  <Typography variant="h6" className="font-bold tracking-tight text-gray-900">
                    {event.title}
                  </Typography>
                  {event.status && (
                    <Chip
                      size="small"
                      label={event.status}
                      sx={{
                        backgroundColor: isPast ? "#EA4335" : "#168039",
                        color: "#fff",
                        fontWeight: 500,
                      }}
                    />
                  )}
                </Box>

                {/* Meta */}
                <Box className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <CalendarTodayIcon fontSize="small" />
                    {monthName} {dayNum}, {year}
                  </span>
                  {event.time && (
                    <span className="flex items-center gap-1">
                      <AccessTimeIcon fontSize="small" />
                      {event.time}
                    </span>
                  )}
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <LocationOnIcon fontSize="small" />
                      {event.location}
                    </span>
                  )}
                </Box>

                {/* Description */}
                {event.description && (
                  <Typography variant="body2" className="text-sm leading-relaxed text-gray-600">
                    {event.description}
                  </Typography>
                )}

                {/* Footer */}
                <Box className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <Box className="flex gap-3 text-sm">
                    {event.registerLink && !isPast && (
                      <Link
                        href={event.registerLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center font-medium text-[#EA4335] hover:underline"
                      >
                        <EditCalendarIcon fontSize="small" className="mr-1" />
                        Register
                      </Link>
                    )}
                    {event.recordingLink && (
                      <Link
                        href={event.recordingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center font-medium text-[#168039] hover:underline"
                      >
                        <VideoLibraryIcon fontSize="small" className="mr-1" />
                        Recording
                      </Link>
                    )}
                  </Box>
                </Box>
              </Box>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
