import type React from "react";
import type { NotionRichText, RichTextSegment } from "../../types/richText";
import type { RichTextRendererProps } from "../../types/richTextRenderer";

function RichTextRenderer({
  richText,
  className = "",
  linkClassName = "font-bold text-grove underline decoration-grove/40 underline-offset-4",
  mutedTextClassName = "text-ink-secondary",
  accentTextClassName = "font-bold text-grove",
  codeClassName = "bg-stone",
}: RichTextRendererProps) {
  // Handle both direct array and Notion API response format
  const segments: RichTextSegment[] = Array.isArray(richText)
    ? richText
    : (richText as NotionRichText).rich_text || [];

  if (!segments || segments.length === 0) {
    return null;
  }

  // Combine all segments into a single text for processing, but track segment boundaries
  const combineSegments = (): { content: string; segmentMap: Map<number, RichTextSegment> } => {
    let combinedContent = "";
    const segmentMap = new Map<number, RichTextSegment>();

    segments.forEach((segment) => {
      const startPos = combinedContent.length;
      combinedContent += segment.text.content;

      // Map each character position to its segment
      for (let i = startPos; i < combinedContent.length; i++) {
        segmentMap.set(i, segment);
      }
    });

    return { content: combinedContent, segmentMap };
  };

  // Process combined text to handle bullet points and mixed content
  const processContent = (): React.ReactNode[] => {
    const { content, segmentMap } = combineSegments();
    const lines = content.split("\n");
    const processedElements: React.ReactNode[] = [];
    let currentList: { items: React.ReactNode[]; indentLevel: number } | null = null;
    let listKey = 0;
    let currentPos = 0;

    const flushCurrentList = () => {
      if (currentList) {
        const indentClass =
          currentList.indentLevel === 0 ? "" : currentList.indentLevel === 1 ? "ml-5" : "ml-10";
        processedElements.push(
          <ul key={`list-${listKey++}`} className={`${indentClass} my-1 list-disc pl-5`}>
            {currentList.items.map((item, itemIndex) => (
              <li key={itemIndex} className="relative mb-0.5">
                {item}
              </li>
            ))}
          </ul>
        );
        currentList = null;
      }
    };

    const renderLineSegments = (lineText: string, startPos: number): React.ReactNode => {
      const lineSegments: React.ReactNode[] = [];
      let segmentStart = startPos;

      // Find all segments that contribute to this line
      for (let i = 0; i < lineText.length; i++) {
        const charPos = startPos + i;
        const segment = segmentMap.get(charPos);

        if (segment) {
          // Find the end of this segment's contribution to the current line
          let segmentEnd = i;
          while (
            segmentEnd < lineText.length &&
            segmentMap.get(startPos + segmentEnd) === segment
          ) {
            segmentEnd++;
          }

          const segmentText = lineText.slice(i, segmentEnd);
          lineSegments.push(renderSegment(segment, segmentStart, segmentText));
          i = segmentEnd - 1; // -1 because loop will increment
          segmentStart++;
        }
      }

      return lineSegments.length > 1 ? <>{lineSegments}</> : lineSegments[0];
    };

    lines.forEach((line, lineIndex) => {
      if (line.trim() === "") {
        flushCurrentList();
        processedElements.push(<br key={`br-${lineIndex}`} />);
        currentPos += 1; // account for \n
        return;
      }

      // Handle bullet points with various symbols and indentation
      const bulletMatch = line.match(/^(\s*)(•|◦|▪|‣|\*|-)\s+(.+)$/);
      if (bulletMatch) {
        const [, indentation, , text] = bulletMatch;
        const indentLevel = Math.floor(indentation.length / 4); // 4 spaces = 1 indent level

        // Render the bullet text with proper segment formatting
        const bulletContent = renderLineSegments(
          text,
          currentPos + bulletMatch[1].length + bulletMatch[2].length + 1
        );

        // If we have a current list with the same indent level, add to it
        if (currentList && currentList.indentLevel === indentLevel) {
          currentList.items.push(bulletContent);
        } else {
          // Flush current list if indent level changes
          flushCurrentList();
          // Start new list
          currentList = {
            items: [bulletContent],
            indentLevel,
          };
        }
      } else {
        // Regular line - flush any current list first
        flushCurrentList();
        const lineContent = renderLineSegments(line, currentPos);
        processedElements.push(
          <div key={`line-${lineIndex}`} className={lineIndex > 0 ? "mt-2" : ""}>
            {lineContent}
          </div>
        );
      }

      currentPos += line.length + 1; // +1 for \n
    });

    // Flush any remaining list
    flushCurrentList();

    return processedElements;
  };

  const renderSegment = (
    segment: RichTextSegment,
    index: number,
    contentOverride?: string
  ): React.ReactNode => {
    const { text, annotations, href } = segment;
    const content = contentOverride || text.content;

    // Annotations map to Tailwind classes, never a `style` prop: CSP bans
    // inline style attributes, and this component may be server-rendered.
    const classes: string[] = [];

    if (annotations.bold) classes.push("font-bold");
    if (annotations.italic) classes.push("italic");
    if (annotations.strikethrough && annotations.underline) {
      classes.push("[text-decoration-line:underline_line-through]");
    } else if (annotations.strikethrough) {
      classes.push("line-through");
    } else if (annotations.underline) {
      classes.push("underline");
    }
    if (annotations.code) {
      classes.push(`font-mono ${codeClassName} px-1 py-0.5 rounded text-sm`);
    }
    // DESIGN.md's One Green Rule: only Notion's gray (de-emphasis) and red
    // (emphasis) carry meaning on the site. Other Notion colours inherit the
    // surrounding text colour rather than introducing off-system accents.
    if (annotations.color === "gray") classes.push(mutedTextClassName);
    if (annotations.color === "red") classes.push(accentTextClassName);

    // Determine if this is a link
    const linkUrl = text.link?.url || href;

    if (linkUrl) {
      return (
        <a
          key={index}
          href={linkUrl}
          target={linkUrl.startsWith("http") ? "_blank" : undefined}
          rel={linkUrl.startsWith("http") ? "noopener noreferrer" : undefined}
          className={`${linkClassName} hover:underline ${classes.join(" ")}`}
        >
          {content}
        </a>
      );
    }

    // Regular text
    return (
      <span key={index} className={classes.join(" ") || undefined}>
        {content}
      </span>
    );
  };

  return <div className={className}>{processContent()}</div>;
}

export default RichTextRenderer;
