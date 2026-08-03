import React from "react";

// The Mattermost calendar plugin's event descriptions use a small, consistent
// subset of Markdown: "## " headings, "---" rules, "- "/"1. " lists, blank-line
// paragraphs, **bold**, *italic* (sometimes wrapping a link), [label](url)
// links, and bare URLs. This isn't full CommonMark support — just what's
// actually observed in the feed.
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

const EMPHASIS_PATTERN = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
const BOLD_RE = /^\*\*([^*]+)\*\*$/;
const ITALIC_RE = /^\*([^*]+)\*$/;

const LINK_OR_URL_PATTERN = /(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s)]+)/g;
const LINK_RE = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/;

// Auto-links [label](url) markdown links and bare URLs within a span of text
// that's already been stripped of ** / * emphasis markers.
function renderLinksAndUrls(text: string, keyPrefix: string): React.ReactNode[] {
  return text
    .split(LINK_OR_URL_PATTERN)
    .filter(Boolean)
    .map((part, i) => {
      const key = `${keyPrefix}-l${i}`;
      const linkMatch = part.match(LINK_RE);
      if (linkMatch) {
        return (
          <a key={key} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="underline">
            {linkMatch[1]}
          </a>
        );
      }
      if (/^https?:\/\//.test(part)) {
        return (
          <a key={key} href={part} target="_blank" rel="noopener noreferrer" className="break-all underline">
            {part}
          </a>
        );
      }
      return <React.Fragment key={key}>{part}</React.Fragment>;
    });
}

// Renders **bold**/*italic* spans (a link can appear nested inside either,
// e.g. "*Summary taken from ... [Just World Books](url)*"), auto-links bare
// URLs and [label](url) links, and turns single newlines into <br/>. No raw
// HTML is ever injected, so there's no sanitization surface to worry about.
export function renderInlineText(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];

  text.split("\n").forEach((line, lineIndex) => {
    if (lineIndex > 0) nodes.push(<br key={`${keyPrefix}-br-${lineIndex}`} />);

    line
      .split(EMPHASIS_PATTERN)
      .filter(Boolean)
      .forEach((part, partIndex) => {
        const key = `${keyPrefix}-${lineIndex}-${partIndex}`;

        const boldMatch = part.match(BOLD_RE);
        if (boldMatch) {
          nodes.push(<strong key={key}>{renderLinksAndUrls(boldMatch[1], key)}</strong>);
          return;
        }

        const italicMatch = part.match(ITALIC_RE);
        if (italicMatch) {
          nodes.push(<em key={key}>{renderLinksAndUrls(italicMatch[1], key)}</em>);
          return;
        }

        nodes.push(...renderLinksAndUrls(part, key));
      });
  });

  return nodes;
}
