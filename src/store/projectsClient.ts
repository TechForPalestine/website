import { getEnv } from "../utils/getEnv.js";
import { sanitizeUrl, type ProjectItem, type Tag } from "../components/projects/projectData.js";
import {
  MAX_STALE_MS,
  resolveWithCache,
  type CacheSource,
  type CachedEntry,
} from "../utils/projectsCachePolicy.js";

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

export interface ProjectsResult extends ProjectsData {
  /** Where this answer came from, for the X-Projects-Source header. */
  source: CacheSource;
}

// A synthetic URL, never the outbound request. That request carries the
// X-API-Key header, and keying the cache on a fresh Request means the secret
// can never be part of a cache entry. Bump the version whenever
// sanitizeProjectUrls changes: entries store already-sanitized data, so an old
// entry would otherwise bypass the new rules.
const CACHE_KEY_URL = "https://projecthub-cache.internal/projects?v=1";
const CACHE_HARD_TTL_SECONDS = MAX_STALE_MS / 1000;

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
async function fetchProjectsUpstream(locals: App.Locals): Promise<ProjectsData> {
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

// Cloudflare's default cache is not on the standard CacheStorage type. Absent
// in `astro dev`, in Node, and on *.pages.dev previews (it only works on a
// custom domain), in which case this returns null and callers fall back to
// fetching every time, exactly as before caching existed.
function getCache(locals: App.Locals): Cache | null {
  const storage = locals.runtime?.caches ?? (globalThis as { caches?: CacheStorage }).caches;
  return (storage as (CacheStorage & { default?: Cache }) | undefined)?.default ?? null;
}

function isCachedProjects(value: unknown): value is CachedEntry<ProjectsData> {
  const entry = value as CachedEntry<ProjectsData> | null;
  return (
    !!entry &&
    typeof entry.storedAt === "number" &&
    Array.isArray(entry.data?.projects) &&
    Array.isArray(entry.data?.tags)
  );
}

/**
 * The ProjectHub list, cached. See utils/projectsCachePolicy.ts for the policy:
 * fresh for 5 minutes, and if ProjectHub is down the last good copy is served
 * for up to 24 hours. Throws only when there is neither. Used by /api/projects,
 * the /projects/<slug> preview and the project sitemap.
 */
export async function fetchProjectsData(locals: App.Locals): Promise<ProjectsResult> {
  const cache = getCache(locals);
  const cacheKey = () => new Request(CACHE_KEY_URL);

  const { data, source } = await resolveWithCache<ProjectsData>({
    now: () => Date.now(),
    readCache: async () => {
      if (!cache) return null;
      const response = await cache.match(cacheKey());
      const parsed: unknown = response ? await response.json() : null;
      return isCachedProjects(parsed) ? parsed : null;
    },
    fetchFresh: () => fetchProjectsUpstream(locals),
    writeCache: (entry) => {
      if (!cache) return;
      const put = cache.put(
        cacheKey(),
        new Response(JSON.stringify(entry), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": `max-age=${CACHE_HARD_TTL_SECONDS}`,
          },
        })
      );
      // Keep the write alive after the response is sent.
      locals.runtime?.ctx?.waitUntil(put.catch(() => {}));
    },
    // An empty list usually means an unexpected upstream shape, not that every
    // project vanished. Never let it replace a good entry.
    isCacheable: (result) => result.projects.length > 0,
    onServeStale: (reason) =>
      console.warn("[projectsClient] ProjectHub unavailable, serving the cached copy", reason),
  });

  return { ...data, source };
}
