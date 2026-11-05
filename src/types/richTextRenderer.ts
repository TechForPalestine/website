import type { NotionRichText, RichTextSegment } from "./richText";

export interface RichTextRendererProps {
  richText: RichTextSegment[] | NotionRichText;
  className?: string;
  // Colour classes default to the live design system (Grove links and
  // emphasis, Stone code background). Callers on pages still using older
  // styling (IdeasWithTabs on /ideas, /community-call) pass their own.
  linkClassName?: string;
  mutedTextClassName?: string; // Notion "gray" text color
  accentTextClassName?: string; // Notion "red" text color
  codeClassName?: string; // inline code background
}
