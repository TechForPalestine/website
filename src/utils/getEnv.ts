// Helper function to get environment variables with proper fallbacks
export function getEnv(name: string, locals?: any): string | undefined {
  // Try Cloudflare Pages runtime context first (for production)
  if (locals?.runtime?.env?.[name]) {
    return locals.runtime.env[name];
  }
  
  // Try Astro's import.meta.env (for build-time variables)
  if (import.meta.env[name]) {
    return import.meta.env[name];
  }
  
  // Try Node.js process.env (for development and server environments)
  if (typeof process !== 'undefined' && process.env?.[name]) {
    return process.env[name];
  }
  
  // Try global environment (for Cloudflare Workers)
  if (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.[name]) {
    return (globalThis as any).process.env[name];
  }
  
  // Try accessing directly from globalThis (some Cloudflare environments)
  if (typeof globalThis !== 'undefined' && (globalThis as any)[name]) {
    return (globalThis as any)[name];
  }
  
  return undefined;
}