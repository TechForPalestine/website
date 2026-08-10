import { Box, Typography } from "@mui/material";
import LegacyJoinSection from "./membership/LegacyJoinSection";
import LegacyWaiverNote from "./membership/LegacyWaiverNote";

const bodySx = { mb: 2, fontSize: "1.125rem", lineHeight: 1.75, color: "#374151" } as const;
const proseSx = { ...bodySx, maxWidth: 700 } as const;

function trackJoinClick(ctaLocation: string, destination: string): void {
  if (typeof window.plausible !== "undefined") {
    window.plausible("Membership Join Click", {
      props: { cta_location: ctaLocation, destination },
    });
  }
}

export default function MembershipPage() {
  return (
    <Box sx={{ maxWidth: 960, mx: "auto" }}>
      {/* Supporting Member fork */}
      <Box
        sx={{
          mb: 5,
          p: { xs: 3, sm: 3.5 },
          borderRadius: 3,
          backgroundColor: "#f0fdf4",
          border: "2px solid #168039",
          transition: "box-shadow 150ms ease, transform 150ms ease",
          "&:hover": {
            boxShadow: "0 8px 20px -8px rgba(17, 107, 47, 0.35)",
          },
        }}
      >
        <Typography variant="body1" sx={{ fontWeight: 700, color: "#111827", mb: 1 }}>
          Don&apos;t have time to contribute directly?
        </Typography>
        <a
          href="/supporting-member"
          onClick={() => trackJoinClick("fork_card", "/supporting-member")}
          className="inline-flex items-center gap-1.5 font-semibold text-[#168039] underline decoration-1 underline-offset-2 transition-colors hover:text-[#116b2f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#168039] focus-visible:ring-offset-2 focus-visible:rounded-sm"
        >
          Become a Supporting Member <span aria-hidden="true">&rarr;</span>
        </a>
      </Box>

      <Typography variant="body1" sx={proseSx}>
        Members and Supporting Members also support T4P financially. Membership dues allow T4P to
        support our teams, and provide grants and services to projects in the Incubator through
        full-time dedicated staff. Dues are pay-what-you-can, and we suggest a monthly amount equal
        to 1 hour of income (1/2000th of your annual income).
      </Typography>
      <Typography variant="body1" sx={{ ...proseSx, mb: 5 }}>
        Whether you&apos;re a thinker, builder, leader, software developer, marketer, or activist,
        there&apos;s a place for you to contribute in your own way.
      </Typography>

      {/* CTAs */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 5 }}>
        <a
          href="#join"
          onClick={() => trackJoinClick("primary_cta", "#join")}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#168039] px-6 py-3 font-semibold text-white shadow-sm transition-all duration-150 hover:bg-[#116b2f] hover:shadow-md active:bg-[#116b2f] active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#168039] focus-visible:ring-offset-2"
        >
          Become a member
        </a>
        <a
          href="/supporting-member"
          onClick={() => trackJoinClick("secondary_cta", "/supporting-member")}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-zinc-900 px-6 py-3 font-semibold text-zinc-900 transition-all duration-150 hover:border-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
        >
          Become a Supporting Member
        </a>
      </Box>

      <LegacyWaiverNote className="mb-12 max-w-[700px]" />

      <LegacyJoinSection tier="member" />
    </Box>
  );
}
