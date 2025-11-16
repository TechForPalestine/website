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

/**
 * Handles image load errors with a fallback strategy.
 *
 * Fallback sequence:
 * 1. If proxy image fails → try original Notion URL
 * 2. If original Notion URL fails → fallback to default image
 *
 * @param e - Image error event
 * @param event - Event item (for logging purposes)
 */
const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement>,
  event: EventItem
): void => {
  const target = e.target as HTMLImageElement;
  const currentSrc = target.src;
  const defaultImage = "/images/default.jpg";

  // Prevent infinite loop if already using default image
  if (currentSrc === defaultImage) {
    return;
  }

  // Step 1: If proxy image failed, try original Notion URL
  if (currentSrc.includes("notion-image-proxy")) {
    console.error(
      `Proxy image failed for event "${event.title}". Trying original Notion URL:`,
      {
        proxySrc: currentSrc,
        eventImage: event.image,
        eventId: event.id,
      }
    );

    try {
      // Attempt to decode original URL from proxy URL
      const proxyPath = currentSrc.split("/proxy/")[1];
      if (proxyPath) {
        const originalUrl = atob(proxyPath);
        console.log(`Trying original Notion URL: ${originalUrl}`);
        target.src = originalUrl;
        return;
      }
    } catch (decodeError) {
      console.error("Could not decode original URL from proxy:", decodeError);
      // If decoding fails, fallback to default image
    }
  } else {
    // Step 2: Direct Notion URL failed
    console.error(
      `Direct Notion URL failed for event "${event.title}". Using default:`,
      {
        originalSrc: currentSrc,
        eventImage: event.image,
        eventId: event.id,
      }
    );
  }

  // Step 3: Final fallback - use default image
  target.src = defaultImage;
};

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
      console.log("Fetching fresh events from Notion API...");
      const response = await fetch(showAll ? "/api/events?showAll=yes" : "/api/events", {
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (response.ok) {
        const newEvents = await response.json();
        console.log(`Refreshed: Loaded ${newEvents.length} events from Notion`);
        setEvents(newEvents);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch fresh events:", error);
    } finally {
      setLoading(false);
    }
  };

  // Only fetch fresh events if we don't have initial data
  useEffect(() => {
    console.log("Events component mounted:", {
      initialEventsLength: initialEvents.length,
      initialLoading,
      currentLoadingState: loading,
    });

    if (initialEvents.length === 0 && initialLoading) {
      console.log("No initial events, fetching from API...");
      fetchFreshEvents();
    } else {
      console.log(
        `Using ${initialEvents.length} initial events from SSR, setting loading to false`
      );
      setLoading(false);
    }
  }, []);

  // Debug logging for state changes
  useEffect(() => {
    console.log("Loading state changed:", loading);
  }, [loading]);

  useEffect(() => {
    console.log("Events state changed:", {
      count: events.length,
      firstEventTitle: events[0]?.title,
    });
  }, [events]);

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

          console.log("event.image :", event.image);
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
                  onLoad={(e) => {
                    const target = e.target as HTMLImageElement;
                    console.log(
                      `Image loaded successfully for event "${event.title}":`,
                      target.src
                    );
                  }}
                  onError={(e) => handleImageError(e, event)}
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
