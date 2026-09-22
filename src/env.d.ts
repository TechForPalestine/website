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
    /** Qgiv's embed.js attaches this global. `initializeEmbeds` re-scans the
     * DOM for `[data-qgiv-embed]` containers and is safe to call repeatedly —
     * it skips any container that already has children. QgivJoin calls it
     * directly when a second QgivJoin mounts after the script has already
     * run (e.g. switching membership tiers in the join flow). */
    QGIV?: {
      Embed?: {
        initializeEmbeds?: () => void;
      };
    };
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

  namespace Cloudflare {
    // Merged into the ambient `Env` type of `import { env } from "cloudflare:workers"`
    // (@astrojs/cloudflare 14 / Astro 7 — `locals.runtime.env` was removed in favor
    // of this import, see https://docs.astro.build/en/guides/upgrade-to/v6/).
    interface Env {
      DROPPED_CONVERSIONS?: KVNamespace;
      [key: string]: string | KVNamespace | undefined;
    }
  }

  namespace App {
    interface Locals {
      cspNonce: string;
      // The Workers ExecutionContext, for locals.cfContext.waitUntil(...).
      // Replaces the removed `locals.runtime.ctx` (Astro 6+).
      cfContext?: {
        waitUntil: (p: Promise<unknown>) => void;
      };
    }
  }
}

export {};
