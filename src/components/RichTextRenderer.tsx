import React from 'react';
import { Link, Typography } from '@mui/material';
import type { RichTextSegment, RichTextRendererProps, NotionRichText } from '../types/richText';

const RichTextRenderer: React.FC<RichTextRendererProps> = ({ richText, className = '' }) => {
    // Handle both direct array and Notion API response format
    const segments: RichTextSegment[] = Array.isArray(richText) 
        ? richText 
        : (richText as NotionRichText).rich_text || [];

    if (!segments || segments.length === 0) {
        return null;
    }

    // Combine all segments into a single text for processing, but track segment boundaries
    const combineSegments = (): { content: string, segmentMap: Map<number, RichTextSegment> } => {
        let combinedContent = '';
        const segmentMap = new Map<number, RichTextSegment>();
        
        segments.forEach((segment, index) => {
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
        const lines = content.split('\n');
        const processedElements: React.ReactNode[] = [];
        let currentList: { items: React.ReactNode[], indentLevel: number } | null = null;
        let listKey = 0;
        let currentPos = 0;

        const flushCurrentList = () => {
            if (currentList) {
                // Different bullet styles for different nesting levels
                const listStyles = ['disc', 'circle', 'square'];
                const listStyleType = listStyles[currentList.indentLevel % listStyles.length];
                
                processedElements.push(
                    <ul 
                        key={`list-${listKey++}`}
                        style={{
                            marginLeft: `${currentList.indentLevel * 20}px`,
                            marginTop: '4px',
                            marginBottom: '4px',
                            paddingLeft: '20px',
                            listStyleType
                        }}
                    >
                        {currentList.items.map((item, itemIndex) => (
                            <li key={itemIndex} style={{
                                position: 'relative',
                                marginBottom: '2px'
                            }}>
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
                    while (segmentEnd < lineText.length && segmentMap.get(startPos + segmentEnd) === segment) {
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
            if (line.trim() === '') {
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
                const bulletContent = renderLineSegments(text, currentPos + bulletMatch[1].length + bulletMatch[2].length + 1);
                
                // If we have a current list with the same indent level, add to it
                if (currentList && currentList.indentLevel === indentLevel) {
                    currentList.items.push(bulletContent);
                } else {
                    // Flush current list if indent level changes
                    flushCurrentList();
                    // Start new list
                    currentList = {
                        items: [bulletContent],
                        indentLevel
                    };
                }
            } else {
                // Regular line - flush any current list first
                flushCurrentList();
                const lineContent = renderLineSegments(line, currentPos);
                processedElements.push(
                    <div key={`line-${lineIndex}`} style={{ 
                        marginTop: lineIndex > 0 ? '8px' : '0' 
                    }}>
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

    const renderSegment = (segment: RichTextSegment, index: number, contentOverride?: string): React.ReactNode => {
        const { text, annotations, href } = segment;
        let content = contentOverride || text.content;

        // Build style object based on annotations
        const style: React.CSSProperties = {};
        const classes: string[] = [];

        if (annotations.bold) {
            style.fontWeight = 'bold';
        }
        if (annotations.italic) {
            style.fontStyle = 'italic';
        }
        if (annotations.strikethrough) {
            style.textDecoration = (style.textDecoration || '') + ' line-through';
        }
        if (annotations.underline) {
            style.textDecoration = (style.textDecoration || '') + ' underline';
        }
        if (annotations.code) {
            classes.push('font-mono bg-gray-100 px-1 py-0.5 rounded text-sm');
        }
        if (annotations.color && annotations.color !== 'default') {
            // Map Notion colors to Tailwind/CSS classes
            const colorMap: Record<string, string> = {
                'gray': 'text-gray-600',
                'brown': 'text-amber-800',
                'orange': 'text-orange-600',
                'yellow': 'text-yellow-600',
                'green': 'text-green-600',
                'blue': 'text-blue-600',
                'purple': 'text-purple-600',
                'pink': 'text-pink-600',
                'red': 'text-red-600',
            };
            if (colorMap[annotations.color]) {
                classes.push(colorMap[annotations.color]);
            }
        }

        // Determine if this is a link
        const linkUrl = text.link?.url || href;

        if (linkUrl) {
            return (
                <Link
                    key={index}
                    href={linkUrl}
                    target={linkUrl.startsWith('http') ? '_blank' : undefined}
                    rel={linkUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                    style={style}
                    className={classes.join(' ')}
                >
                    {content}
                </Link>
            );
        }

        // Regular text
        return (
            <span
                key={index}
                style={style}
                className={classes.join(' ')}
            >
                {content}
            </span>
        );
    };

    return (
        <Typography
            component="div"
            className={className}
          
        >
            {processContent()}
        </Typography>
    );
};

export default RichTextRenderer;