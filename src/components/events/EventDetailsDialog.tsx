import { useState } from "react";
import { Dialog, DialogContent, DialogActions } from "@mui/material";
import { primaryEventLink } from "../../store/eventsClient";
import { displayTitle } from "../../utils/eventSections";
import { copyEventLink } from "../../utils/copyAnchorLink";
import { parseEventDescription, renderInlineTokens } from "../../utils/eventDescription";
import { EventPreviewImage } from "./EventPreviewImage";
import { ArrowRight, CloseIcon, LinkIcon, useEventDate, type SelectedEvent } from "./EventsShared";
import {
  TS_BODY_SIZE,
  TS_BODY_SMALL_SIZE,
  TS_CAPTION_SIZE,
  TS_EYEBROW_SIZE,
  TS_HEADING_SIZE,
  TS_LABEL_SIZE,
  TS_OVERLINE_SIZE,
  TS_SUBHEADING_SIZE,
} from "./typeScale";

const EVENT_COPY_FEEDBACK_MS = 2500;

// This page's own accent palette — same structure/content as the new-design
// events page, deliberately kept on this site's original colors rather than
// the new page's cream/rose design tokens. MUI is retained only for the
// modal Dialog (focus trap, escape handling, scroll lock); everything else
// is plain markup so the page shares the site's font and visual weight.
//
// Colors are expressed as Tailwind arbitrary values so they stay literal:
// red #EA4335 (accent), #C5341F (hover), green #168039 (past-card links).
const PRIMARY_BUTTON_CLASSES = `inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#EA4335] px-6 py-2.5 font-medium text-white transition-colors duration-150 hover:bg-[#C5341F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4335] active:scale-[0.98] ${TS_LABEL_SIZE}`;

function EventDescription({ text }: { text: string }) {
  const blocks = parseEventDescription(text);

  return (
    <div className="flex flex-col gap-3 break-words">
      {blocks.map((block, i) => {
        if (block.type === "hr") {
          return <hr key={i} className="border-gray-200" />;
        }
        if (block.type === "heading") {
          return (
            <p key={i} className={`font-medium text-gray-900 ${TS_EYEBROW_SIZE}`}>
              {renderInlineTokens(block.tokens, `h-${i}`)}
            </p>
          );
        }
        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={i}
              className={`${block.ordered ? "list-decimal pl-5" : "list-disc pl-5"} ${TS_BODY_SIZE}`}
            >
              {block.items.map((item, j) => (
                <li key={j} className="text-gray-600">
                  {renderInlineTokens(item.tokens, `l-${i}-${j}`)}
                </li>
              ))}
            </ListTag>
          );
        }
        return (
          <p key={i} className={`text-gray-600 ${TS_BODY_SIZE}`}>
            {"tokens" in block ? renderInlineTokens(block.tokens, `p-${i}`) : block.raw}
          </p>
        );
      })}
    </div>
  );
}

export function EventDetailsDialog({
  selected,
  onClose,
}: {
  selected: SelectedEvent | null;
  onClose: () => void;
}) {
  // The body is split out so its hooks aren't called conditionally — `selected`
  // toggles between null and set every time the dialog opens.
  if (!selected) return null;
  return <EventDetailsDialogBody selected={selected} onClose={onClose} />;
}

function EventDetailsDialogBody({
  selected,
  onClose,
}: {
  selected: SelectedEvent;
  onClose: () => void;
}) {
  const { event, isPast } = selected;
  const {
    parts: { day, month, year },
    weekday,
    time,
    isoDate,
  } = useEventDate(event);
  const { link: infoLink, label: infoLabel } = primaryEventLink(event, isPast);
  const title = displayTitle(event);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const ok = await copyEventLink();
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), EVENT_COPY_FEEDBACK_MS);
  };

  // MUI Dialog is kept for its focus trap, escape handling, and scroll lock;
  // everything inside the paper is plain markup.
  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: "16px" } } }}
    >
      {/* No fixed aspect ratio or box height here: YouTube thumbnails are
          16:9, but flyer-style previews are often taller. Forcing w-full
          with a height cap on the box clips the image via overflow-hidden
          instead of shrinking it — cap only the img's own max-height and
          let width follow the ratio, so the box sizes itself exactly to
          the (uncropped) rendered image. */}
      <div className="relative flex items-center justify-center bg-gray-100">
        <EventPreviewImage
          event={event}
          alt={title}
          className="max-h-[70vh] w-auto max-w-full object-contain"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm transition-colors duration-150 hover:bg-[#EA4335] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4335]"
        >
          <CloseIcon />
        </button>
      </div>
      <DialogContent className="flex flex-col gap-4">
        <time dateTime={isoDate}>
          <span
            className={`block font-medium leading-none tracking-tight text-[#EA4335] ${TS_HEADING_SIZE}`}
          >
            {day}
          </span>
          <span
            className={`mt-1 block font-medium uppercase tracking-wide text-gray-500 ${TS_OVERLINE_SIZE}`}
          >
            {month} {year}
          </span>
        </time>

        <h2 className={`font-bold tracking-tight text-gray-900 ${TS_SUBHEADING_SIZE}`}>
          {title}
        </h2>

        <div className="flex items-center justify-between gap-4">
          {/* Day/month/year is already shown above in the date badge — this
              line adds the info the badge doesn't carry (weekday, time)
              instead of repeating the same date. */}
          <p className={`text-gray-500 ${TS_BODY_SMALL_SIZE}`}>
            {weekday}
            {time && <span> · {time}</span>}
            {event.location && <span> · {event.location}</span>}
          </p>

          <span className="relative inline-flex shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className={`inline-flex items-center gap-1.5 text-[#EA4335] underline underline-offset-4 transition-colors duration-150 hover:text-[#C5341F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4335] ${TS_LABEL_SIZE}`}
            >
              <LinkIcon size={16} />
              Share
            </button>
            {copied && (
              <span
                role="status"
                className={`absolute right-0 top-full mt-2 whitespace-nowrap rounded-full bg-gray-900 px-3 py-1.5 text-white ${TS_CAPTION_SIZE}`}
              >
                Event URL copied to clipboard successfully
              </span>
            )}
          </span>
        </div>

        {event.description && <EventDescription text={event.description} />}
      </DialogContent>
      {(infoLink || event.locationLink) && (
        <DialogActions className="flex-wrap items-center gap-4 border-t border-gray-200 px-6 py-4">
          {infoLink && (
            <a
              href={infoLink}
              target="_blank"
              rel="noopener noreferrer"
              className={PRIMARY_BUTTON_CLASSES}
            >
              {infoLabel}
              <ArrowRight size={16} />
            </a>
          )}
          {event.locationLink && (
            <a
              href={event.locationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gray-600 underline-offset-4 transition-colors duration-150 hover:text-gray-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4335]"
            >
              View location
            </a>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}
