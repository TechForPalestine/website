# Tech for Palestine Website - CLAUDE.md

This file contains comprehensive information about the Tech for Palestine website project to help Claude Code understand the codebase structure, development workflows, and context needed for efficient assistance.

## Project Overview

**Tech for Palestine Website** - A community platform showcasing projects, events, and resources for tech workers supporting Palestine. Built with Astro, React, TypeScript, and Notion API integration.

- **Repository**: https://github.com/techforpalestine/website.git
- **Main Branch**: `main`
- **Tech Stack**: Astro v4, React 19, TypeScript, Tailwind CSS, Material-UI, Notion API
- **Deployment**: Cloudflare Pages
- **Package Manager**: Yarn (v1.22.22)

## Architecture

### Framework Setup
- **Astro v4** - Static site generator with hybrid rendering
- **React 19** - Client-side components with `client:only="react"` directives
- **TypeScript** - Full type safety
- **Tailwind CSS** - Utility-first styling
- **Material-UI v6** - Component library for forms and complex UI

### Integrations
- **Notion API** - Content management for events and projects
- **Cloudflare Worker** - Image proxy for Notion images
- **Astro Icon** - Icon management
- **Svelte** - Some legacy components

## Directory Structure

```
src/
├── components/          # React/Astro/Svelte components
├── content/            # Static content (ideas, projects)
│   ├── config.ts       # Content collections config
│   ├── ideas/          # Project ideas (.md files)
│   └── projects/       # Project descriptions (.md files)
├── layouts/
│   └── Layout.astro    # Main layout wrapper
├── pages/              # Routes (file-based routing)
│   ├── api/           # API endpoints
│   ├── project-details/
│   └── *.astro        # Page components
├── store/             # State management & API clients
├── styles/            # CSS files
└── utils/             # Helper functions

public/                # Static assets
cloudflare-worker/     # Image proxy worker
docs/                  # Project documentation
```

## Key Pages & Components

### Main Pages
- **Homepage** (`src/pages/index.astro`) - Landing page with hero, featured projects
- **Events** (`src/pages/events.astro`) - Dynamic events from Notion API
- **Projects** (`src/pages/projects.astro`) - Static project showcase
- **Projects (New)** (`src/pages/projects-new.astro`) - Test page for new project management app
- **Ideas** (`src/pages/ideas.astro`) - Browsable project ideas
- **About/Team** (`src/pages/about.astro`, `src/pages/team.astro`) - Organization info

### Dynamic Components

**Events System** (`src/components/Events.tsx`)
- Real-time polling from Notion API every 30 seconds
- Image proxy integration for Notion S3 images
- Material-UI cards with status chips
- Smart change detection to minimize re-renders

**Projects New** (`src/components/ProjectsNew.tsx`)
- Test component for external project management integration
- Similar patterns to Events component
- API endpoint: `/api/projects-new`

**Form Components** (`src/components/hook-form/`)
- React Hook Form integration
- Custom form components with validation
- Used in volunteer forms and project applications

### API Routes
- **`/api/events`** - Fetches events from Notion
- **`/api/projects-new`** - Fetches projects from external app
- All API routes return JSON with proper CORS headers

## Development Workflow

### Common Commands
```bash
# Development
yarn dev              # Start dev server on http://localhost:4321
yarn start           # Alias for dev
yarn build           # Build for production
yarn preview         # Preview production build

# Code Quality
# No specific lint/typecheck commands defined - check for them in scripts
```

### Branch Management
⚠️ **IMPORTANT**: Always verify the working branch hasn't been merged before committing changes. Use `git log --oneline main..HEAD` to check if your branch has commits not in main.

### Environment Variables
```bash
# Notion Integration
NOTION_SECRET=secret_xxx
NOTION_DB_ID=database-id

# Image Proxy
NOTION_IMAGE_PROXY_URL=https://notion-image-proxy.paul-cf1.workers.dev
```

## Content Management

### Static Content
- **Project Ideas**: `src/content/ideas/*.md` - Markdown files with frontmatter
- **Project Profiles**: `src/content/projects/*.md` - Individual project pages
- **Content Collections**: Configured in `src/content/config.ts`

### Dynamic Content
- **Events**: Fetched from Notion database via API
- **New Projects**: Fetched from external project management app (test integration)

## Image Handling

### The Problem
Notion images are stored in S3 with expiring URLs (~1 hour), causing broken images.

