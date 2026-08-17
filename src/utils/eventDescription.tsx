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

// The caller clamps this to 2 lines with CSS (`line-clamp-2`), which doesn't
// respect word boundaries the way this truncation does — if the text is
// longer than what actually fits, the browser re-truncates it a second time
// mid-word. Kept short enough to fit within 2 lines even on a narrow mobile
// card so line-clamp only ever acts as a safety net, not the real truncator.
const EXCERPT_MAX_LENGTH = 85;

// Strips this feed's markdown subset down to plain text: emphasis markers,
// link syntax (keeping the label), and line breaks collapsed to spaces.
function toPlainText(text: string): string {
  return text
    .replace(LINK_OR_URL_PATTERN, (match) => {
      const linkMatch = match.match(LINK_RE);
      return linkMatch ? linkMatch[1] : match;
    })
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

// A short plain-text teaser for the upcoming-events list, so a visitor gets a
// sense of what an event is about without opening its "More info" modal.
// Pulled from the first real paragraph — headings ("## Agenda"), rules, and
// lists don't make a readable teaser, so a description that's only those
// (rare) yields no excerpt rather than a confusing fragment.
export function getDescriptionExcerpt(description: string): string {
  const firstParagraph = parseEventDescription(description).find(
    (block) => block.type === "paragraph"
  );
  if (!firstParagraph) return "";

  const plain = toPlainText(firstParagraph.text);
  if (plain.length <= EXCERPT_MAX_LENGTH) return plain;

  const truncated = plain.slice(0, EXCERPT_MAX_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : EXCERPT_MAX_LENGTH)}…`;
}

// Matches a section label like "**OUR SPEAKERS**" or "**Panelists**" that
// introduces a speaker list — organizers write this fairly consistently, but
// the wording varies a little.
const SPEAKER_SECTION_LABEL_RE = /^\*\*(?:OUR\s+)?(?:SPEAKERS?|PANELISTS?|GUESTS?)\*\*$/i;
// Matches a speaker entry's name line, e.g. "**MOATH HAMZEH - Digital Creator
// & Activist**" — the bio (if any) follows on the next line of the same block.
const SPEAKER_NAME_LINE_RE = /^\*\*([^*]+?)\s*[-–—]\s*[^*]*\*\*$/;
const MAX_LISTED_SPEAKERS = 3;

// Organizers write speaker names in all caps for emphasis; that reads as
// shouting inline, so re-case anything fully uppercase to Title Case while
// leaving already mixed-case names untouched.
function toDisplayName(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed !== trimmed.toUpperCase()) return trimmed;
  return trimmed.toLowerCase().replace(/(^|[\s'-])([a-z])/g, (_match, sep, ch) => sep + ch.toUpperCase());
}

// Extracts speaker/panelist names from a "**OUR SPEAKERS**" section, if the
// description has one — a heuristic on top of this feed's loose convention,
// not a guaranteed field. Returns [] for the majority of events that don't
// use this format, so callers should fall back to a plain excerpt.
export function getEventSpeakers(description: string): string[] {
  const blocks = parseEventDescription(description);
  // The label often shares a block with a preceding "---" rule (joined by a
  // single newline rather than the blank line that would split them into
  // separate blocks), so check each line of a paragraph block rather than
  // requiring the whole block to be just the label.
  const sectionStart = blocks.findIndex(
    (block) =>
      block.type === "paragraph" &&
      block.text.split("\n").some((line) => SPEAKER_SECTION_LABEL_RE.test(line.trim()))
  );
  if (sectionStart === -1) return [];

  const speakers: string[] = [];
  for (let i = sectionStart + 1; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type !== "paragraph") break;

    const nameLine = block.text.split("\n")[0].trim();
    const match = nameLine.match(SPEAKER_NAME_LINE_RE);
    if (!match) break;

    speakers.push(toDisplayName(match[1]));
  }

  return speakers;
}

// "Mo Hamzeh, Taysir Matlob and 2 more" / "Mo Hamzeh and Taysir Matlob" /
// "Mo Hamzeh" — a readable list capped so a long panel doesn't run on.
export function formatSpeakerList(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length <= MAX_LISTED_SPEAKERS) {
    return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  }
  const shown = names.slice(0, MAX_LISTED_SPEAKERS).join(", ");
  return `${shown} and ${names.length - MAX_LISTED_SPEAKERS} more`;
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
