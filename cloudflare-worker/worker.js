// Cloudflare Worker for proxying and caching Notion images
// Deploy this to a CF Worker (e.g., notion-images.your-domain.com)
// Version: 2.1 - CORS support with forced cache refresh

export default {
  async fetch(request, _env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Handle GET and HEAD requests
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Extract the encoded Notion URL from the path
    // URL format: /proxy/{base64-encoded-notion-url}
    const pathParts = url.pathname.split("/");
    if (pathParts.length < 3 || pathParts[1] !== "proxy") {
      return new Response("Invalid URL format. Use: /proxy/{base64-encoded-url}", {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    let notionUrl;
    try {
      // Decode the base64-encoded Notion URL
      notionUrl = atob(pathParts[2]);

      // Validate it's a Notion S3 URL
      if (
        !notionUrl.includes("s3.us-west-2.amazonaws.com") &&
        !notionUrl.includes("prod-files-secure.s3")
      ) {
        throw new Error("Invalid Notion URL");
      }
    } catch (error) {
      return new Response("Invalid encoded URL", {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Check if this is an expired S3 URL by parsing expiration time
    let isExpiredUrl = false;
    try {
      const urlObj = new URL(notionUrl);
      const expiresParam = urlObj.searchParams.get("X-Amz-Expires");
      const dateParam = urlObj.searchParams.get("X-Amz-Date");

      if (expiresParam && dateParam) {
        // Parse the date parameter (format: YYYYMMDDTHHMMSSZ)
        const year = parseInt(dateParam.substring(0, 4));
        const month = parseInt(dateParam.substring(4, 6)) - 1; // JS months are 0-based
        const day = parseInt(dateParam.substring(6, 8));
        const hour = parseInt(dateParam.substring(9, 11));
        const minute = parseInt(dateParam.substring(11, 13));
        const second = parseInt(dateParam.substring(13, 15));

        const signedDate = new Date(Date.UTC(year, month, day, hour, minute, second));
        const expirationDate = new Date(signedDate.getTime() + parseInt(expiresParam) * 1000);
        const now = new Date();

        isExpiredUrl = now > expirationDate;
        console.log(
          `URL expiration check: signed=${signedDate.toISOString()}, expires=${expirationDate.toISOString()}, now=${now.toISOString()}, expired=${isExpiredUrl}`
        );
      }
    } catch (parseError) {
      console.log("Could not parse S3 URL expiration, proceeding with fetch:", parseError.message);
    }

    // If URL is expired, don't check cache and don't cache the result - go straight to fallback
    if (isExpiredUrl) {
      console.log("S3 URL is expired, using default image immediately");
      try {
        const defaultImageUrl = "https://techforpalestine.org/t4p-logo.png";
        const fallbackResponse = await fetch(defaultImageUrl);

        if (fallbackResponse.ok) {
          const headers = new Headers(fallbackResponse.headers);
          headers.set(
            "Cache-Control",
            "public, max-age=1209600, s-maxage=2419200, stale-while-revalidate=2419200"
          );
          headers.set("X-Cached-By", "CF-Worker-Expired-Fallback");
          headers.set("Access-Control-Allow-Origin", "*");
          headers.set("Access-Control-Allow-Methods", "GET, HEAD");
          headers.set("Access-Control-Allow-Headers", "Content-Type");

          return new Response(request.method === "HEAD" ? null : fallbackResponse.body, {
            status: fallbackResponse.status,
            statusText: fallbackResponse.statusText,
            headers: headers,
          });
        }
      } catch (fallbackError) {
        console.error("Fallback for expired URL also failed:", fallbackError);
      }
    }

    // Check cache first (only for non-expired URLs)
    const cache = caches.default;
    const cacheKey = new Request(request.url, request);
    let response = await cache.match(cacheKey);

    if (!response) {
      try {
        // Fetch from Notion's S3
        response = await fetch(notionUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; NotionImageProxy/1.0)",
          },
        });

        if (!response.ok) {
          console.error(
            `S3 fetch failed: ${response.status} ${response.statusText} for URL: ${notionUrl}`
          );
          console.log(`Falling back to default image`);

          // Fetch the default image instead of returning an error
          try {
            const defaultImageUrl = "https://techforpalestine.org/t4p-logo.png";
            response = await fetch(defaultImageUrl);

            if (!response.ok) {
              throw new Error(`Default image also failed: ${response.status}`);
            }

            console.log(`Successfully fetched default image`);
          } catch (defaultError) {
            console.error("Failed to fetch default image:", defaultError);
            throw new Error(`Both original and default image failed`);
          }
        }

        // Clone response to cache it
        const responseToCache = response.clone();

        // Add cache and CORS headers (cache for 2 weeks, serve stale for up to 4 weeks)
        const headers = new Headers(responseToCache.headers);
        headers.set(
          "Cache-Control",
          "public, max-age=1209600, s-maxage=2419200, stale-while-revalidate=2419200"
        );
        headers.set("X-Cached-By", "CF-Worker");

        // Add CORS headers for cross-origin image requests
        headers.set("Access-Control-Allow-Origin", "*");
        headers.set("Access-Control-Allow-Methods", "GET, HEAD");
        headers.set("Access-Control-Allow-Headers", "Content-Type");

        // Create response with cache headers
        // For HEAD requests, don't include body
        response = new Response(request.method === "HEAD" ? null : responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers,
        });

        // Cache the response
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      } catch (error) {
        console.error("Error fetching image:", error);
        console.log("Attempting final fallback to default image");

        // Final fallback: try to serve the default image
        try {
          const defaultImageUrl = "https://techforpalestine.org/t4p-logo.png";
          const fallbackResponse = await fetch(defaultImageUrl);

          if (fallbackResponse.ok) {
            const headers = new Headers(fallbackResponse.headers);
            headers.set(
              "Cache-Control",
              "public, max-age=1209600, s-maxage=2419200, stale-while-revalidate=2419200"
            );
            headers.set("X-Cached-By", "CF-Worker-Fallback");
            headers.set("Access-Control-Allow-Origin", "*");
            headers.set("Access-Control-Allow-Methods", "GET, HEAD");
            headers.set("Access-Control-Allow-Headers", "Content-Type");

            const finalResponse = new Response(
              request.method === "HEAD" ? null : fallbackResponse.body,
              {
                status: fallbackResponse.status,
                statusText: fallbackResponse.statusText,
                headers: headers,
              }
            );

            // Cache the fallback response
            ctx.waitUntil(cache.put(cacheKey, finalResponse.clone()));
            return finalResponse;
          }
        } catch (fallbackError) {
          console.error("Final fallback also failed:", fallbackError);
        }

        // If all else fails, return an error
        return new Response("Failed to fetch image", {
          status: 502,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }
    } else {
      // Add header to indicate cache hit and CORS headers
      const headers = new Headers(response.headers);
      headers.set("X-Cache-Status", "HIT");

      // Add CORS headers for cross-origin image requests
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Access-Control-Allow-Methods", "GET, HEAD");
      headers.set("Access-Control-Allow-Headers", "Content-Type");
      // For HEAD requests, don't include body
      response = new Response(request.method === "HEAD" ? null : response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers,
      });
    }

    return response;
  },
};
