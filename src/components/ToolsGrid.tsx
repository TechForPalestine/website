import React from "react";

interface Tool {
  /**
   * Title of the tool
   */
  title: string;
  /**
   * Description of the tool
   */
  description: string;
  /**
   * Text for the button
   */
  buttonText: string;
  /**
   * Link to the tool
   */
  link: string;
  /**
   * Logo URL of the tool, SVG format
   */
  logo: string;
}

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
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-[#166534]">Available Tools</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-6 shadow"
            >
              <div className="mb-4 flex items-center gap-4">
                <img src={tool.logo} alt={tool.title} className="h-10 w-10 object-contain" />
                <h3 className="text-lg font-semibold text-[#166534]">{tool.title}</h3>
              </div>
              <p className="mb-6 text-sm text-gray-700">{tool.description}</p>
              <a
                href={tool.link}
                className="inline-block rounded bg-[#166534] px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-[#14532d]"
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
