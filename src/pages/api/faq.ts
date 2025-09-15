import type { APIRoute } from 'astro';
import { fetchNotionFAQ } from '../../store/notionClient';

export const GET: APIRoute = async () => {
    try {
        const faqs = await fetchNotionFAQ();
        
        return new Response(JSON.stringify(faqs), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (error) {
        console.error('Error fetching FAQs:', error);
        return new Response(JSON.stringify([]), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};