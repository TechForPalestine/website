import { useState } from "react";
import type { EventItem } from "../../store/eventsClient";
import { previewImageSources } from "../../utils/eventSections";
import { isPlaceholderThumbnail } from "../../utils/youtubeThumbnail";

const GENERIC_FALLBACK_IMAGE = "/images/default.jpg";

interface EventPreviewImageProps {
  event: EventItem;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  width?: number;
  height?: number;
  // When set, a failed load calls this instead of swapping in the generic
  // default image, so the caller can render its own fallback (Upcoming never
  // shows default.jpg).
  onUnavailable?: () => void;
}

// Shared by both events pages (the legacy MUI page imports this directly
// too — plain <img>, no MUI-specific behavior needed).
//
// For a YouTube-backed preview (any event with a recording/stream link),
// maxresdefault.jpg doesn't
// 404 when missing — YouTube serves a 120x90 grey placeholder with a 200
// status — so failure is detected on load via its fixed size, not onError,
// and only then do we drop to the guaranteed-to-exist hqdefault.jpg.
export function EventPreviewImage({
  event,
  alt,
  className,
  loading = "lazy",
  width,
  height,
  onUnavailable,
}: EventPreviewImageProps) {
  const sources = previewImageSources(event);
  const [src, setSrc] = useState(sources.primary);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (sources.fallback && src === sources.primary && isPlaceholderThumbnail(e.currentTarget)) {
      setSrc(sources.fallback);
    }
  };

  const handleError = () => {
    if (onUnavailable) {
      onUnavailable();
      return;
    }
    setSrc(GENERIC_FALLBACK_IMAGE);
  };

  return (
    <img
      key={sources.primary}
      src={src}
      alt={alt}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
      width={width}
      height={height}
      loading={loading}
      decoding="async"
    />
  );
}
