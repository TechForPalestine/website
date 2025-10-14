# Events Page Documentation

The events page (`/events`) displays Tech for Palestine events fetched from a Notion database with real-time polling and image caching.

## Architecture Overview

```
Notion Database → API Route → Frontend Component → Image Proxy Worker
                     ↓              ↓                    ↓
              /api/events    Events.tsx         Cloudflare Worker
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
  id: string;           // Notion page ID
  title: string;        // Event title
  date: string;         // ISO date string
  status: string;       // "Past" or "Upcoming"
  location: string;     // Event type/location
  image: string;        // Header image URL (proxied)
  link: string;         // Notion page URL
  description?: string; // Event description
  registerLink?: string;// Registration URL
  recordingLink?: string; // Recording URL
}
```

## Image Handling System

### Problem
Notion stores images in AWS S3 with URLs that expire after ~1 hour, causing broken images.

### Solution
**Cloudflare Worker Proxy** (`cloudflare-worker/worker.js`)

#### URL Format
- **Original**: `https://s3.us-west-2.amazonaws.com/...?expires=...`
- **Proxied**: `https://notion-image-proxy.paul-cf1.workers.dev/proxy/{base64-encoded-url}`

#### Worker Logic
1. **Decode** base64 URL parameter to get original Notion S3 URL
2. **Fetch** image from S3 with caching (2 weeks)
3. **Fallback** to T4P logo if S3 fetch fails
4. **Return** actual image content (not error responses)

#### Cache Strategy
- **Max-age**: 2 weeks (1,209,600 seconds)
- **S-maxage**: 4 weeks (2,419,200 seconds)  
- **Stale-while-revalidate**: 4 weeks
- **CORS**: Full cross-origin support

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

# Required for image proxy
NOTION_IMAGE_PROXY_URL=https://notion-image-proxy.paul-cf1.workers.dev
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

### Worker Deployment
Separate deployment required for image proxy:
```bash
cd cloudflare-worker
wrangler deploy
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed worker setup instructions.

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
├── store/
│   └── notionClient.ts          # Notion API integration
└── utils/
    └── imageProxy.ts            # Image URL transformation

cloudflare-worker/
├── worker.js                    # Image proxy worker
└── wrangler.toml               # Worker configuration
```

## Troubleshooting

### Images Not Loading
1. Check worker deployment: `wrangler deployments list`
2. Verify environment variable: `NOTION_IMAGE_PROXY_URL`
3. Test worker directly: `curl https://your-worker.domain/proxy/{base64-url}`

### Events Not Updating
1. Check Notion API credentials
2. Verify database permissions
3. Check browser console for API errors

### CORS Errors
1. Ensure worker has CORS headers on all responses
2. Check worker domain configuration
3. Verify browser network tab for blocked requests

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
    "image": "https://notion-image-proxy.domain/proxy/...",
    "description": "Event description",
    "registerLink": "https://register.url",
    "recordingLink": null
  }
]
```

### Worker Proxy Endpoint
**GET** `https://worker.domain/proxy/{base64-encoded-notion-url}`

**Headers:**
- `Access-Control-Allow-Origin: *`
- `Cache-Control: public, max-age=1209600`
- `X-Cached-By: CF-Worker` (for cached responses)

## Development

### Local Development
```bash
pnpm dev  # Start Astro dev server on :4321
```

### Testing Worker Locally
```bash
cd cloudflare-worker
wrangler dev  # Start local worker on :8787
```

### Environment Setup
1. Copy `.env.example` to `.env`
2. Add Notion credentials
3. Set worker URL (use localhost:8787 for local development)