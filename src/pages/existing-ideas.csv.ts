// src/pages/existing-ideas.csv.ts
import { getCollection } from "astro:content";

export async function GET() {
    const rawIdeas = await getCollection("ideas");

    const existingIdeas = rawIdeas.filter(idea => idea.data.category === "existing");

    const rows = existingIdeas.map(idea => {
        const title = idea.data.title ?? "Untitled";
        const category = idea.data.category ?? "";
        const description = extractFirstParagraph(idea.body);
        return `"${title}","${category}","${description}"`;
    });

    const csv = [
        `"Title","Category","Description"`,
        ...rows
    ].join("\n");

    return new Response(csv, {
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=existing-ideas.csv"
        }
    });
}

function extractFirstParagraph(body: string): string {
    return (
        body
            .split(/\n{2,}/)
            .find(block => !block.trim().startsWith("###"))
            ?.replace(/[*_`>#-]/g, "")
            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
            .replace(/"/g, '""') // escape double quotes
            .trim() || ""
    );
}
