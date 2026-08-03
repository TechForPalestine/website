# Events Page Documentation

The events pages (`/events` and `/events-new`) display Tech for Palestine events fetched from a
public **ICS calendar feed** (Mattermost's Events Calendar plugin, hosted at
`chat.techforpalestine.org`). See [ARCHITECTURE.md](ARCHITECTURE.md) for the SSR/islands model
these components use. Events used to come from Notion — that integration was removed; Notion is
still used for FAQ, ideas, agenda, signatories, and community calls (see [NOTION.md](NOTION.md)).

## Architecture Overview

```
ICS Feed → eventsClient.ts → API Route → Frontend Component
                                 ↓              ↓
                          /api/events    Events.tsx / EventsNew.tsx
```

Both pages group events into categories (by the feed's `CATEGORIES` tags) and split each
category into upcoming (featured) vs. past events. The grouping logic is shared
(`src/utils/eventSections.ts`); each page renders it with its own UI.

## Components

### 1. Events Client (`src/store/eventsClient.ts`)

- `fetchEvents(locals?)`: fetches the ICS feed URL from `EVENTS_ICS_URL` (via `getEnv()`),
  parses it (line unfolding, property parsing, text unescaping — no external ICS library),
  and returns a flat `EventItem[]` sorted by date descending.
- Events tagged `testing` in `CATEGORIES` are always dropped.
- `URL` in the feed is overloaded (map pin for in-person events, registration link for
  online events) — only known registration hosts (`zoom.us`, `docs.google.com`,
  `streamyard.com`) are treated as `registerLink`; anything else becomes `locationLink`.
- Server-side only — never runs in the browser, since the feed URL contains an auth token.

### 2. Category Grouping (`src/utils/eventSections.ts`)

- `SECTION_DEFS`: ordered list of sections — Occupied Tech Podcast, Community Calls,
  In-Person Events, Roundtable, Book Club — each with the feed tags that route into it.
- `groupIntoSections(events)`: buckets events into sections by tag (first match wins), splits
  each into `upcoming`/`past`, and appends a catch-all **Others** section for events whose tags
  don't match a named section. A named section with zero events is omitted entirely.

### 3. Pages & Components

- **`src/pages/events.astro`** → `src/components/Events.tsx` — Material-UI styled page, one
  section per category, upcoming events shown before past within each section.
- **`src/pages/events-new.astro`** → `src/components/events/EventsNew.tsx` — new design-system
  styled page, one section per category with featured cards for upcoming events and a compact
  "Past events" list alongside.
- Both fetch initial data server-side (`fetchEvents(Astro.locals)`) and re-fetch client-side
  from `/api/events` on mount if no SSR data was passed.

### 4. API Route (`src/pages/api/events.ts`)

- Calls `fetchEvents(locals)`.
- Returns fresh data without caching (`no-cache, no-store, must-revalidate` headers — also
  enforced unconditionally by the `cache-control` middleware on all `/api/*` routes, see
  [ARCHITECTURE.md](ARCHITECTURE.md)).
- Reports errors via `reportError()` and returns a generic 500 on failure.

## Event Data Structure

```typescript
interface EventItem {
  id: string; // ICS UID
  title: string; // Event title (SUMMARY)
  date: string; // "YYYY-MM-DD", local wall-clock date from the feed
  status: string; // ICS STATUS (usually "CONFIRMED")
  location: string; // Free-text location; empty if LOCATION is a bare URL
  locationLink: string; // Map link for in-person events, "" otherwise
  image: string; // IMAGE/ATTACH URL, or /images/default.jpg
  link: string; // Best available link (register, then recording)
  time?: string; // Formatted local time, e.g. "9:00 AM"
  description?: string; // DESCRIPTION with the trailing Organizer/Tags/Recording/Banner block stripped
  registerLink?: string; // Registration URL (X-REGISTRATION-URL or a known registration host)
  recordingLink?: string; // X-RECORDING-URL
  tags: string[]; // Lowercased CATEGORIES values, used for section grouping
  dateUtcIso: string | null; // Resolved UTC instant, used for upcoming/past comparisons
}
```

## Image Handling

Feed images (`IMAGE`/`ATTACH` properties) are served as direct `chat.techforpalestine.org` URLs
— there is no proxy/cache layer. On load error, the frontend falls back to the default image:

```tsx
<img
  src={event.image}
  onError={(e) => {
    if (target.src !== "/images/default.jpg") {
      target.src = "/images/default.jpg";
    }
  }}
/>
```

## Environment Variables

```bash
EVENTS_ICS_URL=https://chat.techforpalestine.org/plugins/com.techforpalestine.events-calendar/api/v1/public/calendars/by-id/<calendar-id>/ics?token=<token>
```

This is a bearer-style secret embedded in the URL — set it via the Cloudflare Pages dashboard
in production and `.dev.vars` locally (never hardcode it in source or `wrangler.toml`). It's
resolved through `getEnv()` and only ever fetched server-side.

## File Structure

```
src/
├── pages/
│   ├── events.astro              # Events page entry point (MUI)
│   ├── events-new.astro          # Events page entry point (new design)
│   └── api/events.ts             # API endpoint
├── components/
│   ├── Events.tsx                # MUI events component, category sections
│   └── events/
│       └── EventsNew.tsx         # New-design events component, category sections
├── store/
│   └── eventsClient.ts           # ICS feed fetch + parse
└── utils/
    ├── eventSections.ts          # Category grouping (shared by both pages)
    └── icalDate.ts                # TZID → UTC date resolution (shared with community calls)
```

## Troubleshooting

### Events Not Updating

1. There's no background polling — the user must click refresh (MUI page) or reload the page.
2. Check `EVENTS_ICS_URL` is set and the feed is reachable.
3. Check browser console / Sentry for fetch failures.

### An Event Is In The Wrong Category / Missing

- Check the event's `CATEGORIES` tags in the source calendar (Mattermost Events Calendar
  plugin) against the tag → section mapping in `src/utils/eventSections.ts`.
- Events tagged `testing` are always dropped, regardless of other tags.

## API Reference

### GET /api/events

Returns a flat array of event objects sorted by date (newest first); pages group them into
categories client- or server-side via `groupIntoSections`.

**Response:**

```json
[
  {
    "id": "dd579e59-53f1-4a9f-9df7-fd09997b092d@events.t4p",
    "title": "Entrepreneurs for Palestine Official Launch",
    "date": "2025-02-26",
    "status": "CONFIRMED",
    "location": "",
    "locationLink": "",
    "image": "https://chat.techforpalestine.org/.../banner",
    "link": "https://youtu.be/w22SyQY1bwI",
    "time": "9:00 AM",
    "description": "Join us for the official launch of T4P's newest initiative...",
    "registerLink": "",
    "recordingLink": "https://youtu.be/w22SyQY1bwI",
    "tags": ["online"],
    "dateUtcIso": "2025-02-26T08:00:00.000Z"
  }
]
```

## Development

```bash
pnpm dev  # Start Astro dev server on :4321
```

Set `EVENTS_ICS_URL` in `.dev.vars` before testing locally.
