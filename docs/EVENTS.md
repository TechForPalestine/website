# Events Page Documentation

The events page (`/events`) displays Tech for Palestine events fetched from a Notion database. See [NOTION.md](NOTION.md) for how this fits into the broader Notion integration, and [ARCHITECTURE.md](ARCHITECTURE.md) for the SSR/islands model these components use.

## Architecture Overview

```
Notion Database → API Route → Frontend Component
                     ↓              ↓
              /api/events    Events.tsx
```

## Components

### 1. Events Page (`src/pages/events.astro`)

Entry point that fetches initial events data server-side and renders the Events island with it as props.

```astro
---
import { fetchNotionEvents } from "../store/notionClient";
let events = await fetchNotionEvents();
---

<Events events={events} loading={loading} client:only="react" />
```

### 2. Events Component (`src/components/Events.tsx`)

React island that handles:

- **Fetch on mount**: if no initial SSR data was passed, fetches `/api/events` (or `/api/events?showAll=yes`) itself.
- **Manual refresh**: a refresh button re-fetches `/api/events`; there is **no automatic polling** — earlier versions of this doc described a 30-second auto-refresh interval, but the current component has no `setInterval` and only refetches on mount or on user action.
- **Error handling**: on a failed fetch, the catch block is intentionally silent (documented inline in the component) — the user just keeps seeing whatever events were already loaded.
- **Change detection** (`hasEventsChanged`): compares event arrays field-by-field so a refresh only triggers a re-render when something actually changed.
- Responsive card layout with Material-UI, fade-in on first load.

### 3. API Route (`src/pages/api/events.ts`)

Astro API endpoint that:

- Fetches events from Notion via `fetchNotionEvents()` in `notionClient.ts`.
- Returns fresh data without caching (`no-cache, no-store, must-revalidate` headers — also enforced unconditionally by the `cache-control` middleware on all `/api/*` routes, see [ARCHITECTURE.md](ARCHITECTURE.md)).
- Reports errors via `reportError()` and returns a generic 500 on failure.

### 4. Notion Client (`src/store/notionClient.ts`)

- `fetchNotionEvents(showAll?, locals?)`: queries the events database, filtered on the `Visibility` checkbox property unless `showAll` is true; sorted by date descending.
- `fetchNotionEventById(pageId, locals?)`: single-event lookup, used by `event-details.astro` → `EventDetails.tsx`.
- Both map raw Notion page properties (`Title`, `Date of event`, `Stage`, `Type of event`, `Header`, `Description`, `Link to registration`, `Link to recording`) into the flat `EventItem` shape below.

## Event Data Structure

```typescript
interface EventItem {
  id: string; // Notion page ID
  title: string; // Event title
  date: string; // ISO date string
  status: string; // "Past" or "Upcoming"
  location: string; // Event type/location
  image: string; // Header image URL (direct Notion URL or default)
  link: string; // Notion page URL
  description?: string; // Event description
  registerLink?: string; // Registration URL
  recordingLink?: string; // Recording URL
}
```

## Image Handling

Notion images are served as direct Notion-hosted URLs — **there is no image proxy or caching layer** (the earlier Cloudflare Worker image proxy was removed in PR #415). On load error, the frontend falls back to the default image:

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

**Notion-hosted image URLs expire after roughly 1 hour** (a Notion/S3 signed-URL limitation). Since there's no proxy/cache anymore, an event page left open for a while, or a cached SSR response, may show broken images until the fallback kicks in or the page is refreshed and re-fetches fresh URLs from Notion.

## Environment Variables

```bash
NOTION_SECRET=secret_xxx
NOTION_DB_ID=database-id
```

## File Structure

```
src/
├── pages/
│   ├── events.astro              # Events page entry point
│   ├── event-details.astro       # Individual event details
│   └── api/events.ts            # API endpoint
├── components/
│   ├── Events.tsx               # Main events component
│   └── EventDetails.tsx         # Event detail component
└── store/
    └── notionClient.ts          # Notion API integration
```

## Troubleshooting

### Images Not Loading

1. Notion-hosted images expire after ~1 hour — this is a Notion limitation, not a bug.
2. The component falls back to `/images/default.jpg` on error; a manual refresh re-fetches current URLs from Notion.

### Events Not Updating

1. There's no background polling — the user must click refresh or reload the page.
2. Check Notion API credentials (`NOTION_SECRET`, `NOTION_DB_ID`).
3. Verify database permissions and the `Visibility` checkbox on the relevant Notion rows.
4. Check browser console for API errors (fetch failures are caught silently in the UI, so nothing shows on-page).

## API Reference

### GET /api/events

Returns array of event objects sorted by date (newest first).

**Response:**

```json
[
  {
    "id": "notion-page-id",
    "title": "Event Title",
    "date": "2025-07-23",
    "status": "Upcoming",
    "location": "Virtual",
    "image": "https://notion-hosted-url.com/...",
    "description": "Event description",
    "registerLink": "https://register.url",
    "recordingLink": null
  }
]
```

## Development

```bash
pnpm dev  # Start Astro dev server on :4321
```

Copy `.env.example` to `.env` and fill in `NOTION_SECRET`/`NOTION_DB_ID` before testing locally.
