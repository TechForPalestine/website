import React from "react";

const tools = [
    {
        title: "Pal-chat",
        description: "A secure group chat system for Palestine.",
        buttonText: "Visit Pal-chat",
        link: "#",
        logo: "/logos/palchat.svg",
    },
    {
        title: "Boycat",
        description: "Your Ethical Shopping Companion",
        buttonText: "Visit Boycat",
        link: "#",
        logo: "/logos/boycat.svg",
    },
    {
        title: "Find A Protest",
        description: "Discover protests and actions across the world",
        buttonText: "Visit Find a Protest",
        link: "#",
        logo: "/logos/protest.svg",
    },
    {
        title: "TAP Datasets",
        description: "Tap into our open-source consumer boycott datasets.",
        buttonText: "Visit TAP Datasets",
        link: "#",
        logo: "/logos/tap.svg",
    },
    {
        title: "The Wall",
        description: "A tool dedicated to detect and block pro-Israel networks.",
        buttonText: "Visit The Wall",
        link: "#",
        logo: "/logos/wall.svg",
    },
    {
        title: "Profile Pic Maker",
        description:
            "Show your support for Palestine by generating a Palestine-themed profile picture.",
        buttonText: "Visit Profile Pic Maker",
        link: "#",
        logo: "/logos/profile-pic.svg",
    },
];

export default function ToolsGrid() {
    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-center text-3xl font-bold text-[#166534] mb-12">
                    Available Tools
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tools.map((tool, i) => (
                        <div
                            key={i}
                            className="bg-white border border-gray-100 rounded-xl shadow p-6 flex flex-col justify-between"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <img
                                    src={tool.logo}
                                    alt={tool.title}
                                    className="w-10 h-10 object-contain"
                                />
                                <h3 className="text-lg font-semibold text-[#166534]">
                                    {tool.title}
                                </h3>
                            </div>
                            <p className="text-gray-700 text-sm mb-6">{tool.description}</p>
                            <a
                                href={tool.link}
                                className="inline-block bg-[#166534] hover:bg-[#14532d] text-white text-sm font-medium px-4 py-2 rounded shadow transition"
                            >
                                {tool.buttonText}
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
