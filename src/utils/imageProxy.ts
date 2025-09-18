import { getEnv } from './getEnv.js';

// Utility for generating proxy URLs for Notion images
// Replace with your actual worker domain after deployment
const WORKER_DOMAIN = getEnv('NOTION_IMAGE_PROXY_URL') || 'https://notion-image-proxy.paul-cf1.workers.dev';

/**
 * Converts a Notion image URL to a proxied URL that won't expire
 * @param notionUrl The original Notion S3 URL
 * @returns Stable proxy URL
 */
export function getProxiedImageUrl(notionUrl: string): string {
  // Return original URL if it's already a local path or external URL
  if (!notionUrl || 
      notionUrl.startsWith('/') || 
      (!notionUrl.includes('s3.us-west-2.amazonaws.com') && 
       !notionUrl.includes('prod-files-secure.s3'))) {
    return notionUrl;
  }

  // Check if URL is already expired by looking for X-Amz-Date and X-Amz-Expires
  try {
    const url = new URL(notionUrl);
    const amzDate = url.searchParams.get('X-Amz-Date');
    const amzExpires = url.searchParams.get('X-Amz-Expires');
    
    if (amzDate && amzExpires) {
      const urlDate = new Date(
        `${amzDate.slice(0, 4)}-${amzDate.slice(4, 6)}-${amzDate.slice(6, 8)}T${amzDate.slice(9, 11)}:${amzDate.slice(11, 13)}:${amzDate.slice(13, 15)}Z`
      );
      const expiryTime = urlDate.getTime() + (parseInt(amzExpires) * 1000);
      const now = Date.now();
      
      if (now > expiryTime) {
        console.warn('Notion URL has expired:', { notionUrl, expired: new Date(expiryTime), now: new Date(now) });
        return '/images/default.jpg'; // Return default immediately for expired URLs
      }
    }
  } catch (error) {
    console.warn('Could not parse Notion URL for expiry check:', error);
  }

  try {
    // Encode the Notion URL in base64
    const encodedUrl = btoa(notionUrl);
    const proxiedUrl = `${WORKER_DOMAIN}/proxy/${encodedUrl}`;
    console.log('Generated proxy URL:', { original: notionUrl, proxied: proxiedUrl });
    return proxiedUrl;
  } catch (error) {
    console.error('Failed to encode Notion URL:', error);
    return '/images/default.jpg'; // Use default instead of potentially broken original URL
  }
}

/**
 * Batch convert multiple Notion URLs to proxy URLs
 * @param urls Array of Notion URLs
 * @returns Array of proxy URLs
 */
export function getProxiedImageUrls(urls: string[]): string[] {
  return urls.map(url => getProxiedImageUrl(url));
}