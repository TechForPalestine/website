import { fetchNotionEventById } from "../../store/notionClient";

export async function GET({ request }: { request: Request }) {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
        return new Response(JSON.stringify({ error: "Missing ID" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const event = await fetchNotionEventById(id);
        return new Response(JSON.stringify(event), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("Failed to fetch event:", err);
        return new Response(JSON.stringify({ error: "Failed to fetch event" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
