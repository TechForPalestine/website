import { useEffect, useRef, useState } from "react";
import MembershipCalculator from "./MembershipCalculator";

function QgivEmbed() {
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    const script = document.createElement("script");
    script.src = "https://secure.qgiv.com/resources/core/js/embed.js";
    script.id = "qgiv-embedjs";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="max-h-[640px] overflow-hidden">
      <div
        className="qgiv-embed-container"
        data-qgiv-embed="true"
        data-embed-id="88902"
        data-embed="https://secure.qgiv.com/for/dafize/embed/88902/"
        data-width="630"
      />
    </div>
  );
}

export default function MembershipDues() {
  // Default to the no-calculator variant so this renders identically during
  // SSR (no window/localStorage access) before the A/B assignment runs below.
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
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

    setShowCalculator(assigned);

    if (typeof window.plausible !== "undefined") {
      window.plausible("Membership Page", {
        props: {
          membership_variant: assigned ? "Calculator" : "No Calculator",
        },
      });
    }
  }, []);

  return (
    <div>
      {/* Intro copy — left-aligned with the section heading */}
      <p className="ts-body-large mb-3 max-w-[75ch] text-ink-secondary">
        {showCalculator
          ? "Contribute any amount for membership dues. We suggest monthly dues equal to one hour's salary, which you can calculate below:"
          : "Contribute any amount for membership dues. We suggest monthly dues equal to one hour's salary."}
      </p>

      {/* Calculator + form — constrained width, left-aligned */}
      <div className="mx-auto max-w-[800px]">
        {showCalculator && <MembershipCalculator />}

        {/* Form + side info */}
        <div className="mt-3 grid grid-cols-1 items-start gap-6 min-[810px]:grid-cols-[1fr_340px]">
          <QgivEmbed />

          {/* Side info */}
          <div className="flex flex-col gap-3">
            <div className="rounded-[16px] border border-butter bg-page p-4">
              <p className="ts-body-small mb-2 font-semibold text-ink">Inclusivity &amp; waivers</p>
              <p className="ts-body-small mb-2 leading-relaxed text-ink-secondary">
                Tech for Palestine aims for inclusivity. Please contact{" "}
                <a
                  href="mailto:membership@techforpalestine.org"
                  className="text-brand underline hover:text-brand-hover"
                >
                  membership@techforpalestine.org
                </a>{" "}
                to request a waiver of dues in the following circumstances:
              </p>
              <ul className="mb-2 space-y-1 pl-3">
                {[
                  "Not having access to banking services/debit card",
                  "Being located in Gaza or the West Bank",
                  "Being a refugee from Gaza or the West Bank evacuated during the genocide",
                  "Not being able to afford membership due to personal circumstances",
                  "Being a T4P paid staff member",
                ].map((item) => (
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
                <a
                  href="mailto:membership@techforpalestine.org"
                  className="text-brand underline hover:text-brand-hover"
                >
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
                  className="font-semibold text-brand underline hover:text-brand-hover"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  intro call
                </a>{" "}
                or reach out to us at{" "}
                <a
                  href="mailto:membership@techforpalestine.org"
                  className="font-semibold text-brand underline hover:text-brand-hover"
                >
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
