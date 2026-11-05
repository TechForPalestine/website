import { useState } from "react";
import IdeaRow, { type Idea } from "./IdeaRow";
import { IDEA_APPLY_URL, IDEA_CATEGORIES, type IdeaCategory } from "./ideaCategories";
import { ghostButton, inlineLink, pill } from "../../utils/designClasses";

interface IdeasWithTabsProps {
  newIdeas: Idea[];
  existingIdeas: Idea[];
  startedIdeas: Idea[];
  /** True when the server-side Notion fetch threw (distinct from "no ideas"). */
  loadFailed?: boolean;
}

const stateText = "max-w-[52ch] text-[17px] leading-[1.7] text-ink-secondary";
const filterActive = `${pill} border border-grove bg-grove text-white`;
const filterIdle = `${pill} border border-ink-divider bg-paper text-ink hover:border-grove hover:text-grove`;

function SubmitOwnLink({ children }: { children: string }) {
  return (
    <a href={IDEA_APPLY_URL} target="_blank" rel="noopener noreferrer" className={inlineLink}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function ErrorState() {
  return (
    <div role="alert" className="rounded-lg bg-stone px-6 py-8 sm:px-8">
      <p className="text-[19px] font-extrabold leading-snug text-ink">The ideas didn't load.</p>
      <p className={`mt-3 ${stateText}`}>
        This is on our side, not yours. Try again, or{" "}
        <SubmitOwnLink>tell us your idea</SubmitOwnLink> directly.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className={`mt-6 ${ghostButton}`}
      >
        Try again
      </button>
    </div>
  );
}

function NothingPublished() {
  return (
    <div className="border-y border-ink-divider py-10">
      <p className="text-[19px] font-extrabold leading-snug text-ink">
        No ideas are published right now.
      </p>
      <p className={`mt-3 ${stateText}`}>
        We're updating the list. In the meantime, <SubmitOwnLink>bring your own idea</SubmitOwnLink>
        .
      </p>
    </div>
  );
}

function EmptyCategory({ label }: { label: string }) {
  return (
    <div className="border-y border-ink-divider py-10">
      <p className="text-[19px] font-extrabold leading-snug text-ink">
        Nothing under “{label}” right now.
      </p>
      <p className={`mt-3 ${stateText}`}>
        Check the other lists, or <SubmitOwnLink>submit your own idea</SubmitOwnLink>.
      </p>
    </div>
  );
}

// The /ideas directory: a segmented filter over the three Notion categories
// and a list of expandable ideas. The filter uses plain toggle buttons with
// aria-pressed (it filters one list rather than switching panels).
export default function IdeasWithTabs({
  newIdeas,
  existingIdeas,
  startedIdeas,
  loadFailed = false,
}: IdeasWithTabsProps) {
  const [activeTab, setActiveTab] = useState<IdeaCategory>("new");

  if (loadFailed) return <ErrorState />;

  const lists: Record<IdeaCategory, Idea[]> = {
    new: newIdeas,
    existing: existingIdeas,
    started: startedIdeas,
  };
  if (newIdeas.length + existingIdeas.length + startedIdeas.length === 0) {
    return <NothingPublished />;
  }

  const active =
    IDEA_CATEGORIES.find((category) => category.id === activeTab) ?? IDEA_CATEGORIES[0];
  const currentList = lists[activeTab];

  return (
    <div>
      <div role="group" aria-label="Filter ideas" className="flex flex-wrap gap-2">
        {IDEA_CATEGORIES.map((category) => {
          const isActive = category.id === activeTab;
          const count = lists[category.id].length;
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={isActive}
              aria-controls="ideas-list"
              onClick={() => setActiveTab(category.id)}
              className={isActive ? filterActive : filterIdle}
            >
              {category.label}
              <span
                aria-hidden="true"
                className={`tabular-nums ${isActive ? "text-white/75" : "text-ink-secondary"}`}
              >
                {count}
              </span>
              <span className="sr-only">, {count} ideas</span>
            </button>
          );
        })}
      </div>

      <p
        aria-live="polite"
        className="mt-5 max-w-[60ch] text-[16px] leading-[1.6] text-ink-secondary"
      >
        {active.summary}
      </p>

      <div id="ideas-list" className="mt-8">
        {currentList.length === 0 ? (
          <EmptyCategory label={active.label} />
        ) : (
          // Keyed by category so open rows reset when the filter changes.
          <ul key={activeTab} className="divide-y divide-ink-divider border-y border-ink-divider">
            {currentList.map((idea, index) => (
              <IdeaRow key={idea.id || idea.slug || index} idea={idea} action={active.action} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
