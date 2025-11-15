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
  Skeleton,
  Fade,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RefreshIcon from "@mui/icons-material/Refresh";
import EventBusyIcon from "@mui/icons-material/EventBusy";

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
  const [showEvents, setShowEvents] = useState(initialEvents.length > 0);

  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());
  const showAll = params?.showAll === "yes";

  // Function to fetch fresh events (for refresh button)
  const fetchFreshEvents = async () => {
    const wasRefreshing = events.length > 0; // Track if we're refreshing existing events
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
        if (newEvents.length > 0) {
          // Only trigger fade-in if this is initial load, not a refresh
          if (!wasRefreshing) {
            setShowEvents(true);
          }
        } else {
          setShowEvents(false);
        }
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
      if (initialEvents.length > 0) {
        setShowEvents(true);
      }
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

  // Skeleton loading component
  const EventSkeleton = () => (
    <Card className="flex flex-col items-start gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row">
      {/* Image skeleton */}
      <Box className="w-full md:w-1/3">
        <Skeleton
          variant="rectangular"
          width="100%"
          height={200}
          className="rounded-xl"
          animation="wave"
        />
      </Box>
      {/* Content skeleton */}
      <Box className="flex-1 space-y-2 px-2">
        <Box className="flex flex-wrap items-center gap-2">
          <Skeleton variant="text" width="60%" height={32} animation="wave" />
          <Skeleton variant="rectangular" width={80} height={24} className="rounded-full" animation="wave" />
        </Box>
        <Box className="flex flex-wrap items-center gap-4">
          <Skeleton variant="text" width={120} height={20} animation="wave" />
          <Skeleton variant="text" width={100} height={20} animation="wave" />
          <Skeleton variant="text" width={150} height={20} animation="wave" />
        </Box>
        <Skeleton variant="text" width="100%" height={20} animation="wave" />
        <Skeleton variant="text" width="80%" height={20} animation="wave" />
        <Box className="pt-2">
          <Skeleton variant="text" width={100} height={20} animation="wave" />
        </Box>
      </Box>
    </Card>
  );

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
            startIcon={
              loading ? (
                <CircularProgress size={14} thickness={4} />
              ) : (
                <RefreshIcon fontSize="small" />
              )
            }
            className="text-xs transition-opacity"
            sx={{
              opacity: loading ? 0.7 : 1,
              "&:hover": {
                opacity: loading ? 0.7 : 1,
              },
            }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </Box>
      </Box>

      {/* Skeleton loading state */}
      {loading && events.length === 0 && (
        <div className="space-y-6">
          {[...Array(3)].map((_, index) => (
            <EventSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      )}

      {/* Empty state */}
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

      {/* Events list with fade-in animation */}
      {events.length > 0 && (
        <Fade in={showEvents} timeout={500}>
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
                <Fade
                  key={event.id}
                  in={showEvents}
                  timeout={300}
                  style={{ transitionDelay: `${i * 50}ms` }}
                >
                <Card
                  className="group flex flex-col items-start gap-4 rounded-2xl border border-gray-200 bg-white p-6 no-underline shadow-sm transition-all duration-300 hover:shadow-md md:flex-row"
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
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const currentSrc = target.src;

                    // Try fallback strategies
                    if (
                      currentSrc.includes("notion-image-proxy") &&
                      currentSrc !== "/images/default.jpg"
                    ) {
                      console.error(
                        `Proxy image failed for event "${event.title}". Trying original Notion URL:`,
                        {
                          proxySrc: currentSrc,
                          eventImage: event.image,
                          eventId: event.id,
                        }
                      );

                      // Try to decode the original URL from the proxy URL
                      try {
                        const proxyPath = currentSrc.split("/proxy/")[1];
                        const originalUrl = atob(proxyPath);
                        console.log(`Trying original Notion URL: ${originalUrl}`);
                        target.src = originalUrl;
                        return;
                      } catch (decodeError) {
                        console.error("Could not decode original URL from proxy:", decodeError);
                      }
                    } else if (!currentSrc.includes("/images/default.jpg")) {
                      console.error(
                        `Direct Notion URL failed for event "${event.title}". Using default:`,
                        {
                          originalSrc: currentSrc,
                          eventImage: event.image,
                          eventId: event.id,
                        }
                      );
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
                </Fade>
              );
            })}
          </div>
        </Fade>
      )}
    </div>
  );
}
