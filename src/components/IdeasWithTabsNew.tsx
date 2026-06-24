import React, { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import RichTextRenderer from "./RichTextRenderer.tsx";
import type { RichTextSegment, NotionRichText } from "../types/richText";

type Idea = {
  id?: string;
  slug?: string;
  data: {
    title: string;
    tags?: string[];
  };
  richTextDescription?: RichTextSegment[] | NotionRichText | null;
  excerpt?: string;
};

type IdeasWithTabsProps = {
  newIdeas: Idea[];
  existingIdeas: Idea[];
  startedIdeas: Idea[];
};

type ActiveIdeaType = {
  title: string;
  richTextDescription: RichTextSegment[] | NotionRichText;
  tags: string[];
  isNew: boolean;
};

const TABS = [
  { key: "new" as const, label: "Ideas for new projects" },
  { key: "existing" as const, label: "Existing projects needing leaders" },
  { key: "started" as const, label: "Started projects" },
];

export default function IdeasWithTabsNew({
  newIdeas,
  existingIdeas,
  startedIdeas,
}: IdeasWithTabsProps) {
  const [activeTab, setActiveTab] = useState<"new" | "existing" | "started">("new");
  const [activeIdea, setActiveIdea] = useState<ActiveIdeaType | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const MODAL_TRANSITION_MS = 300;

  const currentList =
    activeTab === "new" ? newIdeas : activeTab === "existing" ? existingIdeas : startedIdeas;

  // ESC to close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeIdea) closeModal();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeIdea]);

  // Freeze Lenis (smooth scroll) while modal is open so wheel events can't move the page.
  useEffect(() => {
    const lenis = (window as any).__lenis;
    if (activeIdea) {
      lenis?.stop();
    } else {
      lenis?.start();
    }
    return () => { lenis?.start(); };
  }, [activeIdea]);

  const openIdea = (idea: Idea) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    // flushSync renders the modal at scale-95/opacity-0 before the rAF flips it
    // visible, so the enter transition always plays (even on first open).
    flushSync(() =>
      setActiveIdea({
        title: idea.data.title,
        richTextDescription:
          idea.richTextDescription && Array.isArray(idea.richTextDescription)
            ? idea.richTextDescription
            : idea.richTextDescription && "rich_text" in (idea.richTextDescription as object)
              ? idea.richTextDescription
              : [],
        tags: idea.data.tags || [],
        isNew: activeTab === "new",
      })
    );
    requestAnimationFrame(() => setModalVisible(true));
  };

  const closeModal = () => {
    // Play the exit transition first, then unmount after it finishes.
    setModalVisible(false);
    closeTimer.current = setTimeout(() => setActiveIdea(null), MODAL_TRANSITION_MS);
  };

  // Clear any pending close timer on unmount
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  return (
    <div className="px-6 pb-14 min-[810px]:px-10 min-[810px]:pb-20">
      <div className="mx-auto max-w-[1400px]">
        {/* Tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={[
                "ts-body-small rounded-pill px-4 py-2 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                activeTab === key
                  ? "bg-brand text-page"
                  : "border border-ink-divider text-ink-secondary hover:border-brand/40 hover:text-ink",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {currentList.length === 0 ? (
          <p className="ts-body py-8 text-ink-secondary">No ideas in this category yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentList.map((idea) => (
              <button
                key={idea.id || idea.slug}
                onClick={() => openIdea(idea)}
                className="group flex min-h-[160px] cursor-pointer flex-col items-start justify-between rounded-[20px] border border-butter bg-sand p-6 text-left transition-colors duration-150 hover:border-brand/30 hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <div>
                  <h3 className="ts-label mb-2 text-ink transition-colors duration-150 group-hover:text-brand">
                    {idea.data.title}
                  </h3>
                  {idea.excerpt && (
                    <p className="ts-body-small line-clamp-2 text-ink-secondary">{idea.excerpt}</p>
                  )}
                </div>

                <div className="mt-4 flex w-full items-center justify-between">
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open("https://projecthub.techforpalestine.org/apply", "_blank");
                    }}
                    className="ts-body-small rounded-pill border border-brand/30 bg-brand/10 px-3 py-1 text-brand transition-colors duration-150 hover:bg-brand hover:text-page"
                  >
                    {activeTab === "new" ? "Apply" : "Take the Lead"}
                  </span>
                  <span className="ts-body-small text-ink-secondary transition-colors duration-150 group-hover:text-ink">
                    Read more →
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal — always mounted once first idea is opened, controlled by modalVisible */}
      {activeIdea && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          className={[
            "fixed inset-0 z-50 flex items-center justify-center px-4 py-8",
            "bg-ink/60 backdrop-blur-sm",
            "transition-opacity duration-300 motion-reduce:transition-none",
            modalVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
        >
          <div
            ref={panelRef}
            data-lenis-prevent
            className={[
              "relative max-h-[90vh] w-full max-w-2xl overflow-y-auto overscroll-y-contain rounded-[20px] border border-butter bg-page p-6 shadow-xl min-[810px]:p-8",
              "transition-all duration-300 ease-out motion-reduce:transition-none",
              modalVisible ? "scale-100 opacity-100" : "scale-95 opacity-0",
            ].join(" ")}
          >
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-ink-divider text-ink-secondary transition-colors hover:border-brand/30 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <p className="ts-overline mb-3 text-ink-secondary">
              {activeIdea.isNew ? "New project idea" : "Project opportunity"}
            </p>
            <h2 className="ts-heading mb-6 text-ink">{activeIdea.title}</h2>

            <div className="ts-body text-ink-secondary">
              <RichTextRenderer richText={activeIdea.richTextDescription} className="!font-sans" />
            </div>

            {activeIdea.tags?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {activeIdea.tags.map((tag, i) => (
                  <span key={i} className="ts-body-small rounded-pill border border-ink-divider px-2.5 py-1 text-ink-secondary">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-8 border-t border-ink-divider pt-6">
              <a
                href="https://projecthub.techforpalestine.org/apply"
                target="_blank"
                rel="noopener noreferrer"
                className="ts-label inline-flex items-center gap-2 rounded-pill bg-brand px-6 py-3 text-page transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Apply for this idea
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
