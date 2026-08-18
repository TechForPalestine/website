import { useEffect, useState } from "react";
import MembershipCalculator from "./MembershipCalculator";
import QgivJoin from "./QgivJoin";
import AboutYouStep, { type AboutYouData } from "./AboutYouStep";
import type { MembershipTier, QgivPrefill } from "./qgiv";

interface MembershipDuesProps {
  tier?: MembershipTier;
}

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

/** How long the "Next" button shows its own spinner before the payment step
 * is revealed. Without this floor the swap is instant and the button's
 * loading state never becomes visible — the visitor would see the button
 * vanish and a second, differently-positioned spinner (QgivJoin's) appear in
 * its place instead of one continuous loading experience anchored to their
 * click. Mirrors the MIN_LOADING_DISPLAY_MS floor QgivJoin already uses. */
const NEXT_BUTTON_LOADING_MS = 400;

export default function MembershipDues({ tier = "member" }: MembershipDuesProps) {
  const [step, setStep] = useState<"about-you" | "payment">("about-you");
  const [aboutYou, setAboutYou] = useState<AboutYouData | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [advancingToPayment, setAdvancingToPayment] = useState(false);

  function handleAboutYouContinue(data: AboutYouData) {
    setAboutYou(data);
    setAdvancingToPayment(true);
    window.setTimeout(() => {
      setStep("payment");
      setAdvancingToPayment(false);
    }, NEXT_BUTTON_LOADING_MS);
  }

  function splitName(name: string): { firstName: string; lastName: string } {
    const [firstName, ...rest] = name.trim().split(/\s+/);
    return { firstName: firstName ?? "", lastName: rest.join(" ") };
  }

  const prefill: QgivPrefill | undefined = aboutYou
    ? { ...splitName(aboutYou.name), email: aboutYou.email }
    : undefined;

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

  const calculatorVisible = step === "payment";

  const intro =
    tier === "supporting"
      ? "Contribute any amount for supporting membership dues. We suggest monthly dues equal to one hour's salary, which you can calculate below:"
      : "Contribute any amount for membership dues. We suggest monthly dues equal to one hour's salary, which you can calculate below:";

  return (
    <div>
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
          <div className="mx-auto mt-3 max-w-[700px]">
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
            {step === "payment" && (
              <p className="ts-body-large mb-3 text-ink-secondary">{intro}</p>
            )}
            {calculatorVisible && (
              <div className="mb-4">
                <MembershipCalculator />
              </div>
            )}
            <div
              style={{
                // Only forced on the About You step, so short content there
                // doesn't look collapsed. On the payment step, QgivJoin
                // reserves its own height (only while its embed is loading),
                // so it isn't doubled up here once the real, often-shorter
                // Qgiv form has rendered.
                minHeight: step === "about-you" ? JOIN_PANEL_HEIGHT : undefined,
                display: "grid",
              }}
            >
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
                  onContinue={handleAboutYouContinue}
                  initialValues={aboutYou ?? undefined}
                  flatButton
                  submitting={advancingToPayment}
                />
              </div>
              {aboutYou && (
                <div style={{ display: step === "payment" ? "block" : "none" }}>
                  <QgivJoin tier={tier} prefill={prefill} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
