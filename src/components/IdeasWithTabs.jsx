import React, { useState, useEffect, useRef } from "react";
import RichTextRenderer from "./RichTextRenderer.tsx";

export default function IdeasWithTabs({ newIdeas, existingIdeas }) {
  const [activeTab, setActiveTab] = useState("new");
  const [activeIdea, setActiveIdea] = useState(null);
  const overlayRef = useRef(null);

  const currentList = activeTab === "new" ? newIdeas : existingIdeas;

  // Close on ESC
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setActiveIdea(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      setActiveIdea(null);
    }
  };

  return (
    <div className="min-h-screen py-4">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Tabs */}
          <div className="mb-8 flex justify-center gap-4">
            <button
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === "new"
                  ? "bg-[#166534] text-white"
                  : "border border-[#166534] bg-white text-[#166534]"
              }`}
              onClick={() => setActiveTab("new")}
            >
              Ideas for new projects
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === "existing"
                  ? "bg-[#166534] text-white"
                  : "border border-[#166534] bg-white text-[#166534]"
              }`}
              onClick={() => setActiveTab("existing")}
            >
              Existing projects needing leaders
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {currentList.map(({ id, slug, data, richTextDescription, excerpt }) => (
              <div
                key={id || slug}
                onClick={() =>
                  setActiveIdea({
                    title: data.title,
                    richTextDescription: richTextDescription,
                    tags: data.tags || [],
                  })
                }
                className="flex min-h-[160px] cursor-pointer flex-col justify-between rounded-xl bg-white p-5 shadow-sm transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg"
              >
                <div>
                  <h3 className="mb-2 text-base font-semibold text-[#166534]">{data.title}</h3>
                  {excerpt && <p className="line-clamp-2 text-sm text-gray-600">{excerpt}</p>}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent modal from opening
                      window.open("https://projecthub.techforpalestine.org/apply", "_blank");
                    }}
                    className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white shadow transition hover:bg-[#166534]"
                  >
                    {activeTab === "new" ? "Apply" : "Take the Lead"}
                  </button>
                  <span className="text-sm font-medium text-black hover:underline">
                    Read more →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal */}
        {activeIdea && (
          <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4 py-8 backdrop-blur-sm"
          >
            <div className="relative max-h-[90vh] w-full max-w-2xl animate-fadeIn overflow-y-auto rounded-xl border-t-4 border-[#166534] bg-white p-6 shadow-xl">
              <button
                onClick={() => setActiveIdea(null)}
                className="absolute right-3 top-3 text-xl text-gray-600 hover:text-[#166534]"
                aria-label="Close"
              >
                ×
              </button>
              <h2 className="mb-4 text-2xl font-bold text-[#166534]">{activeIdea.title}</h2>
              <div className="prose prose-sm prose-stone max-w-none">
                <RichTextRenderer
                  richText={activeIdea.richTextDescription}
                  className="!font-sans"
                />
              </div>
              {activeIdea.tags?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {activeIdea.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-green-100 px-2 py-1 text-xs text-[#166534]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-6 text-right">
                <a
                  href="https://projecthub.techforpalestine.org/apply"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-full bg-[#166534] px-6 py-2 font-semibold text-white shadow transition hover:bg-[#14532d]"
                >
                  Apply for this idea
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      <section className="mt-24 px-4 sm:px-6 lg:px-16">
        <div className="flex flex-col items-start gap-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-lg md:flex-row md:gap-12 md:p-10">
          {/* Left Column: Generating new ideas */}
          <div className="flex-1">
            <h2 className="mb-4 text-2xl font-bold text-[#166534]">Generating new ideas</h2>
            <p className="mb-4 text-gray-700">
              There are endless amounts of pro-Israel initiatives that need to be countered.
              Consider an initiative to fight:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm text-gray-700">
              <li>a politician’s complicity / ties to Israel</li>
              <li>someone who committed violence against protestors</li>
              <li>a pro-Israel hasbara organization</li>
              <li>some entity’s investments in Israel</li>
              <li>a US non-profit funding the genocide or apartheid (e.g. Friends of the IDF)</li>
            </ul>
          </div>

          {/* Divider */}
          <div className="hidden w-px self-stretch bg-gray-200 md:block"></div>

          {/* Right Column: How to apply */}
          <div className="flex-1">
            <h2 className="mb-4 text-2xl font-bold text-[#166534]">How to apply</h2>
            <p className="mb-6 text-gray-700">
              Want to lead an existing project or bring a new idea to life? Let us know below.
            </p>
            <a
              href="https://projecthub.techforpalestine.org/apply"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-full bg-[#166534] px-6 py-2 font-semibold text-white shadow transition hover:bg-[#14532d]"
            >
              Submit your own
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
