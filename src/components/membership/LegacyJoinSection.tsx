import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import MembershipCalculator from "../MembershipCalculator";
import QgivJoin from "./QgivJoin";
import type { MembershipTier } from "./qgiv";

interface LegacyJoinSectionProps {
  tier: MembershipTier;
  /** Optional section heading. Omitted on the membership pages, which follow
   * the brief's headingless prose structure. */
  heading?: string;
}

const LINK = "text-[#168039] underline";
const MAIL = "mailto:membership@techforpalestine.org";

const WAIVER_REASONS = [
  "Not having access to banking services/debit card",
  "Being located in Gaza or the West Bank",
  "Being a refugee from Gaza or the West Bank evacuated during the genocide",
  "Not being able to afford membership due to personal circumstances",
  "Being a T4P paid staff member",
];

const bodySx = { color: "#374151", lineHeight: 1.75, mb: 1.5 } as const;

/**
 * Payment surface for the legacy (green/grey) design system: the Qgiv embed, the
 * dues calculator A/B test, and the detailed waiver / contact side panel.
 *
 * The design-system equivalent is `MembershipDues.tsx`. The two are kept apart
 * because `Layout.astro` does not load `design-system.css`, so the `ts-*`
 * typography scale the new component relies on is unavailable here.
 */
export default function LegacyJoinSection({ tier, heading }: LegacyJoinSectionProps) {
  const [showCalculator, setShowCalculator] = useState(false);
  const [variant, setVariant] = useState<string | undefined>(undefined);

  const runsCalculatorTest = tier === "member";

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

  const intro =
    tier === "supporting"
      ? "Contribute any amount for supporting membership dues. We suggest monthly dues equal to one hour's salary."
      : showCalculator
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
        sx={{ mb: 3, fontSize: "1.125rem", lineHeight: 1.75, color: "#374151" }}
      >
        {intro}
      </Typography>

      {showCalculator && <MembershipCalculator />}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 340px" },
          gap: 3,
          mt: 3,
          alignItems: "start",
        }}
      >
        <QgivJoin tier={tier} variant={variant} />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box
            sx={{ p: 3, borderRadius: 2, backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}
          >
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: "#111827", mb: 1.5, fontSize: "0.95rem" }}
            >
              Inclusivity &amp; waivers
            </Typography>
            <Typography variant="body2" sx={bodySx}>
              Tech for Palestine aims for inclusivity. Please contact{" "}
              <a href={MAIL} className={LINK}>
                membership@techforpalestine.org
              </a>{" "}
              to request a waiver of dues in the following circumstances:
            </Typography>
            <Box
              component="ul"
              sx={{
                ml: 3,
                pl: 2,
                mb: 2,
                color: "#374151",
                listStyleType: "disc",
                "& li": { mb: 0.5, lineHeight: 1.75, fontSize: "0.875rem" },
              }}
            >
              {WAIVER_REASONS.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </Box>
            <Typography variant="body2" sx={bodySx}>
              If you are in the US, your dues are tax deductible. If you are in the UK, contact us
              at{" "}
              <a href={MAIL} className={LINK}>
                membership@techforpalestine.org
              </a>{" "}
              after signup and we will ensure that future donations are processed through our gift
              aid partner.
            </Typography>
            <Typography variant="body2" sx={{ ...bodySx, mb: 0 }}>
              Options to pay via DAF, cryptocurrency, foundations, and other methods will be
              supported in the future. We will help you migrate to your preferred method of giving
              once available.
            </Typography>
          </Box>

          <Box
            sx={{ p: 3, borderRadius: 2, backgroundColor: "#f0fdf4", border: "1px solid #d1fae5" }}
          >
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: "#111827", mb: 1.5, fontSize: "0.95rem" }}
            >
              Get in touch
            </Typography>
            <Typography variant="body2" sx={{ color: "#374151", lineHeight: 1.75 }}>
              If you have questions, set up an{" "}
              <a
                href="https://calendly.com/d/ctpm-sw2-yvc/t4p-intro-call?month=2026-03"
                className={`font-semibold ${LINK}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                intro call
              </a>{" "}
              or reach out to us at{" "}
              <a href={MAIL} className={`font-semibold ${LINK}`}>
                membership@techforpalestine.org
              </a>
              !
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
