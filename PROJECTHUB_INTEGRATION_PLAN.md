# ProjectHub Integration Plan

_Integration plan for using ProjectHub as the data source for the Tech for Palestine website's /projects page_

## Overview

This document outlines the plan to integrate ProjectHub's project data into the Tech for Palestine website, replacing the current markdown-based content collection with live data from ProjectHub's API.

## Current State Analysis

### Website Projects Page (`/projects`)

- **Current Source**: Markdown files in `/src/content/projects/`
- **Data Structure**: Title, URL, Discord channel, description
- **Rendering**: Astro content collection with static generation
- **Location**: `src/pages/projects.astro`

### ProjectHub Projects System

- **Database Schema**: Rich project data model (see `shared/schema.ts:108-144`)
- **API Endpoint**: `/api/projects` (currently requires authentication)
- **Data Fields**: Name, description, logos, social links, status, team info, etc.
- **Project Statuses**: `onboarding`, `active`, `dormant`, `archived`

## Required ProjectHub Changes

### 1. Create Public Projects API Endpoint

**File**: `server/routes.ts`
**Location**: Add after line ~801

```typescript
// Public projects endpoint - no authentication required
app.get("/api/public/projects", apiRateLimit, async (req, res) => {
  try {
    // Add security headers
    res.set({
      "Cache-Control": "public, max-age=300, s-maxage=300", // 5 minute cache
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Access-Control-Allow-Origin": "https://techforpalestine.org",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Accept, Content-Type",
    });

    // Get only active projects for public display
    const { projects } = await storage.getProjects({
      limit: 1000,
      status: "active", // Only show active projects publicly
    });

    // Transform data for public consumption - remove sensitive fields
    const publicProjects = projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      logoUrl: project.logoUrl,
      websiteUrl: project.websiteUrl,
      elevatorPitch: project.elevatorPitch,
      discordUsername: project.discordUsername,

      // Social media links
      twitterUrl: project.twitterUrl,
      linkedinUrl: project.linkedinUrl,
      githubUrl: project.githubUrl,
      instagramUrl: project.instagramUrl,
      youtubeUrl: project.youtubeUrl,
      telegramUrl: project.telegramUrl,

      // Public metadata
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,

      // Exclude sensitive fields:
      // - applicationId, reasonForJoining, resourceNeeds
      // - aboutTeam, commitmentLevel, impact, scalability
      // - progressLevel, targetAudience, mentor
    }));

    res.json({
      projects: publicProjects,
      count: publicProjects.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching public projects:", error);
    res.status(500).json({
      message: "Failed to fetch projects",
      projects: [],
      count: 0,
    });
  }
});
```

### 2. Update Storage Layer (if needed)

**File**: `server/storage.ts` or `server/db.ts`

Ensure the `getProjects` method supports filtering by status:

```typescript
// Add status filtering to existing getProjects method
async getProjects({ limit = 100, offset = 0, status }: {
  limit?: number;
  offset?: number;
  status?: string;
}) {
  let query = db.select().from(projects);

  if (status) {
    query = query.where(eq(projects.status, status));
  }

  const results = await query
    .limit(limit)
    .offset(offset)
    .orderBy(desc(projects.updatedAt));

  return { projects: results };
}
```

### 3. Add CORS Configuration

**File**: `server/index.ts`
**Location**: Add after session setup (~line 200)

```typescript
// CORS configuration for website integration
app.use("/api/public/*", (req, res, next) => {
  const allowedOrigins = [
    "https://techforpalestine.org",
    "https://*.techforpalestine.org",
    "http://localhost:4321", // Astro dev server
    "http://localhost:3000", // Alternative dev server
  ];

  const origin = req.headers.origin;
  if (
    allowedOrigins.some((allowed) =>
      allowed.includes("*") ? origin?.endsWith(allowed.replace("*", "")) : origin === allowed
    )
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "Accept, Content-Type");
  next();
});
```

### 4. Update API Documentation

**File**: `api-docs/complete-api.yaml`
**Location**: Add to paths section

