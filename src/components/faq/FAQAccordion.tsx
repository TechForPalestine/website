import * as React from "react";
import RichTextRenderer from "../shared/RichTextRenderer";
import type { RichTextSegment } from "../../types/richText";

type FAQAccordionProps = {
  question: string;
  answer: React.ReactNode | string | RichTextSegment[];
};

// Stable anchor for a question. Kept identical to the id the old MUI
// accordion put on its summary, so any `/faq#faq-...` link already shared
// keeps resolving.
export function faqAnchorId(question: string): string {
  return `faq-${question.replaceAll(" ", "-")}`;
}

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grove";
const answerText = "max-w-[65ch] text-[17px] leading-[1.7] text-ink-secondary min-[810px]:text-lg";
const answerLink = `font-bold text-grove underline decoration-grove/40 underline-offset-4 transition-colors hover:decoration-grove motion-reduce:transition-none ${focusRing}`;

// One question, as a native <details>: keyboard operable (Enter/Space on the
// summary), announced as expandable by screen readers, and searchable with
// find-in-page, with no script and no MUI. Rendered inside FAQList's <ul>,
// whose hairline dividers separate the items.
export default function FAQAccordion({ question, answer }: FAQAccordionProps) {
  return (
    <details id={faqAnchorId(question)} className="group scroll-mt-28">
      <summary
        className={`flex cursor-pointer list-none items-start justify-between gap-6 rounded-sm py-6 text-[19px] font-extrabold leading-snug text-ink transition-colors hover:text-grove motion-reduce:transition-none min-[810px]:text-[21px] [&::-webkit-details-marker]:hidden ${focusRing}`}
      >
        <span className="min-w-0">{question}</span>
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border border-ink-divider text-ink transition-[transform,border-color,color] duration-200 ease-out group-open:rotate-45 group-open:border-grove group-open:text-grove motion-reduce:transition-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            className="h-3.5 w-3.5"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </summary>
      <div className={`pb-7 pr-12 ${answerText}`}>
        {typeof answer === "string" ? (
          <p>{answer}</p>
        ) : Array.isArray(answer) ? (
          <RichTextRenderer
            richText={answer}
            linkClassName={answerLink}
            accentTextClassName="font-bold text-grove"
            codeClassName="bg-stone text-ink"
          />
        ) : (
          answer
        )}
      </div>
    </details>
  );
}
