import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  try {
    console.log('API: Starting fetchProjectsFromApp...');
    
    // TODO: Replace with your actual projects app API endpoint
    // const response = await fetch('https://your-projects-app.com/api/projects', {
    //   headers: {
    //     'Authorization': 'Bearer YOUR_API_KEY', // Add your auth here
    //     'Content-Type': 'application/json'
    //   }
    // });
    
    // For now, return mock data to test the structure
    const mockProjects = [
      {
        id: '1',
        title: 'Test Project 1',
        description: 'This is a test project from the new app',
        url: 'https://example1.com',
        channel: 'https://discord.gg/test1',
        status: 'Active',
        category: 'Web App',
        image: '/images/default.jpg',
        lastUpdated: new Date().toISOString()
      },
      {
        id: '2', 
        title: 'Test Project 2',
        description: 'Another test project to verify the integration works',
        url: 'https://example2.com',
        channel: 'https://discord.gg/test2',
        status: 'In Development',
        category: 'Mobile App',
        image: '/images/default.jpg',
        lastUpdated: new Date().toISOString()
      }
    ];
    
    console.log(`API: Returning ${mockProjects.length} projects`);
    
    return new Response(JSON.stringify(mockProjects), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Project-Count': mockProjects.length.toString(),
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