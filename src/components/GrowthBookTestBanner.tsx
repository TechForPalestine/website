import { useFeatureIsOn } from "@growthbook/growthbook-react";
import GrowthBookProvider from "./GrowthBookProvider";

// Throwaway banner to confirm the GrowthBook SDK is wired end to end.
// Safe to delete once the connection shows as Connected in the dashboard.
function Banner() {
  const enabled = useFeatureIsOn("growthbook-test");
  return (
    <div style={{ padding: "1rem", fontFamily: "monospace" }}>
      growthbook-test flag is {enabled ? "ON" : "OFF"}
    </div>
  );
}

export default function GrowthBookTestBanner() {
  return (
    <GrowthBookProvider>
      <Banner />
    </GrowthBookProvider>
  );
}