```yaml
/public/projects:
  get:
    tags: [Public]
    summary: Get Active Projects
    description: Returns all active projects for public display (no authentication required)
    security: []
    parameters:
      - name: limit
        in: query
        schema:
          type: integer
          default: 1000
        description: Maximum number of projects to return
    responses:
      "200":
        description: Successful response
        content:
          application/json:
            schema:
              type: object
              properties:
                projects:
                  type: array
                  items:
                    $ref: "#/components/schemas/PublicProject"
                count:
                  type: integer
                lastUpdated:
                  type: string
                  format: date-time

components:
  schemas:
    PublicProject:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        description:
          type: string
          nullable: true
        logoUrl:
          type: string
          nullable: true
        websiteUrl:
          type: string
          nullable: true
        elevatorPitch:
          type: string
        discordUsername:
          type: string
          nullable: true
        twitterUrl:
          type: string
          nullable: true
        linkedinUrl:
          type: string
          nullable: true
        githubUrl:
          type: string
          nullable: true
        status:
          type: string
          enum: [active]
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
```

## Website Implementation Plan

### 1. Create ProjectHub API Client

**File**: `src/lib/projecthubClient.ts`

```typescript
const PROJECTHUB_BASE_URL = "https://projecthub.techforpalestine.org/api";

export interface ProjectHubProject {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  elevatorPitch: string;
  discordUsername?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  telegramUrl?: string;
  status: "active";
  createdAt: string;
  updatedAt: string;
}

export interface ProjectHubResponse {
  projects: ProjectHubProject[];
  count: number;
  lastUpdated: string;
}

// Cache configuration
let cachedProjects: ProjectHubProject[] | null = null;
let lastFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchProjectHubProjects(): Promise<ProjectHubProject[]> {
  const now = Date.now();

  // Return cached data if still fresh
  if (cachedProjects && now - lastFetch < CACHE_TTL) {
    console.log("Using cached ProjectHub projects");
    return cachedProjects;
  }

  try {
    console.log("Fetching projects from ProjectHub API...");

    const response = await fetch(`${PROJECTHUB_BASE_URL}/public/projects`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "TechForPalestine-Website/1.0",
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`ProjectHub API error: ${response.status} ${response.statusText}`);
    }

    const data: ProjectHubResponse = await response.json();

    // Validate response structure
    if (!data.projects || !Array.isArray(data.projects)) {
      throw new Error("Invalid response format from ProjectHub API");
    }

    // Update cache
    cachedProjects = data.projects;
    lastFetch = now;

    console.log(`Fetched ${data.projects.length} projects from ProjectHub`);
    return data.projects;
  } catch (error) {
    console.error("Error fetching projects from ProjectHub:", error);

    // Return stale cache if available during errors
    if (cachedProjects) {
      console.warn("Using stale project cache due to API error");
      return cachedProjects;
    }

    // Throw error if no cache available
    throw new Error(
      `Failed to fetch projects: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Transform ProjectHub data to match existing website interface
export function transformProjectForWebsite(project: ProjectHubProject) {
  return {
    project_name: project.name,
    website: project.websiteUrl || "",
    discord_channel: project.discordUsername
      ? `https://discord.com/channels/1186702814341234740/user/${project.discordUsername}`
      : "",
    elevator_pitch: project.elevatorPitch,

    // Enhanced fields from ProjectHub
    logo_url: project.logoUrl,
    github_url: project.githubUrl,
    twitter_url: project.twitterUrl,
    linkedin_url: project.linkedinUrl,
    instagram_url: project.instagramUrl,
    youtube_url: project.youtubeUrl,
    telegram_url: project.telegramUrl,
    status: project.status,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  };
}
```

### 2. Update Projects Page

**File**: `src/pages/projects.astro`

```astro
---
import Layout from "../layouts/Layout.astro";
import ProjectLogo from "../components/ProjectLogo";
import PageHeader from "../components/PageHeader.astro";
import "../styles/base.css";
import { Icon } from "astro-icon/components";
import { fetchProjectHubProjects, transformProjectForWebsite } from "../lib/projecthubClient";

let projects = [];
let loading = false;
let errorMessage = "";

try {
  const projectHubProjects = await fetchProjectHubProjects();
  projects = projectHubProjects.map(transformProjectForWebsite);
} catch (err) {
  loading = true;
  errorMessage = err instanceof Error ? err.message : "Unknown error";
  console.error("Error fetching projects from ProjectHub:", err);

  // TODO: Fallback to cached/static projects if needed
}
---

