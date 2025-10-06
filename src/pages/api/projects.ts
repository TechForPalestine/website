import type { APIRoute } from 'astro';
import { getEnv } from '../../utils/getEnv.js';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const PROJECTHUB_API_KEY = getEnv('PROJECTHUB_API_KEY', locals);

    // Force fresh fetch with comprehensive cache-busting
    const response = await fetch('https://projecthub.techforpalestine.org/api/public/projects', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'User-Agent': 'T4P-Website/1.0',
        'X-API-Key': PROJECTHUB_API_KEY || ''
      },
      // Cloudflare-specific fetch options to bypass all caching
      cf: {
        cacheEverything: false
      }
    } as RequestInit & { cf?: any });

    if (!response.ok) {
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
    
    return new Response(JSON.stringify(projects), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        // Comprehensive cache control headers
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        // Cloudflare-specific headers
        'CF-Cache-Status': 'DYNAMIC',
        'Vary': '*',
        // Custom headers for debugging
        'X-Project-Count': projects.length.toString(),
        'X-Fetch-Time': new Date().toISOString(),
        'X-Cache-Bust': Date.now().toString(),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return new Response(JSON.stringify({
      error: 'Failed to fetch projects',
      details: errorMessage
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};
