import { GrowthBook, configureCache } from "@growthbook/growthbook-react";

const clientKey = import.meta.env.PUBLIC_GROWTHBOOK_CLIENT_KEY;

if (!clientKey) {
  // Fail loudly. A missing key makes every flag return its default instead,
  // which looks like working code that simply never turns anything on.
  throw new Error(
    "Missing PUBLIC_GROWTHBOOK_CLIENT_KEY — GrowthBook flags will not load without it."
  );
}

// Consent-free by design: nothing is written to cookies or storage. The SDK would
// otherwise cache the feature payload in localStorage, so switch that off.
configureCache({ disableCache: true });

export const growthbook = new GrowthBook({
  apiHost: "https://cdn.growthbook.io",
  clientKey,
  enableDevMode: import.meta.env.DEV,
  // A fresh random id per page load, held in memory only. Visitors are re-bucketed on
  // every page view, so an experiment can only measure same-page-view outcomes.
  attributes: { id: crypto.randomUUID() },
});

// streaming: false — fetch the payload once on load. Flag changes then land on the
// next page load. Streaming holds an SSE connection open per client; opt in only
// if you want live updates.
export const ready = growthbook.init({ streaming: false });
