import type { APIRoute } from "astro";
import { getEnv } from "../../utils/getEnv.js";

export const prerender = false;

// Retry helper for handling cold starts
async function fetchWithRetry(url: string, options: RequestInit & { cf?: any }, maxRetries = 2) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const attemptStart = Date.now();
      const response = await fetch(url, options);
      const fetchTime = Date.now() - attemptStart;

      console.log(`[API /api/projects] Attempt ${attempt + 1}/${maxRetries + 1}: ${response.status} in ${fetchTime}ms`);

      // If successful or client error (4xx), return immediately
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // For server errors (5xx), retry unless it's the last attempt
      if (response.status >= 500 && attempt < maxRetries) {
        const errorText = await response.text();
        console.warn(`[API /api/projects] Server error on attempt ${attempt + 1}, retrying...`, errorText);
        lastError = new Error(`ProjectHub API returned ${response.status}: ${response.statusText}`);

        // Wait before retrying (exponential backoff: 500ms, 1000ms)
        const delay = 500 * (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (error) {
      console.error(`[API /api/projects] Fetch error on attempt ${attempt + 1}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = 500 * (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

export const GET: APIRoute = async ({ locals }) => {
  const startTime = Date.now();
  try {
    const PROJECTHUB_API_KEY = getEnv("PROJECTHUB_API_KEY", locals);
    console.log(`[API /api/projects] Starting fetch, API key present: ${!!PROJECTHUB_API_KEY}`);

    // Fetch with automatic retry for cold starts
    const response = await fetchWithRetry(
      "https://projecthub.techforpalestine.org/api/public/projects",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          "User-Agent": "T4P-Website/1.0",
          "X-API-Key": PROJECTHUB_API_KEY || "",
        },
        // Cloudflare-specific fetch options to bypass all caching
        cf: {
          cacheEverything: false,
        },
      } as RequestInit & { cf?: any },
      2 // Max 2 retries (3 total attempts)
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API /api/projects] Final error response:`, errorText);
      throw new Error(`ProjectHub API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Handle different possible response structures
    let projects;
    if (Array.isArray(data)) {
      projects = data;
    } else if (data.data && Array.isArray(data.data)) {
      projects = data.data;
    } else if (data.projects && Array.isArray(data.projects)) {
      projects = data.projects;
    } else {
      projects = [];
    }

    const totalTime = Date.now() - startTime;
    console.log(`[API /api/projects] Returning ${projects.length} projects (total time: ${totalTime}ms)`);

    return new Response(JSON.stringify(projects), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        // Comprehensive cache control headers
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0",
        Pragma: "no-cache",
        Expires: "0",
        // Cloudflare-specific headers
        "CF-Cache-Status": "DYNAMIC",
        Vary: "*",
        // Custom headers for debugging
        "X-Project-Count": projects.length.toString(),
        "X-Fetch-Time": new Date().toISOString(),
        "X-Cache-Bust": Date.now().toString(),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[API /api/projects] Fatal error:`, error);

    return new Response(
      JSON.stringify({
        error: "Failed to fetch projects",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
};
