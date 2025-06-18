import React from "react";

interface EventItem {
    title: string;
    date: string;
    status: string;
    location: string;
    image: string;
    link: string;
}

interface EventsProps {
    events: EventItem[];
}

export default function Events({ events }: EventsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 py-10">
            {events.map((event, i) => (
                <a
                    key={i}
                    href={event.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border rounded-2xl overflow-hidden shadow hover:shadow-lg transition bg-white"
                >
                    <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                            {event.status} • {event.location}
                        </p>
                        <h2 className="text-lg font-semibold mb-1">{event.title}</h2>
                        <p className="text-sm text-gray-600">{event.date}</p>
                    </div>
                </a>
            ))}
        </div>
    );
}
