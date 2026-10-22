import { GrowthBook, setPolyfills } from "@growthbook/growthbook-react";

const clientKey = import.meta.env.PUBLIC_GROWTHBOOK_CLIENT_KEY;

if (!clientKey) {
  // Fail loudly. A missing key makes every flag return its default instead,
  // which looks like working code that simply never turns anything on.
  throw new Error(
    "Missing PUBLIC_GROWTHBOOK_CLIENT_KEY — GrowthBook flags will not load without it."
  );
}

// Keep the homepage free of browser storage. The SDK persists its flag payload to
// localStorage on every fetch, and configureCache({ disableCache }) does not stop that
// write, so swap in a no-op storage. The payload is then refetched on every page load.
setPolyfills({ localStorage: { getItem: () => null, setItem: () => {} } });

export const growthbook = new GrowthBook({
  apiHost: "https://cdn.growthbook.io",
  clientKey,
  enableDevMode: true,
});

// streaming: false — fetch the payload once on load. Flag changes then land on the
// next page load. Streaming holds an SSE connection open per client; opt in only
// if you want live updates.
export const ready = growthbook.init({ streaming: false });