### The Solution
**Cloudflare Worker Proxy** (`cloudflare-worker/worker.js`):
- Converts: `notion-s3-url` → `worker-domain/proxy/{base64-encoded-url}`
- Caches images for 2+ weeks
- Fallback to T4P logo on S3 failures
- CORS-enabled for cross-origin access

## Database Integration

### Notion API
- **Client**: `src/store/notionClient.ts`
- **Functions**: 
  - `fetchNotionEvents()` - Get all events
  - `fetchNotionEventById()` - Get single event
- **Data Processing**: Automatic image URL conversion to proxy URLs

## Styling & UI

### Design System
- **Tailwind CSS** - Utility classes for layout and basic styling
- **Material-UI** - Cards, buttons, form components, icons
- **Custom CSS**: `src/styles/base.css` for global styles

### Color Scheme
- Palestine colors: Red (`#EA4335`), Green (`#168039`)
- Status indicators: Green for active/upcoming, Red for past/inactive

## Common Patterns

### Page Structure
```astro
---
// Server-side logic
import Layout from "../layouts/Layout.astro";
import Component from "../components/Component.tsx";

let data = await fetchData();
---

<Layout title="Page Title">
    <PageHeader
        overline="Tech for Palestine"
        title="Page Title"
        subtitle="Page description"
    />
    <Component data={data} client:only="react" />
</Layout>
```

### API Routes
```typescript
export async function GET() {
    try {
        const data = await fetchData();
        return new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error) {
        return new Response('Error', { status: 500 });
    }
}
```

### React Component with Data Fetching
```tsx
export default function Component({ initialData, loading: initialLoading = false }) {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(initialLoading);

    const fetchFreshData = async () => {
        // Fetch logic with loading states
    };

    useEffect(() => {
        if (initialData.length === 0) {
            fetchFreshData();
        }
    }, []);

    return (
        // Component JSX with Material-UI components
    );
}
```

## Quick Reference

### File Naming
- **Pages**: `kebab-case.astro`
- **Components**: `PascalCase.tsx/jsx/astro/svelte`
- **Utilities**: `camelCase.ts`
- **Content**: `kebab-case.md`

### When User Says...
- **"events page"** → `src/pages/events.astro` + `src/components/Events.tsx`
- **"projects page"** → `src/pages/projects.astro` (static) or `src/pages/projects-new.astro` (dynamic)
- **"homepage"** → `src/pages/index.astro`
- **"change this link"** → Look in the relevant page or component file
- **"API route"** → `src/pages/api/*.ts`
- **"form component"** → `src/components/hook-form/` or main components directory

### Image References
- **Default/fallback**: `/images/default.jpg`
- **Project icons**: `/projectIcons/`
- **General images**: `/public/` root for static assets

### Common File Locations
- **Layout**: `src/layouts/Layout.astro`
- **Navigation**: `src/components/Navigation.astro`
- **Footer**: `src/components/Footer.astro`
- **Base styles**: `src/styles/base.css`
- **Config**: `astro.config.mjs`, `tailwind.config.mjs`, `tsconfig.json`

## Deployment Notes

### Website
- Deployed to Cloudflare Pages
- Build command: `yarn build`
- Output directory: `dist/`

### Cloudflare Worker
- Separate deployment: `cd cloudflare-worker && wrangler deploy`
- Required for image proxy functionality
- Must be deployed before website to ensure image URLs work

## Security & Best Practices

- **No API keys in frontend code** - Use server-side API routes
- **Image proxy prevents exposure** of Notion S3 URLs
- **CORS properly configured** for cross-origin requests
- **Environment variables** for sensitive configuration

---

## Development Guidelines for Claude Code

### Before Making Changes
1. **Always identify the correct file** based on user requirements
2. **Read existing code patterns** and follow the same conventions  
3. **Check imports and dependencies** before adding new libraries
4. **Verify branch status** to avoid working on merged branches

### Code Style
- **Follow existing patterns** in the codebase
- **Use TypeScript types** where defined
- **Maintain consistent spacing** and formatting
- **Keep Material-UI component patterns** consistent

### Testing Changes
- **Run `yarn dev`** to test locally
- **Check console** for errors or warnings
- **Test responsive design** on different screen sizes
- **Verify image loading** if working with Notion integration

This documentation provides context for understanding the Tech for Palestine website structure and common development patterns. Use it to provide accurate, contextual assistance for any code changes or questions.
- When I say "ship it" I want you to create a new branch (if we're on main or a previously merged feature branch), stage and commit new edits, push it to github and open a PR.