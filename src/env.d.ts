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