<Layout title="Projects">
  <main>
    <PageHeader
      overline="Tech for Palestine"
      title="Incubator Projects"
      subtitle="What is the incubator?"
      subtitleLink="/incubator"
    />
  </main>

  <div class="mx-auto max-w-6xl px-4 py-12">
    {/* Error state */}
    {
      errorMessage && (
        <div class="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <p>Unable to load projects: {errorMessage}</p>
          <p class="mt-1 text-sm">Please try refreshing the page.</p>
        </div>
      )
    }

    {/* Loading state */}
    {
      loading && !errorMessage && (
        <div class="flex items-center justify-center py-12">
          <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-[#EA4335]" />
          <span class="ml-3 text-gray-600">Loading projects...</span>
        </div>
      )
    }

    {/* Projects grid */}
    {
      !loading && !errorMessage && (
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => {
            const nameParts = project.project_name
              .replace(/[^a-zA-Z0-9\s]/g, "")
              .trim()
              .split(/\s+/);

            const logoName = nameParts.slice(0, 2).join("");
            const logoPath = project.logo_url || `/projectIcons/${logoName}.png`;
            const slug = project.project_name
              .replace(/[^a-zA-Z0-9\s]/g, "")
              .trim()
              .toLowerCase()
              .split(/\s+/)
              .join("-");

            return (
              <div
                onclick={`location.href='/project/${slug}'`}
                role="link"
                tabindex="0"
                class="relative flex cursor-pointer flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md focus:outline-none"
              >
                {/* Enhanced logo with fallback */}
                <ProjectLogo
                  projectName={project.project_name}
                  logoUrl={project.logo_url}
                  client:only="react"
                />

                {/* Project title */}
                <h3 class="pr-14 text-lg font-semibold leading-snug tracking-tight text-gray-900">
                  {project.project_name}
                </h3>

                {/* Description */}
                <p class="line-clamp-4 text-sm leading-relaxed text-gray-600">
                  {project.elevator_pitch}
                </p>

                {/* Enhanced social links */}
                {(project.website ||
                  project.github_url ||
                  project.twitter_url ||
                  project.discord_channel) && (
                  <div class="mt-auto flex flex-wrap items-center gap-2">
                    {project.website && (
                      <a
                        href={project.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="group rounded-full bg-gray-100 p-2 transition-colors hover:bg-black"
                        title="Visit Website"
                        onclick="event.stopPropagation()"
                      >
                        <Icon
                          name="ic:baseline-language"
                          class="h-4 w-4 text-gray-800 group-hover:text-white"
                        />
                      </a>
                    )}
                    {project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="group rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-900"
                        title="View on GitHub"
                        onclick="event.stopPropagation()"
                      >
                        <Icon
                          name="mdi:github"
                          class="h-4 w-4 text-gray-800 group-hover:text-white"
                        />
                      </a>
                    )}
                    {project.twitter_url && (
                      <a
                        href={project.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="group rounded-full bg-gray-100 p-2 transition-colors hover:bg-blue-500"
                        title="Follow on Twitter"
                        onclick="event.stopPropagation()"
                      >
                        <Icon
                          name="mdi:twitter"
                          class="h-4 w-4 text-gray-800 group-hover:text-white"
                        />
                      </a>
                    )}
                    {project.discord_channel && (
                      <a
                        href={project.discord_channel}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="group rounded-full bg-gray-100 p-2 transition-colors hover:bg-indigo-600"
                        title="Join Discord"
                        onclick="event.stopPropagation()"
                      >
                        <Icon
                          name="ic:baseline-discord"
                          class="h-4 w-4 text-gray-800 group-hover:text-white"
                        />
                      </a>
                    )}
                  </div>
                )}

                {/* Bottom red/green stripe */}
                <div class="absolute bottom-4 left-1/2 flex h-1.5 w-16 -translate-x-1/2 transform overflow-hidden rounded-full shadow-sm">
                  <div class="w-1/2 bg-[#D32F2F]" />
                  <div class="w-1/2 bg-[#388E3C]" />
                </div>
              </div>
            );
          })}
        </div>
      )
    }

    {/* Projects count */}
    {
      projects.length > 0 && (
        <div class="mt-8 text-center text-sm text-gray-500">
          Showing {projects.length} active projects
        </div>
      )
    }
  </div>

  <!-- Call to Action (unchanged) -->
  <div class="relative mb-8 mt-16">
    <div class="absolute inset-0 flex items-center justify-center">
      <div class="w-full border-t border-gray-300"></div>
    </div>

    <div class="relative flex justify-center">
      <a
        href="https://techforpalestine.org/project-application-form"
        target="_blank"
        class="z-10 inline-flex transform items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-3 text-lg font-semibold text-white shadow-xl transition-colors duration-300 ease-in-out hover:scale-105 hover:from-blue-600 hover:to-blue-800 sm:text-xl md:text-2xl"
      >
        Apply to the T4P Incubator Today!
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="ml-2 h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
        </svg>
      </a>
    </div>
  </div>
