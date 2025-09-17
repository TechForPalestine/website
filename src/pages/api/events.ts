import type { APIRoute } from 'astro';
import { fetchNotionEvents } from '../../store/notionClient';

export const prerender = false;


export const GET: APIRoute = async ({ request, locals }) => {
  try {
      const url = new URL(request.url);
      const showAll = url.searchParams.get('showAll') === 'yes';

    const events = await fetchNotionEvents(showAll, locals);

    return new Response(JSON.stringify(events), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    
    return new Response(JSON.stringify({ error: 'Failed to fetch events'}), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};