import { useEffect, useRef } from "react";
import RichTextRenderer from "../shared/RichTextRenderer";
import type { RichTextSegment, NotionRichText } from "../../types/richText";
import { focusRing, inlineLink, primaryButton } from "../../utils/designClasses";
import { IDEA_APPLY_URL } from "./ideaCategories";
import type { Idea } from "./IdeaCard";

interface IdeaDialogProps {
  /** The idea to show; null keeps the dialog closed. */
  idea: Idea | null;
  onClose: () => void;
}

function hasRichText(
  value: Idea["richTextDescription"]
): value is RichTextSegment[] | NotionRichText {
  if (!value) return false;
  return Array.isArray(value) ? value.length > 0 : (value.rich_text?.length ?? 0) > 0;
}

// The full brief, as on the original page, but on a native <dialog> opened
// with showModal(): the browser supplies the focus trap, Esc to close, inert
// background and focus return to the card that opened it. A click on the
// backdrop also closes it.
export default function IdeaDialog({ idea, onClose }: IdeaDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (idea && !dialog.open) dialog.showModal();
    if (!idea && dialog.open) dialog.close();
  }, [idea]);

  const tags = idea?.data.tags ?? [];

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="idea-dialog-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-lg bg-paper p-0 text-ink backdrop:bg-ink/50"
    >
      {idea && (
        <div className="max-h-[85vh] overflow-y-auto px-6 pb-8 pt-6 sm:px-8">
          <div className="flex items-start justify-between gap-6">
            <h2
              id="idea-dialog-title"
              className="text-[24px] font-extrabold leading-tight text-ink min-[810px]:text-[30px]"
            >
              {idea.data.title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={`-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-pill text-ink-secondary transition-colors hover:text-grove motion-reduce:transition-none ${focusRing}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                aria-hidden="true"
                className="h-5 w-5"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="mt-5 max-w-[65ch] text-[17px] leading-[1.7] text-ink-secondary min-[810px]:text-lg">
            {hasRichText(idea.richTextDescription) ? (
              <RichTextRenderer richText={idea.richTextDescription} />
            ) : (
              <p>
                The full brief for this idea isn't written up yet.{" "}
                <a href="/contact" className={inlineLink}>
                  Ask us about it
                </a>
                .
              </p>
            )}
          </div>

          {tags.length > 0 && (
            <ul aria-label="Tags" className="mt-6 flex flex-wrap gap-2">
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

          <div className="mt-8 border-t border-ink-divider pt-6">
            <a
              href={IDEA_APPLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={primaryButton}
            >
              Apply for this idea
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>
      )}
    </dialog>
  );
}
