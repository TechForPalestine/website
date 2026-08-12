import { useEffect, useRef, useState } from "react";
import {
  QGIV_EMBED_SCRIPT,
  QGIV_FORMS,
  qgivEmbedUrl,
  type MembershipTier,
  type QgivPrefill,
} from "./qgiv";

const QGIV_EMBED_SCRIPT_ID = "qgiv-embedjs";
/** Fail-open cap on the loading overlay: hide it even if we never observe
 * Qgiv populate the container, so a detection miss doesn't block the embed. */
const EMBED_LOAD_TIMEOUT_MS = 8000;

interface QgivJoinProps {
  tier: MembershipTier;
  /**
   * Plausible prop recording which membership-page A/B variant the visitor saw.
   * Only meaningful for the `member` tier.
   */
  variant?: string;
  className?: string;
  prefill?: QgivPrefill;
}

interface QgivTransactionDetail {
  QGIV?: {
    transaction?: { total?: number | string };
    contact?: { email?: string; firstName?: string; lastName?: string };
  };
}

/**
 * Embeds the Qgiv payment form for a membership tier and reports completions.
 *
 * Qgiv fires a `QGIV.donationComplete` DOM event when a transaction succeeds.
 * That event is the only signal the site gets, so this component owns both the
 * embed and the listener — keeping them apart is what caused /membership-new to
 * silently stop sending Hub invites and EmailOctopus tags.
 */
export default function QgivJoin({ tier, variant, className, prefill }: QgivJoinProps) {
  const form = QGIV_FORMS[tier];
  const scriptLoadedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [embedLoaded, setEmbedLoaded] = useState(false);

  useEffect(() => {
    if (!form.embedId || scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    // Guard against a duplicate <script> tag: Qgiv's embed.js declares
    // top-level identifiers that throw a SyntaxError on redeclaration if the
    // script is injected twice (e.g. this component briefly remounting).
    if (document.getElementById(QGIV_EMBED_SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.src = QGIV_EMBED_SCRIPT;
    script.id = QGIV_EMBED_SCRIPT_ID;
    script.async = true;
    document.body.appendChild(script);
  }, [form.embedId]);

  useEffect(() => {
    if (!form.embedId || !containerRef.current) return;

    const container = containerRef.current;
    if (container.childElementCount > 0) {
      setEmbedLoaded(true);
      return;
    }

    const observer = new MutationObserver(() => {
      if (container.childElementCount > 0) {
        setEmbedLoaded(true);
        observer.disconnect();
      }
    });
    observer.observe(container, { childList: true, subtree: true });

    const timeout = window.setTimeout(() => setEmbedLoaded(true), EMBED_LOAD_TIMEOUT_MS);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, [form.embedId]);

  useEffect(() => {
    function handleDonationComplete(event: Event) {
      const detail = ((event as CustomEvent).detail ?? {}) as QgivTransactionDetail;
      const transaction = detail.QGIV?.transaction ?? {};
      const contact = detail.QGIV?.contact ?? {};

      if (typeof window.plausible !== "undefined") {
        window.plausible("Membership-complete", {
          props: {
            amount: transaction.total != null ? String(transaction.total) : "",
            membership_tier: tier,
            ...(variant ? { membership_variant: variant } : {}),
          },
        });
      }

      const email = contact.email ?? "";
      if (!email) return;

      fetch("/api/membership-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName: contact.firstName ?? "",
          lastName: contact.lastName ?? "",
          tier,
        }),
      }).catch(() => {});
    }

    document.addEventListener("QGIV.donationComplete", handleDonationComplete);
    return () => document.removeEventListener("QGIV.donationComplete", handleDonationComplete);
  }, [tier, variant]);

  // Safety net for a tier whose embed ID has been cleared: link out to the
  // hosted form so the page still converts, at the cost of losing completion
  // tracking (and therefore EmailOctopus tagging) for that tier.
  if (!form.embedId) {
    return (
      <div className={className}>
        <a
          href={form.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center rounded-pill bg-brand px-5 py-3.5 font-medium text-white transition-colors hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Open the secure payment form
        </a>
      </div>
    );
  }

  return (
    <div className={className ?? "max-h-[640px] overflow-hidden"}>
      <div className="relative min-h-[400px]">
        {!embedLoaded && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-50">
            <span className="text-sm text-zinc-500">Loading secure payment form&hellip;</span>
          </div>
        )}
        <div
          ref={containerRef}
          className="qgiv-embed-container"
          data-qgiv-embed="true"
          data-embed-id={form.embedId}
          data-embed={qgivEmbedUrl(form, prefill)}
          data-width="630"
        />
      </div>
    </div>
  );
}
