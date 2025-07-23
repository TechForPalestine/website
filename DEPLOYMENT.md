# Notion Image Proxy Deployment

This project uses a Cloudflare Worker to proxy Notion images and prevent URL expiration.

**Important**: The Cloudflare Worker is deployed separately from your website. The worker files in `cloudflare-worker/` are NOT part of your Cloudflare Pages auto-deployment.

## Setup Instructions

### 1. Deploy the Cloudflare Worker

```bash
# Install Wrangler CLI if you haven't already
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Navigate to worker directory and deploy
cd cloudflare-worker
wrangler deploy
```

### 2. Configure Custom Domain (Recommended)

1. In Cloudflare Dashboard → Workers & Pages → Your Worker
2. Go to "Triggers" tab
3. Add a custom domain (e.g., `notion-images.yourdomain.com`)

### 3. Update Environment Variable

Add the worker URL to your environment:

```bash
# .env (local development)
NOTION_IMAGE_PROXY_URL=https://notion-images.yourdomain.com

# In Cloudflare Pages environment variables
NOTION_IMAGE_PROXY_URL=https://notion-images.yourdomain.com
```

### 4. Test the Setup

1. Build and deploy your site
2. Check that event images load correctly
3. Verify images don't break after 1 hour

## How It Works

1. **Image Detection**: The `notionClient.ts` detects Notion-hosted images (`file.type === "file"`)
2. **URL Proxying**: Converts expiring S3 URLs to stable proxy URLs
3. **Caching**: Worker caches images at Cloudflare edge for 24 hours
4. **Fallback**: If proxy fails, falls back to original URL

## URL Format

- **Original**: `https://s3.us-west-2.amazonaws.com/...?expires=...`
- **Proxied**: `https://notion-images.yourdomain.com/proxy/{base64-encoded-url}`

## Troubleshooting

- **Images not loading**: Check worker deployment and domain configuration
- **CORS errors**: Ensure worker domain is properly configured
- **Cache issues**: Worker includes cache headers for optimal performance