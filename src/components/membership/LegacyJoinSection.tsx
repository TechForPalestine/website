import { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import MembershipCalculator from "../MembershipCalculator";
import QgivJoin from "./QgivJoin";
import AboutYouStep, { type AboutYouData } from "./AboutYouStep";
import type { MembershipTier, QgivPrefill } from "./qgiv";

interface LegacyJoinSectionProps {
  tier: MembershipTier;
  /** Optional section heading. Omitted on the membership pages, which follow
   * the brief's headingless prose structure. */
  heading?: string;
}

/** Shared fixed height for the About You / payment panel, matching QgivJoin's
 * own max-height cap, so switching between the two never resizes the panel. */
const JOIN_PANEL_HEIGHT = 640;

/**
 * Payment surface for the legacy (green/grey) design system: the Qgiv embed
 * and the dues calculator A/B test.
 *
 * The design-system equivalent is `MembershipDues.tsx`. The two are kept apart
 * because `Layout.astro` does not load `design-system.css`, so the `ts-*`
 * typography scale the new component relies on is unavailable here.
 */
export default function LegacyJoinSection({ tier, heading }: LegacyJoinSectionProps) {
  const [showCalculator, setShowCalculator] = useState(false);
  const [variant, setVariant] = useState<string | undefined>(undefined);
  const [step, setStep] = useState<"about-you" | "payment">("about-you");
  const [aboutYou, setAboutYou] = useState<AboutYouData | null>(null);
  const [revealed, setRevealed] = useState(false);

  const runsCalculatorTest = tier === "member";

  function splitName(name: string): { firstName: string; lastName: string } {
    const [firstName, ...rest] = name.trim().split(/\s+/);
    return { firstName: firstName ?? "", lastName: rest.join(" ") };
  }

  const prefill: QgivPrefill | undefined = aboutYou
    ? { ...splitName(aboutYou.name), email: aboutYou.email }
    : undefined;

  useEffect(() => {
    if (!runsCalculatorTest) return;

    const urlParams = new URLSearchParams(window.location.search);
    const urlParam = urlParams.get("calculator");

    let assigned: boolean;
    if (urlParam === "yes") {
      assigned = true;
    } else if (urlParam === "no") {
      assigned = false;
    } else {
      const stored = localStorage.getItem("membership_ab_variant");
      if (stored === "Calculator") {
        assigned = true;
      } else if (stored === "No Calculator") {
        assigned = false;
      } else {
        assigned = Math.random() < 0.5;
        localStorage.setItem("membership_ab_variant", assigned ? "Calculator" : "No Calculator");
      }
    }

    const assignedVariant = assigned ? "Calculator" : "No Calculator";
    setShowCalculator(assigned);
    setVariant(assignedVariant);

    if (typeof window.plausible !== "undefined") {
      window.plausible("Membership Page", {
        props: { membership_variant: assignedVariant },
      });
    }
  }, [runsCalculatorTest]);

  useEffect(() => {
    // The CTA that dispatches "membership:reveal-join" may fire before this
    // island hydrates and registers its listener (e.g. the plain <a> CTAs on
    // /supporting-member, tracked by a vanilla <script> that runs at parse
    // time). The dispatcher also sets a sticky window flag first, so a click
    // that arrives before hydration isn't lost — check it on mount here.
    // Also honor a direct "#join" deep link, since the form is hidden until
    // revealed and the browser would otherwise scroll to an empty section.
    if (window.__membershipRevealJoin || window.location.hash === "#join") {
      setRevealed(true);
    }

    function handleReveal() {
      setRevealed(true);
    }
    window.addEventListener("membership:reveal-join", handleReveal);
    return () => window.removeEventListener("membership:reveal-join", handleReveal);
  }, []);

  const intro =
    tier === "supporting"
      ? "Contribute any amount for supporting membership dues. We suggest monthly dues equal to one hour's salary."
      : showCalculator && step === "payment"
        ? "Contribute any amount for membership dues. We suggest monthly dues equal to one hour's salary, which you can calculate below:"
        : "Contribute any amount for membership dues. We suggest monthly dues equal to one hour's salary.";

  return (
    <Box id="join" sx={{ scrollMarginTop: "80px" }}>
      {heading && (
        <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 700, color: "#111827" }}>
          {heading}
        </Typography>
      )}
      <Typography
        variant="body1"
        sx={{ mb: 3, fontSize: "1.125rem", lineHeight: 1.75, color: "#374151", maxWidth: 700 }}
      >
        {intro}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateRows: revealed ? "1fr" : "0fr",
          opacity: revealed ? 1 : 0,
          transition: "grid-template-rows 350ms ease, opacity 350ms ease",
        }}
      >
        <Box sx={{ overflow: "hidden", minHeight: 0 }}>
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
              <Typography variant="overline" sx={{ color: "#168039", fontWeight: 700, letterSpacing: 1 }}>
                {step === "about-you" ? "Step 1/2 — About You" : "Step 2/2 — Payment"}
              </Typography>
              {step === "payment" && (
                <Button
                  onClick={() => setStep("about-you")}
                  sx={{ textTransform: "none", color: "#374151", fontWeight: 600 }}
                >
                  &larr; Edit your info
                </Button>
              )}
            </Box>
            {showCalculator && step === "payment" && (
              <Box sx={{ mb: 2 }}>
                <MembershipCalculator />
              </Box>
            )}
            <Box sx={{ height: JOIN_PANEL_HEIGHT, overflow: "hidden" }}>
              {/* QgivJoin stays mounted (hidden via CSS, never unmounted) once the
                  visitor first reaches payment. Unmounting it (e.g. via "Edit your
                  info" then back) re-runs its script-injection effect, which
                  re-adds Qgiv's embed.js tag; the script throws on the
                  redeclaration and the embed breaks. Toggling visibility keeps
                  the script's one-time init intact. */}
              <Box
                sx={{
                  display: step === "about-you" ? "flex" : "none",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <AboutYouStep
                  onContinue={(data) => {
                    setAboutYou(data);
                    setStep("payment");
                  }}
                  initialValues={aboutYou ?? undefined}
                />
              </Box>
              {aboutYou && (
                <Box sx={{ display: step === "payment" ? "block" : "none" }}>
                  <QgivJoin tier={tier} variant={variant} prefill={prefill} />
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
