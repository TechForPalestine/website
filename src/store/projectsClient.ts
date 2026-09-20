import { getEnv } from "../utils/getEnv.js";
import { sanitizeUrl, type ProjectItem, type Tag } from "../components/projects/projectData.js";

// Server-side access to ProjectHub. Shared by /api/projects (the client
// island's data) and /projects/<slug> (which needs the same list to build a
// shared link's preview), so the two cannot drift apart. See docs/PROJECTS.md.

const PROJECTHUB_URL = "https://projecthub.techforpalestine.org/api/public/projects";
const MAX_RETRIES = 2; // 3 attempts in total
const RETRY_BASE_DELAY_MS = 500;

const URL_FIELDS = [
  "websiteUrl",
  "logoUrl",
  "twitterUrl",
  "linkedinUrl",
  "githubUrl",
  "instagramUrl",
  "facebookUrl",
  "youtubeUrl",
  "telegramUrl",
  "mastodonUrl",
  "blueskyUrl",
  "tiktokUrl",
  "signalUrl",
  "upscrolledUrl",
  "leaderPhoto",
  "donationUrl",
  "involvementUrl",
] as const;

export interface ProjectsData {
  projects: ProjectItem[];
  tags: Tag[];
}

function sanitizeProjectUrls(project: Record<string, unknown>): Record<string, unknown> {
  for (const field of URL_FIELDS) {
    const val = project[field];
    if (typeof val !== "string") continue;
    project[field] = sanitizeUrl(val) || undefined;
  }
  return project;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry helper for handling cold starts
async function fetchWithRetry(url: string, options: RequestInit & { cf?: unknown }) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const isLastAttempt = attempt === MAX_RETRIES;
    try {
      const response = await fetch(url, options);

      // Success, or a client error that retrying will not fix.
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // Server error: retry unless this was the last attempt.
      if (response.status >= 500 && !isLastAttempt) {
        console.warn(
          `[projectsClient] ProjectHub ${response.status} on attempt ${attempt + 1}, retrying`
        );
        lastError = new Error(`ProjectHub API returned ${response.status}: ${response.statusText}`);
        await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
        continue;
      }

      return response;
    } catch (error) {
      console.error(`[projectsClient] Fetch error on attempt ${attempt + 1}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      if (isLastAttempt) break;
      await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
    }
  }

  throw lastError || new Error("All retry attempts failed");
}

/** Throws when ProjectHub is unreachable or returns an error status. */
export async function fetchProjectsData(locals: App.Locals): Promise<ProjectsData> {
  const apiKey = getEnv("PROJECTHUB_API_KEY", locals);

  const response = await fetchWithRetry(PROJECTHUB_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      "User-Agent": "T4P-Website/1.0",
      "X-API-Key": apiKey || "",
    },
    // Cloudflare-specific fetch options to bypass all caching
    cf: { cacheEverything: false },
  } as RequestInit & { cf?: unknown });

  if (!response.ok) {
    console.error(`[projectsClient] Final error response: ${response.status}`);
    throw new Error(`ProjectHub API returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  // Handle different possible response structures
  let projects: Record<string, unknown>[] = [];
  if (Array.isArray(data)) {
    projects = data;
  } else if (Array.isArray(data.data)) {
    projects = data.data;
  } else if (Array.isArray(data.projects)) {
    projects = data.projects;
  }

  const tags: Tag[] = Array.isArray(data.tags) ? data.tags : [];
  projects.forEach(sanitizeProjectUrls);

  return { projects: projects as unknown as ProjectItem[], tags };
}
