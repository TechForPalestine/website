/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMeta {
  env: ImportMetaEnv;
}

interface ImportMetaEnv {}

declare global {
  interface Window {
    plausible: (event: string, options?: any) => void;
  }
}

declare namespace App {
  interface Locals {
    cspNonce: string;
    runtime?: {
      env?: Record<string, string>;
    };
  }
}

export {};
