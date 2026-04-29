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
  namespace App {
    interface Locals {
      cspNonce: string;
      runtime?: {
        env?: Record<string, string>;
      };
    }
  }
}

export {};
