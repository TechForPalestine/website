interface LegacyWaiverNoteProps {
  className?: string;
}

const REASONS = [
  "Being located in, or a refugee from Gaza or the West Bank",
  "Not being able to afford membership due to personal circumstances",
];

/**
 * Short inclusivity / waiver statement shown beneath the membership CTAs on the
 * legacy-design pages. The fuller version sits beside the payment form in
 * `LegacyJoinSection`.
 *
 * Plain Tailwind rather than MUI so it can render statically (no client
 * directive) when used directly from an `.astro` page.
 */
export default function LegacyWaiverNote({ className = "" }: LegacyWaiverNoteProps) {
  return (
    <div className={`text-sm leading-relaxed text-zinc-500 ${className}`}>
      <p>
        Tech for Palestine aims for inclusivity. Please contact{" "}
        <a href="mailto:membership@techforpalestine.org" className="text-[#168039] underline">
          membership@techforpalestine.org
        </a>{" "}
        to request a waiver of dues in the following circumstances:
      </p>
      <ul className="my-2 ml-6 list-disc space-y-0.5">
        {REASONS.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <p>If you are in the US, your dues are tax deductible.</p>
    </div>
  );
}
