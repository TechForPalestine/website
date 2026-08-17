export interface RichTextAnnotations {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  underline: boolean;
  code: boolean;
  color: string;
}

export interface RichTextLink {
  url: string;
}

export interface RichTextText {
  content: string;
  link: RichTextLink | null;
}

export interface RichTextSegment {
  type: "text";
  text: RichTextText;
  annotations: RichTextAnnotations;
  plain_text: string;
  href: string | null;
}

export interface NotionRichText {
  rich_text: RichTextSegment[];
}

export interface RichTextRendererProps {
  richText: RichTextSegment[] | NotionRichText;
  className?: string;
  // Color classes default to the new design system's tokens (brand/ink),
  // since that's this component's original caller (FAQSection, on
  // /faq-new). Legacy callers (FAQAccordion on /faq, IdeasWithTabs on
  // /ideas) pass their own page's colors instead — without this, Notion's
  // "red" text and every link would render in the new brand palette
  // regardless of which page's design language it's embedded in.
  linkClassName?: string;
  mutedTextClassName?: string; // Notion "gray" text color
  accentTextClassName?: string; // Notion "red" text color
  codeClassName?: string; // inline code background
}
