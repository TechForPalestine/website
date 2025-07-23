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
    const oldEventMap = new Map(oldEvents.map(event => [event.id, event]));
    const newEventMap = new Map(newEvents.map(event => [event.id, event]));
    
    // Check if any old event has been deleted
    for (const oldEvent of oldEvents) {
        if (!newEventMap.has(oldEvent.id)) {
            return true; // Event was deleted
        }
    }
    
    // Check if any new event was added or existing event was modified
    return newEvents.some(newEvent => {
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
export default function Events({ events: initialEvents, loading = false }: EventsProps) {
    const [events, setEvents] = useState<EventItem[]>(initialEvents);
    const [isPolling, setIsPolling] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Polling function
    const pollForUpdates = async () => {
        if (isPolling) return; // Prevent concurrent requests
        
        setIsPolling(true);
        try {
            const response = await fetch('/api/events');
            if (response.ok) {
                const newEvents = await response.json();
                
                // More robust comparison - check if events have changed
                const hasChanges = hasEventChanges(events, newEvents);
                if (hasChanges) {
                    console.log('Events updated:', { oldCount: events.length, newCount: newEvents.length });
                    setEvents(newEvents);
                    setLastUpdated(new Date());
                }
            }
        } catch (error) {
            console.error('Failed to poll for events:', error);
        } finally {
            setIsPolling(false);
        }
    };

    // Set up polling
    useEffect(() => {
        const interval = setInterval(pollForUpdates, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, [events, isPolling]);

    return (
        <div className="mx-auto max-w-6xl px-4 py-10">
            {/* Status indicator */}
            <Box className="flex justify-between items-center mb-4">
                <Typography variant="caption" className="text-gray-500">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </Typography>
                {isPolling && (
                    <Box className="flex items-center gap-2">
                        <CircularProgress size={16} />
                        <Typography variant="caption" className="text-gray-500">
                            Checking for updates...
                        </Typography>
                    </Box>
                )}
            </Box>

            {loading && (
                <Box className="text-center py-6">
                    <CircularProgress size={32} color="success" />
                </Box>
            )}

            <div className="space-y-6">
                {events.map((event, i) => {
                    const eventDate = new Date(event.date);
                    const day = eventDate.getDate();
                    const month = eventDate.toLocaleString("default", {
                        month: "short",
                    }).toUpperCase();
                    const isPast = event.status?.toLowerCase() === "past";
                    const eventUrl = `/event-details?id=${event.id}`;

                    console.log("event.image :",event.image)
                    return (
                        <Card
                            key={i}
                            className="group  flex flex-col md:flex-row items-start gap-4 rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition bg-white no-underline"
                        >
                            {/* Image */}
                            <Box className="relative w-full md:w-1/3">
                                <img
                                    src={event.image}
                                    alt={event.title}
                                    className="rounded-xl w-full aspect-[4/3] object-cover"
                                    crossOrigin="anonymous"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        if (target.src !== "/images/default.jpg") {
                                            console.log(`Image failed to load: ${target.src}, falling back to default`);
                                            target.src = "/images/default.jpg";
                                        }
                                    }}
                                />
                            </Box>

                            {/* Content */}
                            <Box className="flex-1 space-y-2 px-2">
                                <Box className="flex items-center gap-2 flex-wrap">
                                    <Typography
                                        variant="h6"
                                        className="font-bold tracking-tight text-gray-900"
                                    >
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
                      {month} {day}, {eventDate.getFullYear()}
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
                                    <Typography
                                        variant="body2"
                                        className="text-sm text-gray-600 leading-relaxed "
                                    >
                                        {event.description}
                                    </Typography>
                                )}

                                {/* Footer */}
                                <Box className="flex flex-wrap items-center justify-between pt-2 gap-4">
                                    <Box className="flex gap-3 text-sm">
                                        {event.registerLink && (
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
