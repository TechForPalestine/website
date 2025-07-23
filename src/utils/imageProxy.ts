// Utility for generating proxy URLs for Notion images
// Replace with your actual worker domain after deployment
const WORKER_DOMAIN = process.env.NOTION_IMAGE_PROXY_URL || 'https://notion-image-proxy.paul-cf1.workers.dev';

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

  try {
    // Encode the Notion URL in base64
    const encodedUrl = btoa(notionUrl);
    return `${WORKER_DOMAIN}/proxy/${encodedUrl}`;
  } catch (error) {
    console.error('Failed to encode Notion URL:', error);
    return notionUrl; // Fallback to original URL
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