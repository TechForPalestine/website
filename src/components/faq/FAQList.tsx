import React, { useCallback, useEffect, useState } from "react";
import FAQAccordion from "./FAQAccordion";
import type { RichTextSegment } from "../../types/richText";

interface FAQItem {
  id: string;
  question: string;
  answer: string | RichTextSegment[];
}

interface FAQListProps {
  faqs: FAQItem[];
  loading?: boolean;
}

type LoadStatus = "loading" | "ready" | "error";

// Varied widths so the placeholder reads as questions of different lengths
// rather than a uniform stack of bars.
const SKELETON_WIDTHS = ["w-4/5", "w-3/5", "w-11/12", "w-2/3", "w-3/4", "w-1/2"];

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grove";
const inlineLink = `font-bold text-grove underline decoration-grove/40 underline-offset-4 transition-colors hover:decoration-grove motion-reduce:transition-none ${focusRing}`;
const ghostButton = `inline-flex min-h-[44px] items-center justify-center rounded-pill border border-ink px-5 py-3 text-[13px] font-bold text-ink transition-colors hover:border-grove hover:text-grove motion-reduce:transition-none ${focusRing}`;
const stateText = "max-w-[52ch] text-[17px] leading-[1.7] text-ink-secondary";

// `?showAll=yes` asks the API for hidden (non-Visible) Notion entries too, for
// editors previewing drafts.
function faqEndpoint(): string {
  const showAll = new URLSearchParams(window.location.search).get("showAll") === "yes";
  return showAll ? `/api/faq?showAll=${encodeURIComponent("yes")}` : "/api/faq";
}

// The list mounts client-side, after the browser has already tried (and
// failed) to honour a `#faq-...` fragment. Once the questions exist, open the
// targeted one and bring it into view.
function openHashTarget(): void {
  const hash = window.location.hash.slice(1);
  if (!hash) return;
  const target = document.getElementById(decodeURIComponent(hash));
  if (!(target instanceof HTMLDetailsElement)) return;
  target.open = true;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  target.querySelector("summary")?.focus({ preventScroll: true });
}

function LoadingState() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading questions</span>
      <ul aria-hidden="true" className="divide-y divide-ink-divider border-y border-ink-divider">
        {SKELETON_WIDTHS.map((width) => (
          <li key={width} className="flex items-center justify-between gap-6 py-7">
            <div
              className={`h-5 ${width} rounded-sm bg-stone motion-safe:animate-pulse motion-reduce:animate-none`}
            />
            <div className="h-7 w-7 shrink-0 rounded-pill border border-ink-divider" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-lg bg-stone px-6 py-8 sm:px-8">
      <p className="text-[19px] font-extrabold leading-snug text-ink">The questions didn't load.</p>
      <p className={`mt-3 ${stateText}`}>
        This is on our side, not yours. Try again, or{" "}
        <a href="/contact" className={inlineLink}>
          send us your question
        </a>{" "}
        and we'll answer it directly.
      </p>
      <button type="button" onClick={onRetry} className={`mt-6 ${ghostButton}`}>
        Try again
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border-y border-ink-divider py-10">
      <p className="text-[19px] font-extrabold leading-snug text-ink">
        No questions are published right now.
      </p>
      <p className={`mt-3 ${stateText}`}>
        We're updating this page.{" "}
        <a href="/contact" className={inlineLink}>
          Ask us directly
        </a>{" "}
        in the meantime.
      </p>
    </div>
  );
}

export default function FAQList({
  faqs: initialFaqs = [],
  loading: initialLoading = false,
}: FAQListProps) {
  const [faqs, setFaqs] = useState<FAQItem[]>(initialFaqs);
  const [status, setStatus] = useState<LoadStatus>(
    initialFaqs.length === 0 || initialLoading ? "loading" : "ready"
  );

  const fetchFreshFAQs = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await fetch(faqEndpoint(), {
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      if (!response.ok) {
        console.error("Failed to fetch FAQs:", response.status);
        setStatus("error");
        return;
      }
      const newFaqs: FAQItem[] = await response.json();
      setFaqs(newFaqs);
      setStatus("ready");
    } catch (error) {
      console.error("Failed to fetch FAQs:", error);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (initialFaqs.length === 0) {
      fetchFreshFAQs();
    }
  }, [fetchFreshFAQs, initialFaqs.length]);

  useEffect(() => {
    if (status === "ready" && faqs.length > 0) {
      openHashTarget();
    }
  }, [status, faqs]);

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState onRetry={fetchFreshFAQs} />;
  if (faqs.length === 0) return <EmptyState />;

  return (
    <ul className="divide-y divide-ink-divider border-y border-ink-divider">
      {faqs.map((faq, index) => (
        <li key={faq.id || index}>
          <FAQAccordion question={faq.question} answer={faq.answer} />
        </li>
      ))}
    </ul>
  );
}
