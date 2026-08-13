/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMeta {
  env: ImportMetaEnv;
}

interface ImportMetaEnv {
  readonly SENTRY_DSN?: string;
  readonly SENTRY_ENVIRONMENT?: string;
  readonly PUBLIC_SENTRY_DSN?: string;
  readonly PUBLIC_SENTRY_ENVIRONMENT?: string;
}

declare global {
  interface Window {
    plausible: (event: string, options?: any) => void;
    /** Sticky flag set immediately before dispatching the
     * "membership:reveal-join" CustomEvent, so a click that fires before the
     * React island hydrates (and registers its listener) isn't lost. Checked
     * on mount by LegacyJoinSection in addition to listening for the event. */
    __membershipRevealJoin?: boolean;
  }
}

declare global {
  interface KVNamespace {
    get(key: string): Promise<string | null>;
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
    list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
      keys: Array<{ name: string }>;
      list_complete: boolean;
      cursor?: string;
    }>;
  }

  namespace App {
    interface Locals {
      cspNonce: string;
      runtime?: {
        env?: Record<string, string> & {
          DROPPED_CONVERSIONS?: KVNamespace;
        };
        ctx?: {
          waitUntil: (p: Promise<unknown>) => void;
        };
      };
    }
  }
}

export {};
