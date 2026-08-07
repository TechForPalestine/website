import { Box, Typography } from "@mui/material";
import LegacyJoinSection from "./membership/LegacyJoinSection";
import LegacyWaiverNote from "./membership/LegacyWaiverNote";

const bodySx = { mb: 2, fontSize: "1.125rem", lineHeight: 1.75, color: "#374151" } as const;
const proseSx = { ...bodySx, maxWidth: 700 } as const;

export default function MembershipPage() {
  return (
    <Box sx={{ maxWidth: 960, mx: "auto" }}>
      {/* Supporting Member fork */}
      <Box
        sx={{
          mb: 5,
          p: 3,
          borderRadius: 2,
          backgroundColor: "#f0fdf4",
          border: "2px solid #168039",
        }}
      >
        <Typography variant="body1" sx={{ fontWeight: 700, color: "#111827", mb: 1 }}>
          Don&apos;t have time to contribute directly?
        </Typography>
        <a href="/supporting-member" className="font-semibold text-[#168039] underline">
          Become a Supporting Member &rarr;
        </a>
      </Box>

      <Typography variant="body1" sx={proseSx}>
        Members and Supporting Members also support T4P financially. Membership dues allow T4P to
        support our teams, and provide grants and services to projects in the Incubator through
        full-time dedicated staff. Dues are pay-what-you-can, and we suggest a monthly amount equal
        to 1 hour of income (1/2000th of your annual income).
      </Typography>
      <Typography variant="body1" sx={{ ...proseSx, mb: 4 }}>
        Whether you&apos;re a thinker, builder, leader, software developer, marketer, or activist,
        there&apos;s a place for you to contribute in your own way.
      </Typography>

      {/* CTAs */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 4 }}>
        <a
          href="#join"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#168039] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#116b2f]"
        >
          Become a member
        </a>
        <a
          href="/supporting-member"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-zinc-900 px-6 py-3 font-semibold text-zinc-900 transition-colors hover:bg-zinc-100"
        >
          Become a Supporting Member
        </a>
      </Box>

      <LegacyWaiverNote className="mb-12 max-w-[700px]" />

      <LegacyJoinSection tier="member" />
    </Box>
  );
}
