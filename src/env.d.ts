/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare global {
  interface Window {
    plausible: (event: string, options?: any) => void;
  }
}

export {};
