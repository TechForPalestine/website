import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  try {
    console.log('API: Starting fetchProjectsFromApp...');
    
    const response = await fetch('https://projecthub.techforpalestine.org/api/public/projects', {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`ProjectHub API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API: Raw response from ProjectHub:', JSON.stringify(data, null, 2));
    
    // Handle different possible response structures
    let projects;
    if (Array.isArray(data)) {
      projects = data;
    } else if (data.data && Array.isArray(data.data)) {
      projects = data.data;
    } else if (data.projects && Array.isArray(data.projects)) {
      projects = data.projects;
    } else {
      console.error('API: Unexpected response structure:', data);
      projects = [];
    }
    
    console.log(`API: Processed ${projects.length} projects from ProjectHub`);
    console.log('API: First project sample:', projects[0] ? JSON.stringify(projects[0], null, 2) : 'No projects found');
    
    return new Response(JSON.stringify(projects), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Project-Count': projects.length.toString(),
        'X-Fetch-Time': new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('API: Error fetching projects from app:', error);
    
    return new Response(JSON.stringify({ error: 'Failed to fetch projects' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};