</Layout>
```

### 3. Update ProjectLogo Component

**File**: `src/components/ProjectLogo.tsx`

```typescript
interface ProjectLogoProps {
  projectName: string;
  logoUrl?: string;
}

export default function ProjectLogo({ projectName, logoUrl }: ProjectLogoProps) {
  const [imageError, setImageError] = useState(false);

  // Generate fallback logo path
  const nameParts = projectName
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/);
  const logoName = nameParts.slice(0, 2).join("");
  const fallbackPath = `/projectIcons/${logoName}.png`;

  const handleImageError = () => {
    setImageError(true);
  };

  // Priority: ProjectHub logoUrl > local icon > default
  const imageSrc = !imageError && logoUrl ? logoUrl : fallbackPath;

  return (
    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
      <img
        src={imageSrc}
        alt={`${projectName} logo`}
        className="w-full h-full object-contain"
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  );
}
```

## Migration Strategy

### Phase 1: Dual Source (Recommended Start)

1. Keep existing markdown files as fallback
2. Add ProjectHub API integration
3. Use ProjectHub data when available, fall back to markdown on errors

### Phase 2: Primary ProjectHub

1. Switch to ProjectHub as primary source
2. Keep markdown files for emergency fallback only

### Phase 3: ProjectHub Only

1. Remove markdown files and content collection
2. Full ProjectHub integration

## Error Handling & Resilience

### API Failures

- **Network Issues**: Use cached data for up to 1 hour
- **Invalid Response**: Fall back to cached data or show error message
- **Rate Limiting**: Implement exponential backoff

### Data Validation

- Validate API response structure
- Handle missing/null fields gracefully
- Sanitize URLs and user-generated content

### Performance

- **Caching**: 5-minute cache for API responses
- **Build-time**: Fetch data during Astro build
- **Runtime**: Client-side updates for real-time data (optional)

## Testing Checklist

### ProjectHub API Changes

- [ ] Public projects endpoint returns only active projects
- [ ] CORS headers allow website domain
- [ ] Response format matches documented schema
- [ ] Rate limiting allows reasonable website traffic
- [ ] Error responses are properly formatted

### Website Integration

- [ ] Projects page loads without errors
- [ ] Fallback works when API is unavailable
- [ ] Project logos display correctly (ProjectHub + local fallbacks)
- [ ] Social media links work properly
- [ ] Mobile responsive design maintained
- [ ] Performance acceptable (< 3s load time)

## Security Considerations

- **Public API**: Only expose non-sensitive project data
- **CORS**: Restrict to website domains only
- **Rate Limiting**: Prevent abuse of public endpoint
- **Input Validation**: Sanitize all project data for display
- **Error Messages**: Don't expose internal system details

## Future Enhancements

1. **Real-time Updates**: WebSocket/SSE for live project updates
2. **Advanced Filtering**: Project categories, technologies, status
3. **Search**: Client-side project search functionality
4. **Analytics**: Track project page views and clicks
5. **Admin Panel**: Content management for project visibility

---

**Implementation Priority**: High  
**Timeline Estimate**: 2-3 days (1 day ProjectHub changes, 1-2 days website integration)  
**Dependencies**: ProjectHub API access, CORS configuration
