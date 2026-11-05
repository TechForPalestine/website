import type { RichTextSegment, NotionRichText } from "../../types/richText";
import { pill } from "../../utils/designClasses";
import { IDEA_APPLY_URL } from "./ideaCategories";

export interface Idea {
  id?: string;
  slug?: string;
  data: {
    title: string;
    tags?: string[];
  };
  richTextDescription?: RichTextSegment[] | NotionRichText | null;
  excerpt?: string;
}

interface IdeaCardProps {
  idea: Idea;
  /** Label for the apply link ("Apply" or "Take the lead"). */
  action: string;
  /** Opens the full brief. */
  onOpen: (idea: Idea) => void;
}

export const applyLinkClass = `${pill} border border-grove text-grove hover:bg-grove hover:text-white`;

// One idea as a card, as on the original page: title, excerpt, and a footer
// with the apply link and a "Read more" affordance (DESIGN.md §5: Grove label
// above a hairline). The title button is stretched over the card so the whole
// card opens the brief; the apply link sits above that layer so it stays a
// separate, one-click action.
export default function IdeaCard({ idea, action, onOpen }: IdeaCardProps) {
  const { data, excerpt } = idea;

  return (
    <li className="h-full">
      <article className="group relative flex h-full min-h-[180px] flex-col rounded-lg border border-ink-divider bg-paper p-6 transition-shadow hover:shadow-sm has-[button:focus-visible]:outline has-[button:focus-visible]:outline-2 has-[button:focus-visible]:outline-offset-2 has-[button:focus-visible]:outline-grove motion-reduce:transition-none">
        <h3 className="text-[19px] font-extrabold leading-snug text-ink">
          <button
            type="button"
            onClick={() => onOpen(idea)}
            aria-haspopup="dialog"
            className="text-left transition-colors after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:outline-none group-hover:text-grove motion-reduce:transition-none"
          >
            {data.title}
          </button>
        </h3>
        {excerpt && (
          <p className="mt-2 line-clamp-3 text-base leading-relaxed text-ink-secondary">
            {excerpt}
          </p>
        )}

        {/* Spacer: pins the footer to the bottom, with a minimum gap above it. */}
        <div aria-hidden="true" className="min-h-5 flex-1" />
        <div className="flex items-center justify-between gap-4 border-t border-ink-divider pt-4">
          <a
            href={IDEA_APPLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`relative z-10 ${applyLinkClass}`}
          >
            {action}
            <span className="sr-only">: {data.title} (opens in a new tab)</span>
          </a>
          <span aria-hidden="true" className="text-[13px] font-bold text-grove">
            Read more →
          </span>
        </div>
      </article>
    </li>
  );
}
