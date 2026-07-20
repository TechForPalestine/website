import React from "react";

// The Mattermost calendar plugin's event descriptions use a small, consistent
// subset of Markdown: "## " headings, "---" rules, "- "/"1. " lists, blank-line
// paragraphs, **bold**, and bare URLs. This isn't full CommonMark support —
// just what's actually observed in the feed.
export type DescriptionBlock =
  | { type: "heading"; text: string }
  | { type: "hr" }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "paragraph"; text: string };

const isBulletLine = (l: string) => /^-\s+/.test(l);
const isNumberedLine = (l: string) => /^\d+\.\s+/.test(l);

export function parseEventDescription(description: string): DescriptionBlock[] {
  const rawBlocks = description
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const blocks: DescriptionBlock[] = [];

  for (const raw of rawBlocks) {
    if (raw === "---") {
      blocks.push({ type: "hr" });
      continue;
    }
    if (raw.startsWith("## ")) {
      blocks.push({ type: "heading", text: raw.slice(3).trim() });
      continue;
    }

    const lines = raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length > 0 && lines.every(isBulletLine)) {
      blocks.push({ type: "list", ordered: false, items: lines.map((l) => l.replace(/^-\s+/, "")) });
      continue;
    }
    if (lines.length > 0 && lines.every(isNumberedLine)) {
      blocks.push({ type: "list", ordered: true, items: lines.map((l) => l.replace(/^\d+\.\s+/, "")) });
      continue;
    }

    // A label line ("Agenda:") followed entirely by list items is a common
    // pattern in the feed — split it into a short paragraph plus a real
    // list, rather than losing the list structure as one plain paragraph.
    const listStart = lines.findIndex((l) => isBulletLine(l) || isNumberedLine(l));
    if (listStart > 0) {
      const ordered = isNumberedLine(lines[listStart]);
      const rest = lines.slice(listStart);
      const restIsList = ordered ? rest.every(isNumberedLine) : rest.every(isBulletLine);
      if (restIsList) {
        blocks.push({ type: "paragraph", text: lines.slice(0, listStart).join("\n") });
        const prefixRe = ordered ? /^\d+\.\s+/ : /^-\s+/;
        blocks.push({ type: "list", ordered, items: rest.map((l) => l.replace(prefixRe, "")) });
        continue;
      }
    }

    blocks.push({ type: "paragraph", text: raw });
  }

  return blocks;
}

const URL_PATTERN = /(https?:\/\/[^\s)]+)/g;

// Renders **bold** spans, auto-links bare URLs, and turns single newlines
// into <br/> — the only inline markup the feed's descriptions use. No raw
// HTML is ever injected, so there's no sanitization surface to worry about.
export function renderInlineText(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];

  text.split("\n").forEach((line, lineIndex) => {
    if (lineIndex > 0) nodes.push(<br key={`${keyPrefix}-br-${lineIndex}`} />);

    line.split(/(\*\*[^*]+\*\*)/g).forEach((part, partIndex) => {
      const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
      const partKey = `${keyPrefix}-${lineIndex}-${partIndex}`;
      if (boldMatch) {
        nodes.push(<strong key={partKey}>{boldMatch[1]}</strong>);
        return;
      }

      part.split(URL_PATTERN).forEach((segment, segmentIndex) => {
        if (!segment) return;
        const segmentKey = `${partKey}-${segmentIndex}`;
        if (/^https?:\/\//.test(segment)) {
          nodes.push(
            <a
              key={segmentKey}
              href={segment}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all underline"
            >
              {segment}
            </a>
          );
        } else {
          nodes.push(<React.Fragment key={segmentKey}>{segment}</React.Fragment>);
        }
      });
    });
  });

  return nodes;
}
