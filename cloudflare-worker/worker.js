// Cloudflare Worker for proxying and caching Notion images
// Deploy this to a CF Worker (e.g., notion-images.your-domain.com)
// Version: 2.1 - CORS support with forced cache refresh

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Handle GET and HEAD requests
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Extract the encoded Notion URL from the path
    // URL format: /proxy/{base64-encoded-notion-url}
    const pathParts = url.pathname.split('/');
    if (pathParts.length < 3 || pathParts[1] !== 'proxy') {
      return new Response('Invalid URL format. Use: /proxy/{base64-encoded-url}', { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    let notionUrl;
    try {
      // Decode the base64-encoded Notion URL
      notionUrl = atob(pathParts[2]);
      
      // Validate it's a Notion S3 URL
      if (!notionUrl.includes('s3.us-west-2.amazonaws.com') && 
          !notionUrl.includes('prod-files-secure.s3')) {
        throw new Error('Invalid Notion URL');
      }
    } catch (error) {
      return new Response('Invalid encoded URL', { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    // Check cache first
    const cache = caches.default;
    const cacheKey = new Request(request.url, request);
    let response = await cache.match(cacheKey);

    if (!response) {
      try {
        // Fetch from Notion's S3
        response = await fetch(notionUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NotionImageProxy/1.0)',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }

        // Clone response to cache it
        const responseToCache = response.clone();
        
        // Add cache and CORS headers (cache for 24 hours, serve stale for up to 7 days)
        const headers = new Headers(responseToCache.headers);
        headers.set('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800');
        headers.set('X-Cached-By', 'CF-Worker');
        
        // Add CORS headers for cross-origin image requests
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, HEAD');
        headers.set('Access-Control-Allow-Headers', 'Content-Type');
        
        // Create response with cache headers
        // For HEAD requests, don't include body
        response = new Response(request.method === 'HEAD' ? null : responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers,
        });

        // Cache the response
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      } catch (error) {
        console.error('Error fetching image:', error);
        return new Response('Failed to fetch image', { 
          status: 502,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        });
      }
    } else {
      // Add header to indicate cache hit and CORS headers
      const headers = new Headers(response.headers);
      headers.set('X-Cache-Status', 'HIT');
      
      // Add CORS headers for cross-origin image requests
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, HEAD');
      headers.set('Access-Control-Allow-Headers', 'Content-Type');
      // For HEAD requests, don't include body
      response = new Response(request.method === 'HEAD' ? null : response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers,
      });
    }

    return response;
  },
};