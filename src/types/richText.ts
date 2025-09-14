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
    type: 'text';
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
}