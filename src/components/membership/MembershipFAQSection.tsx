import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string | { text: string; items?: string[] };
}

const faqs: FAQItem[] = [
  {
    question: "How does membership support Palestinian liberation?",
    answer:
      "Membership brings together like-minded members and activists to lead, co-lead or support projects and committees. Members can support the movement by contributing financially or by getting involved directly as a working committee leader or member.",
  },
  {
    question: "How do I get involved after signup?",
    answer: {
      text: "We will send you an email about the ways to get involved as a member:",
      items: [
        "Get T4P support on leveling up personal and corporate boycotts, using ethical alternatives, and learning how to activate against tech complicity.",
        "Bring T4P resources into your companies for hiring and policy support.",
        "Meet with us one-on-one to see how your skills and interests can support the mission.",
        "Join working committees of fellow advocates taking direct action for Palestinian liberation.",
        "Attend meetups and webinars to connect and learn from other activists.",
        "Stay up-to-date by reading and sharing movement updates.",
      ],
    },
  },
  {
    question: "Why are there membership dues?",
    answer:
      "Dues are pay-what-you-can and help us progress towards our goal of 10,000 projects for Palestine by supporting project work itself — grants for advocacy projects, access to expert trainings, mentorship from startup founders, and other developmental opportunities to help projects scale — and by supporting the infrastructure that lets us get work done, including software and employees. Tech for Palestine aims for inclusivity. If you are unable to access banking services, please reach out to membership@techforpalestine.org to request a waiver of dues.",
  },
  {
    question: "Are dues tax deductible? Can I apply gift aid?",
    answer:
      "Yes, if you are in the US your dues are tax deductible. If you are in the UK, contact us at membership@techforpalestine.org after signing up, and we will ensure future donations are processed through our gift aid partner.",
  },
  {
    question:
      "Can I pay annually or via a different payment method (DAF, cryptocurrency, foundation, etc.)?",
    answer:
      "These options will be supported in the future, and we will help you migrate to your preferred method of giving once available.",
  },
];

function linkifyEmail(text: string) {
  const parts = text.split("membership@techforpalestine.org");
  return parts.map((part, i) =>
    i < parts.length - 1 ? (
      <span key={i}>
        {part}
        <a
          href="mailto:membership@techforpalestine.org"
          className="text-brand underline hover:text-brand-hover"
        >
          membership@techforpalestine.org
        </a>
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function FAQItem({ question, answer }: FAQItem) {
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
              <p>{linkifyEmail(answer)}</p>
            ) : (
              <>
                <p className="mb-3">{answer.text}</p>
                {answer.items && (
                  <ul className="space-y-2">
                    {answer.items.map((item) => (
                      <li key={item} className="flex items-baseline gap-3">
                        <span
                          className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MembershipFAQSection() {
  return (
    <div>
      {faqs.map((faq) => (
        <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
      ))}
    </div>
  );
}
