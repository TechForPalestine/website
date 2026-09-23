import React from "react";
import { Marked, type MarkedToken, type Token, type Tokens } from "marked";

// The Mattermost calendar plugin's event descriptions are free-form Markdown
// written by event organizers. This module used to hand-roll a block/inline
// parser for the small subset of syntax we'd actually observed in the feed,
// but real descriptions kept hitting cases it didn't cover — e.g. a "---"
// rule glued to the very next line with no blank line between them, or a
// bullet list immediately followed by a numbered list in the same paragraph.
// Both silently collapsed into a wall of plain text with the raw "-"/"##"/
// "---" markers still visible, instead of being rendered.
//
// `marked` (already a project dependency, previously unused) is a real
// CommonMark/GFM parser and handles both of those correctly. We only use its
// *lexer* — block and inline tokens — never its HTML renderer: building React
// elements straight from tokens keeps this free of any dangerouslySetInnerHTML
// / sanitization surface, same as the parser it replaces.
const markdown = new Marked({ gfm: true, breaks: true });

// Organizers sometimes leave a stray space just inside a "**bold**" span
// (e.g. "**NAME **- Title"), invisible in a plain-text editor but fatal to a
// spec-compliant parser: CommonMark requires a closing "**" to NOT be
// preceded by whitespace, so "**NAME **" never closes and renders as literal
// asterisks. Trim whitespace just inside "**...**" before parsing so this
// common typo still bolds as intended. Only touches spans that already have
// both markers on the same line, so "**Name**, author of **Title**" — two
// separate, already-valid spans — passes through unchanged.
function normalizeBoldSpacing(text: string): string {
  return text.replace(/\*\*([^*\n]*?)\*\*/g, (match, inner: string) => {
    const trimmed = inner.trim();
    return trimmed ? `**${trimmed}**` : match;
  });
}

export type DescriptionBlock = MarkedToken;

export function parseEventDescription(description: string): DescriptionBlock[] {
  const tokens = markdown.lexer(normalizeBoldSpacing(description)) as MarkedToken[];
  // "space" is just the blank-line gap between blocks; "def" is a link
  // reference definition ([label]: url) — neither has anything to render.
  return tokens.filter((token) => token.type !== "space" && token.type !== "def");
}

function hasTokens(token: Token): token is Token & { tokens: Token[] } {
  return "tokens" in token && Array.isArray((token as { tokens?: unknown }).tokens);
}

// Renders a span of inline tokens (bold, italic, links, line breaks, plain
// text) as React nodes. Falls back to a token's raw source for anything not
// explicitly handled below (e.g. code spans, strikethrough) so unfamiliar
// syntax degrades to visible text instead of vanishing or requiring raw HTML.
export function renderInlineTokens(tokens: Token[] | undefined, keyPrefix: string): React.ReactNode {
  if (!tokens) return null;

  return tokens.map((token, i) => {
    const key = `${keyPrefix}-${i}`;

    switch (token.type) {
      case "text":
        return hasTokens(token) ? (
          <React.Fragment key={key}>{renderInlineTokens(token.tokens, key)}</React.Fragment>
        ) : (
          <React.Fragment key={key}>{(token as Tokens.Text).text}</React.Fragment>
        );
      case "strong":
        return <strong key={key}>{renderInlineTokens((token as Tokens.Strong).tokens, key)}</strong>;
      case "em":
        return <em key={key}>{renderInlineTokens((token as Tokens.Em).tokens, key)}</em>;
      case "link": {
        const link = token as Tokens.Link;
        return (
          <a
            key={key}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {renderInlineTokens(link.tokens, key)}
          </a>
        );
      }
      case "br":
        return <br key={key} />;
      default:
        return <React.Fragment key={key}>{token.raw}</React.Fragment>;
    }
  });
}

// Plain-text equivalent of renderInlineTokens: strips markdown syntax down to
// its label text (a link keeps its label, not its URL) and turns line breaks
// into spaces. Used where markup can't be rendered, e.g. the excerpt teaser.
function inlineTokensToPlainText(tokens: Token[] | undefined): string {
  if (!tokens) return "";

  return tokens
    .map((token) => {
      switch (token.type) {
        case "text":
          return hasTokens(token)
            ? inlineTokensToPlainText(token.tokens)
            : (token as Tokens.Text).text;
        case "strong":
        case "em":
        case "link":
          return inlineTokensToPlainText(hasTokens(token) ? token.tokens : undefined);
        case "br":
          return " ";
        default:
          return "text" in token ? String((token as { text: string }).text) : "";
      }
    })
    .join("");
}

// The caller clamps this to 2 lines with CSS (`line-clamp-2`), which doesn't
// respect word boundaries the way this truncation does — if the text is
// longer than what actually fits, the browser re-truncates it a second time
// mid-word. Kept short enough to fit within 2 lines even on a narrow mobile
// card so line-clamp only ever acts as a safety net, not the real truncator.
const EXCERPT_MAX_LENGTH = 85;

// A short plain-text teaser for the upcoming-events list, so a visitor gets a
// sense of what an event is about without opening its "More info" modal.
// Pulled from the first real paragraph — headings ("## Agenda"), rules, and
// lists don't make a readable teaser, so a description that's only those
// (rare) yields no excerpt rather than a confusing fragment.
export function getDescriptionExcerpt(description: string): string {
  const firstParagraph = parseEventDescription(description).find(
    (block): block is Tokens.Paragraph => block.type === "paragraph"
  );
  if (!firstParagraph) return "";

  const plain = inlineTokensToPlainText(firstParagraph.tokens).replace(/\s+/g, " ").trim();
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
  const sectionStart = blocks.findIndex(
    (block) => block.type === "paragraph" && SPEAKER_SECTION_LABEL_RE.test(block.raw.trim())
  );
  if (sectionStart === -1) return [];

  const speakers: string[] = [];
  for (let i = sectionStart + 1; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type !== "paragraph") break;

    const nameLine = block.raw.split("\n")[0].trim();
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
