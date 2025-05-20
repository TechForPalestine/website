import React, { useState, useEffect, useRef } from "react";

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

    return (<div className=" py-4  min-h-screen">
        <div className=" px-4 sm:px-6 lg:px-8 ">
            <div className="max-w-7xl mx-auto">
                {/* Tabs */}
                <div className="flex justify-center mb-8 gap-4">
                    <button
                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                            activeTab === "new"
                                ? "bg-[#166534] text-white"
                                : "bg-white text-[#166534] border border-[#166534]"
                        }`}
                        onClick={() => setActiveTab("new")}
                    >
                        Ideas for new projects
                    </button>
                    <button
                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                            activeTab === "existing"
                                ? "bg-[#166534] text-white"
                                : "bg-white text-[#166534] border border-[#166534]"
                        }`}
                        onClick={() => setActiveTab("existing")}
                    >
                        Existing projects needing leaders
                    </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentList.map(({ id, slug, data, renderedBody, excerpt }) => (
                        <div
                            key={id || slug}
                            onClick={() =>
                                setActiveIdea({
                                    title: data.title,
                                    body: renderedBody,
                                    tags: data.tags || [],
                                })
                            }
                            className="cursor-pointer rounded-xl bg-white p-5 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-transform duration-300 min-h-[160px] flex flex-col justify-between"
                        >
                            <div>
                                <h3 className="text-[#166534] font-semibold text-base mb-2">
                                    {data.title}
                                </h3>
                                {excerpt && (
                                    <p className="text-sm text-gray-600 line-clamp-2">{excerpt}</p>
                                )}
                            </div>
                            <div className="mt-4  flex justify-between items-center">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent modal from opening
                                        window.open(
                                            "https://app.formbricks.com/s/clzax64r70000v39tqtnvg558",
                                            "_blank"
                                        );
                                    }}
                                    className="text-white bg-black hover:bg-[#166534] text-xs font-medium px-3 py-1 rounded-full shadow transition"
                                >
                                    { activeTab === "new"?  "Get Involved" : "Take the Lead"}
                                </button>
                <span className="text-black text-sm font-medium hover:underline">
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
                    className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center px-4 py-8 backdrop-blur-sm"
                >
                    <div className="relative bg-white max-w-2xl w-full rounded-xl p-6 shadow-xl border-t-4 border-[#166534] animate-fadeIn overflow-y-auto max-h-[90vh]">
                        <button
                            onClick={() => setActiveIdea(null)}
                            className="absolute top-3 right-3 text-gray-600 hover:text-[#166534] text-xl"
                            aria-label="Close"
                        >
                            ×
                        </button>
                        <h2 className="text-2xl font-bold text-[#166534] mb-4">
                            {activeIdea.title}
                        </h2>
                        <div
                            className="prose prose-sm prose-stone max-w-none"
                            dangerouslySetInnerHTML={{ __html: activeIdea.body }}
                        />
                        {activeIdea.tags?.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {activeIdea.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="text-xs bg-green-100 text-[#166534] px-2 py-1 rounded-full"
                                    >
                    {tag}
                  </span>
                                ))}
                            </div>
                        )}
                        <div className="mt-6 text-right">
                            <a
                                href="https://app.formbricks.com/s/clzax64r70000v39tqtnvg558"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block bg-[#166534] hover:bg-[#14532d] text-white font-semibold px-6 py-2 rounded-full shadow transition"
                            >
                                Apply for this idea
                            </a>
                        </div>
                    </div>
                </div>
            )}


        </div>


            <section className="mt-24 px-4 sm:px-6 lg:px-16 ">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 md:p-10 flex flex-col md:flex-row gap-8 md:gap-12 items-start">

                    {/* Left Column: Generating new ideas */}
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-[#166534] mb-4">Generating new ideas</h2>
                        <p className="text-gray-700 mb-4">
                            There are endless amounts of pro-Israel initiatives that need to be countered. Consider an initiative to fight:
                        </p>
                        <ul className="list-disc pl-5 text-gray-700 text-sm space-y-2">
                            <li>a politician’s complicity / ties to Israel</li>
                            <li>someone who committed violence against protestors</li>
                            <li>a pro-Israel hasbara organization</li>
                            <li>some entity’s investments in Israel</li>
                            <li>a US non-profit funding the genocide or apartheid (e.g. Friends of the IDF)</li>
                        </ul>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px bg-gray-200 self-stretch"></div>

                    {/* Right Column: How to apply */}
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-[#166534] mb-4">How to apply</h2>
                        <p className="text-gray-700 mb-6">
                            Want to lead an existing project or bring a new idea to life? Let us know below.

                        </p>
                        <a
                            href="https://app.formbricks.com/s/clzax64r70000v39tqtnvg558"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-[#166534] hover:bg-[#14532d] text-white font-semibold px-6 py-2 rounded-full shadow transition"
                        >
                            Submit your own
                        </a>
                    </div>

                </div>
            </section>

        </div>
    );
}
