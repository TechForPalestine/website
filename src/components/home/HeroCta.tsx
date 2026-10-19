import { useEffect, useRef } from "react";
import { useFeature } from "@growthbook/growthbook-react";
import GrowthBookProvider from "../shared/GrowthBookProvider";
import {
  CTA_CLICK_EVENT,
  CTA_DEFAULT_TEXT,
  CTA_FEATURE_KEY,
  EXPOSURE_EVENT,
  trackExperimentEvent,
} from "../../utils/ctaExperiment";

interface Props {
  className: string;
}

function CtaLink({ className }: Props) {
  const feature = useFeature<string>(CTA_FEATURE_KEY);
  const text = feature.value ?? CTA_DEFAULT_TEXT;
  // The test is a 50% rollout rule plus a catch-all "force" control rule (GrowthBook's
  // API can't create inline experiments without a datasource), so there is no
  // experimentResult. source === "force" means a rule bucketed this visitor; a disabled
  // flag or a failed fetch reports "defaultValue"/"unknownFeature" and is not tracked.
  const variant =
    feature.source === "force" ? (text === CTA_DEFAULT_TEXT ? "control" : "treatment") : null;
  const hasTrackedExposure = useRef(false);
  const hasTrackedClick = useRef(false);

  // Fires once per page view, only after the assigned variant is on screen.
  useEffect(() => {
    if (variant === null || hasTrackedExposure.current) return;
    hasTrackedExposure.current = true;
    trackExperimentEvent(EXPOSURE_EVENT, CTA_FEATURE_KEY, variant);
  }, [variant]);

  const handleClick = () => {
    if (variant === null || hasTrackedClick.current) return;
    hasTrackedClick.current = true;
    trackExperimentEvent(CTA_CLICK_EVENT, CTA_FEATURE_KEY, variant);
  };

  return (
    <a href="/incubator" className={className} onClick={handleClick}>
      {text}
    </a>
  );
}

// Hero CTA for the homepage text experiment. Rendered with client:only, so the static
// control link in index.astro (slot="fallback") shows until this hydrates.
export default function HeroCta({ className }: Props) {
  return (
    <GrowthBookProvider>
      <CtaLink className={className} />
    </GrowthBookProvider>
  );
}
