import { useEffect } from "react";
import { primaryEventLink } from "../../store/eventsClient";
import { displayTitle } from "../../utils/eventSections";
import { parseEventDescription, renderInlineText } from "../../utils/eventDescription";
import { ArrowRight, CloseIcon, parseDateParts, type SelectedEvent } from "./eventsShared";

function EventDescription({ text }: { text: string }) {
  const blocks = parseEventDescription(text);

  return (
    <div className="ts-body flex flex-col gap-3 break-words text-ink-secondary">
      {blocks.map((block, i) => {
        if (block.type === "hr") return <hr key={i} className="border-ink-divider" />;
        if (block.type === "heading") {
          return (
            <h4 key={i} className="ts-eyebrow text-ink">
              {renderInlineText(block.text, `h-${i}`)}
            </h4>
          );
        }
        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag key={i} className={block.ordered ? "list-decimal pl-5" : "list-disc pl-5"}>
              {block.items.map((item, j) => (
                <li key={j}>{renderInlineText(item, `l-${i}-${j}`)}</li>
              ))}
            </ListTag>
          );
        }
        return <p key={i}>{renderInlineText(block.text, `p-${i}`)}</p>;
      })}
    </div>
  );
}

interface EventModalProps {
  selected: SelectedEvent;
  onClose: () => void;
}

export function EventModal({ selected, onClose }: EventModalProps) {
  const { event, isPast } = selected;
  const { day, month, year, full } = parseDateParts(event.date);
  const { link: infoLink, label: infoLabel } = primaryEventLink(event, isPast);
  const title = displayTitle(event);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    // This site's pages scroll via Lenis (window.__lenis), which intercepts
    // wheel/touch events itself — CSS `overflow: hidden` on html/body alone
    // doesn't stop it. Stop Lenis while the modal is open, same pattern as
    // ProjectDrawer.tsx.
    const lenis = (window as any).__lenis;
    lenis?.stop();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      lenis?.start();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[20px] bg-page"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div data-lenis-prevent className="overflow-y-auto overscroll-y-contain">
          <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-sand">
            <img
              src={event.image}
              alt={title}
              className="h-full w-full object-contain"
              loading="lazy"
              decoding="async"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-page text-ink transition-colors duration-150 hover:bg-brand hover:text-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="flex flex-col gap-4 p-6 min-[640px]:p-8">
            <time dateTime={event.date}>
              <span className="ts-heading block leading-none text-brand">{day}</span>
              <span className="ts-overline block text-ink-secondary">
                {month} {year}
              </span>
            </time>

            <h2 className="ts-subheading text-ink">{title}</h2>

            <p className="ts-body-small text-ink-secondary">
              {full}
              {event.time && <span> · {event.time}</span>}
            </p>

            {event.description && <EventDescription text={event.description} />}
          </div>
        </div>

        {(infoLink || event.locationLink) && (
          <div className="flex shrink-0 flex-wrap items-center gap-4 border-t border-ink-divider p-6 min-[640px]:p-8">
            {infoLink && (
              <a
                href={infoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="ts-label inline-flex min-h-[44px] items-center gap-2 rounded-pill bg-brand px-6 py-3.5 text-page transition-colors duration-150 hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98]"
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
                className="ts-label inline-flex items-center text-ink-secondary transition-colors duration-150 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                View location
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
