import { env as workerEnv } from "cloudflare:workers";

// Helper function to get environment variables with proper fallbacks
export function getEnv(name: string, locals?: any): string | undefined {
  // Try the Cloudflare Workers runtime env first (for production/dev via wrangler)
  const fromWorkerEnv = (workerEnv as Record<string, string | undefined>)[name];
  if (fromWorkerEnv) {
    return fromWorkerEnv;
  }

  // Try Astro's import.meta.env (for build-time variables)
  if (import.meta.env[name]) {
    return import.meta.env[name];
  }

  // Try Node.js process.env (for development and server environments)
  if (typeof process !== "undefined" && process.env?.[name]) {
    return process.env[name];
  }

  return undefined;
}
