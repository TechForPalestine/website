// src/pages/projects.csv.ts
import { getCollection } from "astro:content";

export async function GET() {
  const projectEntries = await getCollection("projects");

  const projects = projectEntries.map((entry) => ({
    project_name: entry.data.title,
    website: entry.data.url ?? "",
    discord_channel: entry.data.channel ?? "",
    elevator_pitch: entry.body.replace(/\n/g, " ").replace(/"/g, '""'), // sanitize
  }));

  // CSV Header
  const header = `"Project Name","Website","Discord Channel","Elevator Pitch"`;

  // CSV Rows
  const rows = projects.map(
    (p) => `"${p.project_name}","${p.website}","${p.discord_channel}","${p.elevator_pitch}"`
  );

  const csv = [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=projects.csv",
    },
  });
}
