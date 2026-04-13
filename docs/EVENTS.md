# Events Page Documentation

The events page (`/events`) displays Tech for Palestine events fetched from a Notion database with real-time polling and image caching.

## Architecture Overview

```
Notion Database → API Route → Frontend Component
                     ↓              ↓
              /api/events    Events.tsx
```

## Components

### 1. Events Page (`src/pages/events.astro`)

Entry point that fetches initial events data and renders the Events component.

```astro
---
import { fetchNotionEvents } from "../store/notionClient";
let events = await fetchNotionEvents();
---

<Events events={events} loading={loading} client:only="react" />
```

### 2. Events Component (`src/components/Events.tsx`)

React component that handles:

- **Real-time Updates**: Polls `/api/events` every 30 seconds
- **Event Display**: Shows events in card format with images, dates, and status
- **Error Handling**: Graceful fallbacks for failed images

**Key Features:**

- Auto-refresh with intelligent change detection
- Loading states and error handling
- Responsive card layout with Material-UI
- Image fallback to T4P logo on error

### 3. API Route (`src/pages/api/events.ts`)

Astro API endpoint that:

- Fetches events from Notion via `notionClient.ts`
- Returns fresh data without caching (`no-cache` headers)
- Handles errors gracefully

### 4. Notion Client (`src/store/notionClient.ts`)

Core integration with Notion API:

- `fetchNotionEvents()`: Gets all events from database
- `fetchNotionEventById()`: Gets single event details
- Image URL processing with proxy integration

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

Notion images are served directly as Notion-hosted URLs. On error, the component falls back to the default image.

### Frontend Fallback

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
# Required for Notion integration
NOTION_SECRET=secret_xxx
NOTION_DB_ID=database-id
```

## Real-time Updates

The Events component automatically polls for updates:

```typescript
useEffect(() => {
  const interval = setInterval(pollForUpdates, 30000); // 30 seconds
  return () => clearInterval(interval);
}, [events, isPolling]);
```

**Change Detection:**

- Compares event arrays for additions, deletions, or modifications
- Only updates state when actual changes are detected
- Prevents unnecessary re-renders

## Deployment

### Website Deployment

Standard Astro build deployed to Cloudflare Pages:

```bash
pnpm build
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

1. Notion-hosted images may expire after ~1 hour — this is a Notion limitation
2. The component falls back to `/images/default.jpg` on error

### Events Not Updating

1. Check Notion API credentials
2. Verify database permissions
3. Check browser console for API errors

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

### Local Development

```bash
pnpm dev  # Start Astro dev server on :4321
```

### Environment Setup

1. Copy `.env.example` to `.env`
2. Add Notion credentials
