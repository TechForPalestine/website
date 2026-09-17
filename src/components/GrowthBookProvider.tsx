import { GrowthBookProvider as GBProvider } from "@growthbook/growthbook-react";
import type { ReactNode } from "react";
import { growthbook } from "../growthbook";

interface Props {
  children: ReactNode;
}

// Wrap a client:only="react" island in this to read GrowthBook flags with
// useFeatureIsOn / useFeatureValue. Each island mounts its own React root, so
// there's no single app entry point to wrap once — use this per island instead.
export default function GrowthBookProvider({ children }: Props) {
  return <GBProvider growthbook={growthbook}>{children}</GBProvider>;
}
