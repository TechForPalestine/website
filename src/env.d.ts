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
    plausible: (event: string, options?: Record<string, unknown>) => void;
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
      /** Qgiv also exposes the completed transaction as a global, which is the
       * fallback when the `donationComplete` CustomEvent carries no detail. */
      transaction?: {
        id?: string;
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

  /** Cloudflare Workers global; absent in Node/dev, so always guard with `typeof`. */
  interface HTMLRewriterInstance {
    on(
      selector: string,
      handlers: { element(el: { setAttribute(name: string, value: string): void }): void }
    ): HTMLRewriterInstance;
    transform(response: Response): Response;
  }
  const HTMLRewriter: new () => HTMLRewriterInstance;

  namespace App {
    interface Locals {
      /** Per-request CSP nonce, set by middleware/csp.ts. */
      cspNonce: string;
      /** Cloudflare runtime; read only through utils/getEnv.ts helpers. */
      runtime?: NonNullable<import("./utils/getEnv").RuntimeLocals["runtime"]>;
    }
  }
}

export {};
