import React, { useState } from "react";
import type { Tag } from "./projectData";

interface TagFilterProps {
  tags: Tag[];
  activeTags: Tag[];
  onToggle: (tag: Tag) => void;
  onClear: () => void;
}

const MAX_VISIBLE = 10;

export default function TagFilter({ tags, activeTags, onToggle, onClear }: TagFilterProps) {
  const [showAll, setShowAll] = useState(false);

  if (tags.length === 0) return null;

  const visibleTags = showAll ? tags : tags.slice(0, MAX_VISIBLE);
  const hasMore = tags.length > MAX_VISIBLE;
  const activeIds = new Set(activeTags.map((t) => t.id));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {visibleTags.map((tag) => {
          const isActive = activeIds.has(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onToggle(tag)}
              className={[
                "ts-caption rounded-pill border px-3 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                isActive
                  ? "border-brand bg-brand text-white"
                  : "border-ink-divider bg-transparent text-ink-secondary hover:border-brand/40 hover:text-ink",
              ].join(" ")}
              aria-pressed={isActive}
            >
              {tag.name}
            </button>
          );
        })}

        {hasMore && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="ts-caption rounded-pill border border-ink-divider bg-transparent px-3 py-1.5 text-ink-secondary transition-colors hover:border-ink-divider hover:text-ink"
          >
            {showAll ? "Show fewer" : `+${tags.length - MAX_VISIBLE} more`}
          </button>
        )}
      </div>

      {activeTags.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="ts-body-small self-start text-brand hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
