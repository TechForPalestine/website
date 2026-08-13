import { useEffect, useState } from "react";
import MembershipCalculator from "./MembershipCalculator";
import QgivJoin from "./QgivJoin";
import AboutYouStep, { type AboutYouData } from "./AboutYouStep";
import type { MembershipTier, QgivPrefill } from "./qgiv";

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

/** Hides the "Become a member" CTA anchors once the join form is revealed —
 * clicking them again is pointless once the form is already showing. These
 * anchors live outside this component's tree (siblings in the enclosing
 * page), so a DOM query is the simplest way to reach all of them uniformly.
 * The reveal is one-directional (there is no "un-reveal" path), so there is
 * no corresponding un-hide routine. */
function hideJoinCtas(): void {
  document.querySelectorAll<HTMLElement>("[data-membership-cta]").forEach((el) => {
    el.style.display = "none";
  });
}

/** Shared minimum height for the About You / payment panel, matching QgivJoin's
 * own minimum, so short content (the loading spinner, the About You form)
 * doesn't look collapsed. The panel is allowed to grow taller than this when
 * the Qgiv payment form needs more room, rather than clipping it. */
const JOIN_PANEL_HEIGHT = 640;

export default function MembershipDues({ tier = "member" }: MembershipDuesProps) {
  // Default to the no-calculator variant so this renders identically during
  // SSR (no window/localStorage access) before the A/B assignment runs below.
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
    // island hydrates and registers its listener (e.g. plain <a> CTAs tracked
    // by a vanilla <script> that runs at parse time). The dispatcher also
    // sets a sticky window flag first, so a click that arrives before
    // hydration isn't lost — check it on mount here. Also honor a direct
    // "#join" deep link, since the form is hidden until revealed and the
    // browser would otherwise scroll to an empty section.
    if (window.__membershipRevealJoin || window.location.hash === "#join") {
      setRevealed(true);
      hideJoinCtas();
    }

    function handleReveal() {
      setRevealed(true);
      hideJoinCtas();
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
    <div>
      {/* Intro copy — left-aligned with the section heading */}
      <p className="ts-body-large mb-3 max-w-[75ch] text-ink-secondary">{intro}</p>

      <div
        style={{
          display: "grid",
          gridTemplateRows: revealed ? "1fr" : "0fr",
          opacity: revealed ? 1 : 0,
          transition: "grid-template-rows 350ms ease, opacity 350ms ease",
        }}
      >
        <div style={{ overflow: "hidden", minHeight: 0 }}>
          {/* Calculator + form — constrained width, centered */}
          <div className="mx-auto max-w-[800px]">
            <div className="mt-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="ts-body-small font-bold uppercase tracking-wide text-brand">
                  {step === "about-you" ? "Step 1/2 — About You" : "Step 2/2 — Payment"}
                </p>
                {step === "payment" && (
                  <button
                    type="button"
                    onClick={() => setStep("about-you")}
                    className="ts-body-small font-semibold text-ink-secondary hover:text-ink"
                  >
                    &larr; Edit your info
                  </button>
                )}
              </div>
              {showCalculator && step === "payment" && (
                <div className="mb-4">
                  <MembershipCalculator />
                </div>
              )}
              <div style={{ minHeight: JOIN_PANEL_HEIGHT, display: "grid" }}>
                {/* QgivJoin stays mounted (hidden via CSS, never unmounted) once
                    the visitor first reaches payment. Unmounting it (e.g. via
                    "Edit your info" then back) re-runs its script-injection
                    effect, which re-adds Qgiv's embed.js tag; the script
                    throws on the redeclaration and the embed breaks. Toggling
                    visibility keeps the script's one-time init intact. */}
                <div
                  style={{
                    display: step === "about-you" ? "flex" : "none",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AboutYouStep
                    onContinue={(data) => {
                      setAboutYou(data);
                      setStep("payment");
                    }}
                    initialValues={aboutYou ?? undefined}
                    flatButton
                  />
                </div>
                {aboutYou && (
                  <div style={{ display: step === "payment" ? "block" : "none" }}>
                    <QgivJoin tier={tier} variant={variant} prefill={prefill} />
                  </div>
                )}
              </div>

              {/* Inclusivity & waivers */}
              <div className="mt-6 rounded-[16px] border border-butter bg-page p-4">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
