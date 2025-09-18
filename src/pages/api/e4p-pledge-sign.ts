import type { APIRoute } from 'astro';
import { Client } from '@notionhq/client';
import { getEnv } from '../../utils/getEnv.js';

const notion = new Client({ 
  auth: getEnv('NOTION_SECRET')
});

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    
    const pledgeData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      company: formData.get('company') as string,
      position: formData.get('position') as string,
      linkedin: formData.get('linkedin') as string,
      agreement: formData.get('agreement') === 'on',
      submittedAt: new Date().toISOString()
    };

    if (!pledgeData.name || !pledgeData.email || !pledgeData.company || !pledgeData.position || !pledgeData.linkedin || !pledgeData.agreement) {
      return new Response(JSON.stringify({ error: 'All fields are required and agreement must be checked' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const databaseId = getEnv('NOTION_SIGNATORIES_DB_ID');
    
    if (!databaseId) {
      throw new Error("NOTION_SIGNATORIES_DB_ID not configured");
    }

    const response = await notion.pages.create({
      parent: {
        database_id: databaseId
      },
      properties: {
        "Name": {
          title: [
            {
              text: {
                content: pledgeData.name
              }
            }
          ]
        },
        "Email": {
          email: pledgeData.email
        },
        "Company": {
          rich_text: [
            {
              text: {
                content: pledgeData.company
              }
            }
          ]
        },
        "Position": {
          rich_text: [
            {
              text: {
                content: pledgeData.position
              }
            }
          ]
        },
        "LinkedIn URL": {
          url: pledgeData.linkedin
        },
        "Approved": {
          checkbox: false
        },
        "Signed At": {
          date: {
            start: new Date().toISOString()
          }
        }
      }
    });

    const signatory = {
      id: response.id,
      url: `https://notion.so/${response.id.replace(/-/g, '')}`,
      name: pledgeData.name,
      company: pledgeData.company,
      position: pledgeData.position
    };

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Pledge signed successfully',
      signatory
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error processing pledge:', error);
    
    return new Response(JSON.stringify({ error: 'Failed to process pledge' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};