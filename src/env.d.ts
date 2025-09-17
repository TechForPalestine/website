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

export {};
