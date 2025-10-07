import type { APIRoute } from 'astro';
import { fetchNotionAgenda } from '../../store/notionClient';

export const prerender = true;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const data = await fetchNotionAgenda(locals);

    return new Response(JSON.stringify(data), {
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
    console.error('Error fetching agenda and speakers:', error);

    return new Response(JSON.stringify({ error: 'Failed to fetch agenda and speakers'}), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};
