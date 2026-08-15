interface LegacyWaiverNoteProps {
  className?: string;
}

const REASONS = [
  "Being located in, or a refugee from Gaza or the West Bank",
  "Not being able to afford membership due to personal circumstances",
];

const LINK =
  "text-[#168039] underline decoration-1 underline-offset-2 transition-colors hover:text-[#116b2f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#168039] focus-visible:ring-offset-2 focus-visible:rounded-sm";

/**
 * Inclusivity / waiver statement plus "Get in touch" contact info, shown
 * beneath the membership CTAs on the legacy-design pages.
 *
 * Plain Tailwind rather than MUI so it can render statically (no client
 * directive) when used directly from an `.astro` page.
 */
export default function LegacyWaiverNote({ className = "" }: LegacyWaiverNoteProps) {
  return (
    <div
      className={`border-l-2 border-zinc-200 pl-4 text-sm leading-relaxed text-zinc-500 ${className}`}
    >
      <p>
        Tech for Palestine aims for inclusivity. Please contact{" "}
        <a href="mailto:membership@techforpalestine.org" className={LINK}>
          membership@techforpalestine.org
        </a>{" "}
        to request a waiver of dues in the following circumstances:
      </p>
      <ul className="my-3 ml-6 list-disc space-y-1">
        {REASONS.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <p>If you are in the US, your dues are tax deductible.</p>
      <p className="mt-3">
        Have questions? Set up an{" "}
        <a
          href="https://calendly.com/d/ctpm-sw2-yvc/t4p-intro-call?month=2026-03"
          className={`font-semibold ${LINK}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          intro call
        </a>{" "}
        or reach out to us at{" "}
        <a href="mailto:membership@techforpalestine.org" className={`font-semibold ${LINK}`}>
          membership@techforpalestine.org
        </a>
        !
      </p>
    </div>
  );
}
