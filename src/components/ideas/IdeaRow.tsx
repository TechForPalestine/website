import RichTextRenderer from "../shared/RichTextRenderer";
import type { RichTextSegment, NotionRichText } from "../../types/richText";
import { focusRing, inlineLink, pill } from "../../utils/designClasses";
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

interface IdeaRowProps {
  idea: Idea;
  /** Label for the apply link ("Apply" or "Take the lead"). */
  action: string;
}

const descriptionText =
  "max-w-[65ch] text-[17px] leading-[1.7] text-ink-secondary min-[810px]:text-lg";
const applyLink = `${pill} border border-grove text-grove hover:bg-grove hover:text-white`;

function hasRichText(
  value: Idea["richTextDescription"]
): value is RichTextSegment[] | NotionRichText {
  if (!value) return false;
  return Array.isArray(value) ? value.length > 0 : (value.rich_text?.length ?? 0) > 0;
}

// One idea as a native <details>: the summary carries the title and a short
// excerpt, the panel the full brief. Keyboard operable and announced as
// expandable with no script. The apply link sits beside the details rather
// than inside the summary, so it stays one click away without nesting an
// interactive element in the toggle.
export default function IdeaRow({ idea, action }: IdeaRowProps) {
  const { data, excerpt, richTextDescription } = idea;
  const tags = data.tags ?? [];

  return (
    <li className="grid gap-x-10 gap-y-4 py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <details className="group min-w-0">
        <summary
          className={`flex cursor-pointer list-none items-start gap-5 rounded-sm text-ink transition-colors hover:text-grove motion-reduce:transition-none [&::-webkit-details-marker]:hidden ${focusRing}`}
        >
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border border-ink-divider transition-[transform,border-color,color] duration-200 ease-out group-open:rotate-45 group-open:border-grove group-open:text-grove motion-reduce:transition-none"
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
          <span className="min-w-0">
            <span className="block text-[19px] font-extrabold leading-snug min-[810px]:text-[21px]">
              {data.title}
            </span>
            {excerpt && (
              <span className="mt-2 line-clamp-2 block max-w-[65ch] text-[16px] leading-[1.6] text-ink-secondary group-open:hidden">
                {excerpt}
              </span>
            )}
          </span>
        </summary>

        <div className={`pl-12 pt-4 ${descriptionText}`}>
          {hasRichText(richTextDescription) ? (
            <RichTextRenderer richText={richTextDescription} />
          ) : (
            <p>
              The full brief for this idea isn't written up yet.{" "}
              <a href="/contact" className={inlineLink}>
                Ask us about it
              </a>
              .
            </p>
          )}

          {tags.length > 0 && (
            <ul aria-label="Tags" className="mt-5 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-pill border border-first-light-edge bg-first-light px-3 py-1 text-[13px] font-bold text-grove-deep"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>

      <a
        href={IDEA_APPLY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`ml-12 justify-self-start sm:ml-0 ${applyLink}`}
      >
        {action}
        <span className="sr-only">: {data.title} (opens in a new tab)</span>
      </a>
    </li>
  );
}
