import axios from 'axios';
import { getProxiedImageUrl } from '../utils/imageProxy.js';

// Helper function to get environment variables with proper fallbacks
function getEnvVar(name: string): string | undefined {
  // Try Astro's import.meta.env first
  const astroEnv = import.meta.env[name];
  if (astroEnv) return astroEnv;
  
  // Try Node.js process.env
  if (typeof process !== 'undefined' && process.env) {
    const nodeEnv = process.env[name];
    if (nodeEnv) return nodeEnv;
  }
  
  // Try global environment (for Cloudflare Workers)
  if (typeof globalThis !== 'undefined' && (globalThis as any).process?.env) {
    const globalEnv = (globalThis as any).process.env[name];
    if (globalEnv) return globalEnv;
  }
  
  return undefined;
}

const NOTION_SECRET = getEnvVar('NOTION_SECRET');
const NOTION_DB_ID = getEnvVar('NOTION_DB_ID');
const NOTION_FAQ_DB_ID = getEnvVar('NOTION_FAQ_DB_ID');

const notionAxios = axios.create({
    baseURL: "https://api.notion.com/v1/",
    headers: {
        "Authorization": `Bearer ${NOTION_SECRET}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
    },
});
export const fetchNotionEvents = async (showAll: boolean = false) => {
    const filter = showAll ? {} : {
        filter: {
            property: "Visibility",
            checkbox: {
                equals: true
            }
        }
    };
    
    const response = await notionAxios.post(`databases/${NOTION_DB_ID}/query`, filter);

    const events = response.data.results.map((page: any) => {
        const props = page.properties;

        let headerImage = "";
        if (props["Header"]?.files?.length > 0) {
            const file = props["Header"].files[0];
            console.log('Event header file found:', { eventTitle: props["Title"]?.title?.[0]?.plain_text, fileType: file.type, file });
            if (file.type === "external") {
                headerImage = file.external.url;
                console.log('Using external URL:', headerImage);
            } else if (file.type === "file") {
                // Create hash from URL to detect when file changes
                const base64 = (globalThis as any).Buffer
                  ? (globalThis as any).Buffer.from(file.file.url).toString('base64')
                  : btoa(file.file.url);
                const urlHash = base64.slice(0, 8);
                const timestamp = Date.now();
                
                // Add cache busting parameter with both hash and timestamp
                const baseProxyUrl = getProxiedImageUrl(file.file.url);
                headerImage = `${baseProxyUrl}?cb=${timestamp}&hash=${urlHash}`;
                console.log('Using proxied URL with aggressive cache bust:', { 
                    original: file.file.url, 
                    proxied: headerImage,
                    urlHash,
                    timestamp: new Date(timestamp).toISOString()
                });
            }
        } else {
            console.log('No header image found for event:', props["Title"]?.title?.[0]?.plain_text);
        }

        const description =
            props["Description"]?.rich_text?.[0]?.plain_text || "";

        const registerLink = props["Link to registration"]?.url || "";
        const recordingLink = props["Link to recording"]?.url || "";

        return {
            id: page.id,
            title: props["Title"]?.title?.[0]?.plain_text || "Untitled",
            date: props["Date of event"]?.date?.start || "",
            status: props["Stage"]?.select?.name || "",
            location: props["Type of event"]?.multi_select?.[0]?.name || "",
            image: headerImage || "/images/default.jpg",
            link: page.url,
            description,
            registerLink,
            recordingLink,
        };
    });

    // Sort by date (descending)
    return events.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const fetchNotionEventById = async (pageId: string) => {

    const response = await notionAxios.get(`pages/${pageId}`);

    const props = response.data.properties;

    // Image from "Header" files property
    let headerImage = "";
    if (props["Header"]?.files?.length > 0) {
        const file = props["Header"].files[0];
        if (file.type === "external") {
            headerImage = file.external.url;
        } else if (file.type === "file") {
            // Create hash from URL to detect when file changes
            const base64 = (globalThis as any).Buffer
              ? (globalThis as any).Buffer.from(file.file.url).toString('base64')
              : btoa(file.file.url);
            const urlHash = base64.slice(0, 8);
            const timestamp = Date.now();
            
            // Add cache busting parameter with both hash and timestamp
            const baseProxyUrl = getProxiedImageUrl(file.file.url);
            headerImage = `${baseProxyUrl}?cb=${timestamp}&hash=${urlHash}`;
        }
    }

    const description = props["Description"]?.rich_text?.[0]?.plain_text || "";
    const registerLink = props["Link to registration"]?.url || "";
    const recordingLink = props["Link to recording"]?.url || "";

    return {
        id: response.data.id,
        title: props["Title"]?.title?.[0]?.plain_text || "Untitled",
        date: props["Date of event"]?.date?.start || "",
        status: props["Stage"]?.select?.name || "",
        location: props["Type of event"]?.multi_select?.[0]?.name || "",
        image: headerImage || "/images/default.jpg",
        link: response.data.url,
        description,
        registerLink,
        recordingLink,
    };
};

export const fetchNotionFAQ = async (showAll: boolean = false) => {
    const queryBody = {
        sorts: [
            {
                property: "Question",
                direction: "ascending"
            }
        ],
        ...(showAll ? {} : {
            filter: {
                property: "Visibility",
                checkbox: {
                    equals: true
                }
            }
        })
    };
    
    const response = await notionAxios.post(`databases/${NOTION_FAQ_DB_ID}/query`, queryBody);

    const faqs = response.data.results.map((page: any) => {
        const props = page.properties;

        const question = props["Question"]?.title?.[0]?.plain_text || "";
        const answer = props["Answer"]?.rich_text || [];

        return {
            id: page.id,
            question,
            answer,
        };
    });

    return faqs;
};
