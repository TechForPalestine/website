import React, { useState, useEffect } from "react";
import RichTextRenderer from "./RichTextRenderer";
import type { RichTextSegment } from "../types/richText";

interface FAQItem {
  id: string;
  question: string;
  answer: string | RichTextSegment[];
}

function FAQAccordionItem({ question, answer }: { question: string; answer: FAQItem["answer"] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-ink-divider last:border-b">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-6 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <span className="ts-body-large font-medium text-ink">{question}</span>
        <span
          className={`mt-1 shrink-0 text-brand transition-transform duration-300 ${open ? "rotate-45" : ""}`}
          aria-hidden="true"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <line x1="10" y1="2" x2="10" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="2" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="ts-body max-w-[65ch] pb-6 text-ink-secondary">
            {typeof answer === "string" ? (
              <p>{answer}</p>
            ) : Array.isArray(answer) ? (
              <RichTextRenderer richText={answer} />
            ) : (
              answer
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const showAll = new URLSearchParams(window.location.search).get("showAll") === "yes";
    fetch(showAll ? "/api/faq?showAll=yes" : "/api/faq", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setFaqs(data))
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <span className="ts-body-large text-ink-secondary">Loading…</span>
      </div>
    );
  }

  if (faqs.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <span className="ts-body-large text-ink-secondary">No FAQs available at the moment.</span>
      </div>
    );
  }

  return (
    <div>
      {faqs.map((faq, index) => (
        <FAQAccordionItem key={faq.id || index} question={faq.question} answer={faq.answer} />
      ))}
    </div>
  );
}
