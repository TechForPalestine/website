/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {}

declare global {
  interface Window {
    plausible: (event: string, options?: any) => void;
  }
}

export {};
