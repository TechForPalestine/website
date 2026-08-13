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
/** Floor on how long the loading overlay stays up: when the script is already
 * cached, Qgiv can populate the container within a few milliseconds, which
 * makes the overlay flash and disappear before a visitor perceives it. */
const MIN_LOADING_DISPLAY_MS = 500;

function prefillKey(prefill?: QgivPrefill): string {
  return prefill ? JSON.stringify([prefill.firstName, prefill.lastName, prefill.email]) : "";
}

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
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const appliedPrefillKeyRef = useRef<string | null>(null);
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
    const mountedAt = Date.now();
    const pendingTimeouts: number[] = [];

    function markLoaded() {
      const remaining = MIN_LOADING_DISPLAY_MS - (Date.now() - mountedAt);
      if (remaining > 0) {
        pendingTimeouts.push(window.setTimeout(() => setEmbedLoaded(true), remaining));
      } else {
        setEmbedLoaded(true);
      }
    }

    // Qgiv inserts an (initially empty) <iframe> into the container well
    // before its cross-origin document finishes loading. Watching for the
    // iframe's own `load` event — not just its insertion — is what actually
    // tracks the payment form becoming visible, not just present in the DOM.
    function checkContainer(): boolean {
      const iframe = container.querySelector("iframe");
      if (iframe) {
        if (iframeRef.current !== iframe) {
          iframeRef.current = iframe;
          appliedPrefillKeyRef.current = prefillKey(prefill);
          iframe.addEventListener("load", markLoaded, { once: true });
        }
        return true;
      }
      if (container.childElementCount > 0) {
        markLoaded();
        return true;
      }
      return false;
    }

    const observer = new MutationObserver(() => {
      if (checkContainer()) observer.disconnect();
    });
    observer.observe(container, { childList: true, subtree: true });

    if (checkContainer()) observer.disconnect();

    pendingTimeouts.push(window.setTimeout(() => setEmbedLoaded(true), EMBED_LOAD_TIMEOUT_MS));

    return () => {
      observer.disconnect();
      pendingTimeouts.forEach((id) => window.clearTimeout(id));
    };
    // Only the initial embed's discovery depends on form.embedId; prefill
    // changes after that are handled by the dedicated reload effect below so
    // this effect doesn't need `prefill` in its dependency array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.embedId]);

  // Qgiv's embed script only reads the container's `data-embed` URL once, when
  // it first builds the iframe. Since QgivJoin stays mounted permanently (see
  // the script-injection comment above), a later prefill change — e.g. the
  // visitor edits their info after already reaching payment once — would
  // otherwise never reach the already-rendered iframe. Reload it directly.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const key = prefillKey(prefill);
    if (appliedPrefillKeyRef.current === key) return;
    appliedPrefillKeyRef.current = key;

    const reloadedAt = Date.now();
    const pendingTimeouts: number[] = [];

    function markLoaded() {
      const remaining = MIN_LOADING_DISPLAY_MS - (Date.now() - reloadedAt);
      if (remaining > 0) {
        pendingTimeouts.push(window.setTimeout(() => setEmbedLoaded(true), remaining));
      } else {
        setEmbedLoaded(true);
      }
    }

    setEmbedLoaded(false);
    iframe.addEventListener("load", markLoaded, { once: true });
    pendingTimeouts.push(window.setTimeout(() => setEmbedLoaded(true), EMBED_LOAD_TIMEOUT_MS));
    iframe.src = qgivEmbedUrl(form, prefill);

    return () => {
      iframe.removeEventListener("load", markLoaded);
      pendingTimeouts.forEach((id) => window.clearTimeout(id));
    };
  }, [prefill, form]);

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
    <div className={className}>
      <div className="relative" style={{ minHeight: 640 }}>
        {!embedLoaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-zinc-50">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#168039]" />
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
