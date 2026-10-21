/**
 * Parses the Hub's `descriptionHtml` (rich-text editor output) into a small,
 * allowlisted tree that `OpenRoleCard` renders as React elements.
 *
 * Like `utils/eventDescription.tsx`, this never hands markup to the DOM: no
 * `dangerouslySetInnerHTML`, so there is no sanitization surface. Text nodes are
 * escaped by React, only the tags below are ever produced, and a link keeps
 * nothing but an http(s) `href`. Anything else is unwrapped to its text, and
 * the contents of script-like elements are dropped entirely.
 *
 * Pure string parsing (no DOMParser) so it runs, and is tested, outside a
 * browser.
 */
import { sanitizeUrl } from "../../utils/sanitizeUrl";

export type DescriptionTag = "p" | "br" | "ul" | "ol" | "li" | "a" | "strong" | "em";

export type DescriptionNode =
  | { type: "text"; text: string }
  | { type: "element"; tag: DescriptionTag; href?: string; children: DescriptionNode[] };

type ElementNode = Extract<DescriptionNode, { type: "element" }>;

const TAG_ALIASES: Record<string, DescriptionTag> = {
  p: "p",
  br: "br",
  ul: "ul",
  ol: "ol",
  li: "li",
  a: "a",
  strong: "strong",
  b: "strong",
  em: "em",
  i: "em",
};

/** Elements whose contents are code or widgets, never prose: dropped whole. */
const DROPPED_ELEMENTS = new Set([
  "script",
  "style",
  "template",
  "iframe",
  "object",
  "noscript",
  "textarea",
  "svg",
  "math",
]);

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

const TOKEN_PATTERN = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>|([^<]+)|</g;
const HREF_PATTERN = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const isHex = entity[1] === "x" || entity[1] === "X";
      const codePoint = Number.parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return Number.isInteger(codePoint) && codePoint > 0 && codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

function toHref(attributes: string): string {
  const match = HREF_PATTERN.exec(attributes);
  const raw = match ? (match[1] ?? match[2] ?? match[3] ?? "") : "";
  return sanitizeUrl(decodeEntities(raw).trim());
}

export function parseDescriptionHtml(html: string): DescriptionNode[] {
  const root: ElementNode = { type: "element", tag: "p", children: [] };
  const stack: ElementNode[] = [root];
  let droppedTag: string | null = null;

  for (const match of html.matchAll(TOKEN_PATTERN)) {
    const [token, closing, rawName, attributes = "", text] = match;
    const name = rawName?.toLowerCase();

    // Inside a dropped element, skip everything up to its own closing tag.
    if (droppedTag) {
      if (closing && name === droppedTag) droppedTag = null;
      continue;
    }

    const parent = stack[stack.length - 1];

    if (text !== undefined || token === "<") {
      parent.children.push({ type: "text", text: decodeEntities(text ?? token) });
      continue;
    }
    if (!name) continue; // a comment

    if (DROPPED_ELEMENTS.has(name)) {
      if (!closing && !attributes.trim().endsWith("/")) droppedTag = name;
      continue;
    }

    const tag = TAG_ALIASES[name];
    if (!tag) continue; // unknown tag: unwrap, its text still arrives as text tokens

    if (closing) {
      const openIndex = stack.map((node) => node.tag).lastIndexOf(tag);
      if (openIndex > 0) stack.length = openIndex;
      continue;
    }

    if (tag === "br") {
      parent.children.push({ type: "element", tag, children: [] });
      continue;
    }

    const element: ElementNode = { type: "element", tag, children: [] };
    if (tag === "a") element.href = toHref(attributes);
    parent.children.push(element);
    stack.push(element);
  }

  return root.children;
}
