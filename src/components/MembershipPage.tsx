import { Box, Typography } from "@mui/material";
import LegacyJoinSection from "./membership/LegacyJoinSection";
import LegacyWaiverNote from "./membership/LegacyWaiverNote";

const bodySx = { mb: 2, fontSize: "1.125rem", lineHeight: 1.75, color: "#3F4A43" } as const;
const proseSx = { ...bodySx, maxWidth: 700 } as const;

/** The signature tri-color hairline, inlined here since this island can't
 * import the shared `TriMark.astro` component. Keep in sync with
 * `src/components/membership/TriMark.astro`. */
function TriMark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`} aria-hidden="true">
      <span className="h-[3px] w-4 rounded-full bg-[#168039]" />
      <span className="h-[3px] w-4 rounded-full bg-[#1B2420]" />
      <span className="h-[3px] w-4 rounded-full bg-[#B3272D]" />
    </div>
  );
}

export default function MembershipPage() {
  return (
    <Box sx={{ maxWidth: 960, mx: "auto" }}>
      {/* Supporting Member fork */}
      <Box
        sx={{
          mb: 5,
          p: 3,
          borderRadius: "10px",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E4DFD3",
          borderLeft: "3px solid #168039",
        }}
      >
        <Typography
          variant="body1"
          sx={{
            fontFamily: "'Fraunces', 'Fraunces Placeholder', serif",
            fontWeight: 600,
            fontSize: "1.15rem",
            color: "#1B2420",
            mb: 1,
          }}
        >
          Don&apos;t have time to contribute directly?
        </Typography>
        <a href="/supporting-member" className="font-semibold text-[#168039] underline">
          Become a Supporting Member &rarr;
        </a>
      </Box>

      <TriMark className="mb-5" />

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
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#168039] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#116b2f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168039]"
        >
          Become a member
        </a>
        <a
          href="/supporting-member"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#1B2420] px-6 py-3 font-semibold text-[#1B2420] transition-colors hover:bg-[#1B2420] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B2420]"
        >
          Become a Supporting Member
        </a>
      </Box>

      <LegacyWaiverNote className="mb-12 max-w-[700px]" />

      <LegacyJoinSection tier="member" />
    </Box>
  );
}
