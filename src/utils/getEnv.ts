/**
 * The only file that reads `locals.runtime`. Astro 6's Cloudflare adapter
 * removes `locals.runtime`, so keeping every access behind these helpers means
 * the migration touches one file.
 */
export interface RuntimeLocals {
  runtime?: {
    env?: Record<string, string | undefined> & {
      DROPPED_CONVERSIONS?: KVNamespace;
    };
    ctx?: {
      waitUntil: (p: Promise<unknown>) => void;
    };
    /** Cloudflare's CacheStorage; `default` is the Workers-only shared cache. */
    caches?: CacheStorage;
  };
}

function asRuntimeLocals(locals: unknown): RuntimeLocals | undefined {
  return locals && typeof locals === "object" ? (locals as RuntimeLocals) : undefined;
}

/** Cloudflare execution context (`waitUntil`), or undefined outside Workers. */
export function getRuntimeCtx(locals: unknown): NonNullable<RuntimeLocals["runtime"]>["ctx"] {
  return asRuntimeLocals(locals)?.runtime?.ctx;
}

/** The DROPPED_CONVERSIONS KV namespace, or undefined when not bound. */
export function getKv(locals: unknown): KVNamespace | undefined {
  return asRuntimeLocals(locals)?.runtime?.env?.DROPPED_CONVERSIONS;
}

// Helper function to get environment variables with proper fallbacks
export function getEnv(name: string, locals?: unknown): string | undefined {
  // Try Cloudflare Pages runtime context first (for production)
  const runtimeValue = asRuntimeLocals(locals)?.runtime?.env?.[name];
  if (runtimeValue) {
    return runtimeValue;
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
