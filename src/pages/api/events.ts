import type { APIRoute } from 'astro';
import { fetchNotionEvents } from '../../store/notionClient';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    console.log('Fetching events from Notion...', { forceRefresh, timestamp: new Date().toISOString() });
    const events = await fetchNotionEvents();
    console.log(`Fetched ${events.length} events from Notion`);
    
    // Add timestamp to response for debugging
    const responseData = {
      events,
      fetchTime: new Date().toISOString(),
      forceRefresh
    };
    
    return new Response(JSON.stringify(forceRefresh ? responseData : events), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Fetch-Time': new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    
    return new Response(JSON.stringify({ error: 'Failed to fetch events', timestamp: new Date().toISOString() }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};