import React, { useEffect, useState } from "react";

interface EventItem {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD" format
  status: string;
  location: string;
  image: string;
  link: string;
  time?: string;
  description?: string;
  registerLink?: string;
  recordingLink?: string;
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

function ArrowRight({ size = 16 }: { size?: number }) {
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

function SectionLabel({
  accent = false,
  children,
}: {
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex items-center gap-5">
      <p className={`ts-overline shrink-0 ${accent ? "text-brand" : "text-ink-secondary"}`}>
        {children}
      </p>
      <div className={`h-px flex-1 ${accent ? "bg-brand/20" : "bg-ink-divider"}`} />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div>
      {/* Hero skeleton */}
      <section className="bg-page px-6 pb-14 pt-10 min-[810px]:px-10 min-[810px]:pb-16 min-[810px]:pt-12">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-8 flex items-center gap-5">
            <div className="h-3 w-20 animate-pulse rounded-pill bg-butter" />
            <div className="h-px flex-1 bg-ink-divider" />
          </div>
          <div className="grid min-[810px]:grid-cols-[55%_45%]">
            <div className="aspect-[3/2] w-full animate-pulse bg-butter min-[810px]:aspect-auto min-[810px]:min-h-[380px]" />
            <div className="flex flex-col gap-4 p-8">
              <div className="h-12 w-16 animate-pulse rounded-sm bg-butter" />
              <div className="h-8 w-3/4 animate-pulse rounded-sm bg-butter" />
              <div className="h-4 w-1/2 animate-pulse rounded-sm bg-butter" />
              <div className="mt-2 h-4 w-full animate-pulse rounded-sm bg-butter" />
              <div className="h-4 w-5/6 animate-pulse rounded-sm bg-butter" />
              <div className="mt-4 h-11 w-32 animate-pulse rounded-pill bg-butter" />
            </div>
          </div>
        </div>
      </section>

      {/* Archive row skeletons */}
      <section className="bg-page px-6 pb-16 pt-12 min-[810px]:px-10 min-[810px]:pb-24">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-8 flex items-center gap-5">
            <div className="h-3 w-12 animate-pulse rounded-pill bg-butter" />
            <div className="h-px flex-1 bg-ink-divider" />
          </div>
          <div className="divide-y divide-ink-divider">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-baseline gap-4 py-4">
                <div className="h-3 w-8 animate-pulse rounded-sm bg-butter" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="h-5 w-2/3 animate-pulse rounded-sm bg-butter" />
                  <div className="h-3.5 w-1/3 animate-pulse rounded-sm bg-butter" />
                </div>
                <div className="h-4 w-12 animate-pulse rounded-sm bg-butter" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-page px-6 py-24 text-center min-[810px]:px-10">
      <p className="ts-body-large text-ink-secondary">No events right now. Check back soon.</p>
    </div>
  );
}

interface HeroEventProps {
  event: EventItem;
}

function HeroEvent({ event }: HeroEventProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const { day, month, year } = parseDateParts(event.date);

  return (
    <div className="grid min-[810px]:grid-cols-[55%_45%]">
      {/* Image side */}
      <div className="flex aspect-[3/2] items-center justify-center overflow-hidden bg-sand min-[810px]:aspect-auto min-[810px]:min-h-[380px]">
        <img
          src={imgFailed ? "/images/default.jpg" : event.image}
          alt={event.title}
          className="h-full w-full object-contain"
          onError={() => setImgFailed(true)}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Content side */}
      <div className="flex flex-col gap-4 p-8 min-[810px]:p-10">
        {/* Date block */}
        <div>
          <p className="ts-stat leading-none text-brand">{day}</p>
          <p className="ts-overline text-ink-secondary">
            {month} {year}
          </p>
        </div>

        {/* Title */}
        <h2 className="ts-editorial text-ink">{event.title}</h2>

        {/* Meta */}
        {(event.time || event.location) && (
          <p className="ts-body-small text-ink-secondary">
            {event.time && <span>{event.time}</span>}
            {event.time && event.location && <span> · </span>}
            {event.location && <span>{event.location}</span>}
          </p>
        )}

        {/* Description */}
        {event.description && (
          <p className="ts-body line-clamp-3 max-w-[55ch] text-ink-secondary">
            {event.description}
          </p>
        )}

        {/* Register CTA */}
        {event.registerLink && (
          <div className="mt-2">
            <a
              href={event.registerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="ts-label inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-brand px-6 py-3.5 text-page transition-colors duration-150 hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98]"
            >
              Register
              <ArrowRight size={16} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

interface LineupTileProps {
  event: EventItem;
}

function LineupTile({ event }: LineupTileProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const { day, month, year } = parseDateParts(event.date);

  return (
    <article className="flex w-[240px] shrink-0 snap-start flex-col gap-0 overflow-hidden rounded-[20px] border border-butter bg-page min-[640px]:w-auto">
      {/* Image */}
      <div className="aspect-[16/9] w-full bg-sand">
        <img
          src={imgFailed ? "/images/default.jpg" : event.image}
          alt={event.title}
          className="h-full w-full object-contain"
          onError={() => setImgFailed(true)}
          loading="lazy"
          decoding="async"
        />
      </div>
      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-5">
        {/* Date */}
        <div>
          <p className="ts-heading leading-none text-brand">{day}</p>
          <p className="ts-overline text-ink-secondary">
            {month} {year}
          </p>
        </div>

        {/* Title */}
        <h3 className="ts-eyebrow mt-1 line-clamp-2 text-ink">{event.title}</h3>

        {/* Location */}
        {event.location && <p className="ts-body-small text-ink-secondary">{event.location}</p>}

        {/* Register link */}
        {event.registerLink && (
          <a
            href={event.registerLink}
            target="_blank"
            rel="noopener noreferrer"
            className="ts-label mt-auto inline-flex min-h-[44px] items-center gap-1 text-brand transition-colors duration-150 hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Register
            <ArrowRight size={13} />
          </a>
        )}
      </div>
    </article>
  );
}

interface LineupStripProps {
  events: EventItem[];
}

function LineupStrip({ events }: LineupStripProps) {
  return (
    <>
      {/* Mobile: horizontal scroll */}
      <div className="flex snap-x snap-mandatory flex-row gap-4 overflow-x-auto pb-4 min-[640px]:hidden">
        {events.map((event) => (
          <LineupTile key={event.id} event={event} />
        ))}
      </div>

      {/* Tablet+: grid */}
      <div className="hidden grid-cols-2 gap-4 min-[640px]:grid min-[1024px]:grid-cols-3">
        {events.map((event) => (
          <LineupTile key={event.id} event={event} />
        ))}
      </div>
    </>
  );
}

function PastEventCard({ event }: { event: EventItem }) {
  const [imgFailed, setImgFailed] = useState(false);
  const { full } = parseDateParts(event.date);

  return (
    <article className="overflow-hidden rounded-[20px] border border-butter bg-sand transition-colors duration-200 hover:bg-cream">
      <div className="flex flex-col min-[640px]:flex-row">
        <div className="bg-butter/50 min-[640px]:w-2/5 min-[640px]:shrink-0">
          <img
            src={imgFailed ? "/images/default.jpg" : event.image}
            alt={event.title}
            className="aspect-[4/3] h-full w-full object-contain opacity-80"
            onError={() => setImgFailed(true)}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-6 min-[810px]:p-8">
          <div>
            <span className="ts-overline inline-block rounded-pill border border-ink-divider bg-butter px-3 py-1 text-ink-secondary">
              Past
            </span>
          </div>
          <h2 className="ts-subheading break-words text-ink">{event.title}</h2>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <span className="ts-body-small text-ink-secondary">{full}</span>
            {event.time && <span className="ts-body-small text-ink-secondary">{event.time}</span>}
            {event.location && (
              <span className="ts-body-small text-ink-secondary">{event.location}</span>
            )}
          </div>
          {event.description && (
            <p className="ts-body line-clamp-3 text-ink-secondary">{event.description}</p>
          )}
          {event.recordingLink && (
            <div className="mt-auto pt-2">
              <a
                href={event.recordingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="ts-label inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-ink bg-transparent px-5 py-3.5 text-ink transition-colors duration-150 hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98]"
              >
                Watch recording
              </a>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

interface EventsNewProps {
  initialEvents?: EventItem[];
}

export default function EventsNew({ initialEvents = [] }: EventsNewProps) {
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [loading, setLoading] = useState(initialEvents.length === 0);

  const showAll =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("showAll") === "yes"
      : false;

  useEffect(() => {
    if (!showAll && initialEvents.length > 0) return;
    setLoading(true);
    fetch(showAll ? "/api/events?showAll=yes" : "/api/events", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: EventItem[]) => setEvents(data))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = events.filter((e) => new Date(e.date) >= today);
  const past = events.filter((e) => new Date(e.date) < today);

  const heroEvent = upcoming[0] ?? null;
  const lineupEvents = upcoming.slice(1);

  return (
    <div className="pb-16 min-[810px]:pb-24">
      {loading ? (
        <LoadingSkeleton />
      ) : events.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Tier 1 — Hero */}
          {heroEvent && (
            <section
              className="bg-page px-6 pb-14 pt-10 min-[810px]:px-10 min-[810px]:pb-16 min-[810px]:pt-12"
              aria-label="Featured upcoming event"
            >
              <div className="mx-auto max-w-[1400px]">
                <SectionLabel accent>Upcoming</SectionLabel>
                <HeroEvent event={heroEvent} />
              </div>
            </section>
          )}

          {/* Tier 2 — Lineup strip */}
          {lineupEvents.length > 0 && (
            <section
              className="bg-sand px-6 py-12 min-[810px]:px-10 min-[810px]:py-14"
              aria-label="More upcoming events"
            >
              <div className="mx-auto max-w-[1400px]">
                <p className="ts-overline mb-6 text-ink-secondary">Also upcoming</p>
                <LineupStrip events={lineupEvents} />
              </div>
            </section>
          )}

          {/* Tier 3 — Archive */}
          {past.length > 0 && (
            <section
              className="bg-page px-6 pb-16 pt-12 min-[810px]:px-10 min-[810px]:pb-24"
              aria-label="Past events"
            >
              <div className="mx-auto max-w-[1400px]">
                <SectionLabel accent>Past</SectionLabel>
                <div className="space-y-4">
                  {past.map((event) => (
                    <PastEventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
