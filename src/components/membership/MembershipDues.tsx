import { useEffect, useState } from "react";
import MembershipCalculator from "./MembershipCalculator";
import QgivJoin from "./QgivJoin";
import type { MembershipTier } from "./qgiv";

interface MembershipDuesProps {
  tier?: MembershipTier;
}

const MAIL = "mailto:membership@techforpalestine.org";
const LINK = "text-brand underline hover:text-brand-hover";

const WAIVER_REASONS = [
  "Not having access to banking services/debit card",
  "Being located in Gaza or the West Bank",
  "Being a refugee from Gaza or the West Bank evacuated during the genocide",
  "Not being able to afford membership due to personal circumstances",
  "Being a T4P paid staff member",
];

export default function MembershipDues({ tier = "member" }: MembershipDuesProps) {
  // Default to the no-calculator variant so this renders identically during
  // SSR (no window/localStorage access) before the A/B assignment runs below.
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
    <div>
      {/* Intro copy — left-aligned with the section heading */}
      <p className="ts-body-large mb-3 max-w-[75ch] text-ink-secondary">{intro}</p>

      {/* Calculator + form — constrained width, left-aligned */}
      <div className="mx-auto max-w-[800px]">
        {showCalculator && <MembershipCalculator />}

        {/* Form + side info */}
        <div className="mt-3 grid grid-cols-1 items-start gap-6 min-[810px]:grid-cols-[1fr_340px]">
          <QgivJoin tier={tier} variant={variant} />

          {/* Side info */}
          <div className="flex flex-col gap-3">
            <div className="rounded-[16px] border border-butter bg-page p-4">
              <p className="ts-body-small mb-2 font-semibold text-ink">Inclusivity &amp; waivers</p>
              <p className="ts-body-small mb-2 leading-relaxed text-ink-secondary">
                Tech for Palestine aims for inclusivity. Please contact{" "}
                <a href={MAIL} className={LINK}>
                  membership@techforpalestine.org
                </a>{" "}
                to request a waiver of dues in the following circumstances:
              </p>
              <ul className="mb-2 space-y-1 pl-3">
                {WAIVER_REASONS.map((item) => (
                  <li
                    key={item}
                    className="ts-body-small flex items-baseline gap-2 text-ink-secondary"
                  >
                    <span
                      className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-brand"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="ts-body-small mb-2 leading-relaxed text-ink-secondary">
                If you are in the US, your dues are tax deductible. If you are in the UK, contact us
                at{" "}
                <a href={MAIL} className={LINK}>
                  membership@techforpalestine.org
                </a>{" "}
                after signup and we will ensure that future donations are processed through our gift
                aid partner.
              </p>
              <p className="ts-body-small leading-relaxed text-ink-secondary">
                Options to pay via DAF, cryptocurrency, foundations, and other methods will be
                supported in the future. We will help you migrate to your preferred method of giving
                once available.
              </p>
            </div>

            <div className="rounded-[16px] border border-butter bg-cream p-4">
              <p className="ts-body-small mb-2 font-semibold text-ink">Get in touch</p>
              <p className="ts-body-small leading-relaxed text-ink-secondary">
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
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
