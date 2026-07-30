// Matches youtube.com/watch?v=, youtube.com/live/, youtube.com/embed/, and
// youtu.be/ links, capturing the 11-character video ID from whichever form
// the feed's X-RECORDING-URL happens to use.
const YOUTUBE_ID_PATTERN =
  /(?:youtube\.com\/(?:watch\?v=|live\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

// YouTube doesn't 404 a missing maxresdefault.jpg — it serves a 120x90 grey
// placeholder with a 200 status, so a real HD thumbnail has to be requested
// first and checked for that exact size once loaded (see EventPreviewImage).
// hqdefault.jpg is the fallback since it's guaranteed to exist for every
// video, even though (unlike maxresdefault) it's rendered on an old 4:3
// canvas and pads a modern 16:9 custom thumbnail with black bars.
const PLACEHOLDER_THUMBNAIL_WIDTH = 120;

export interface YoutubeThumbnailSources {
  primary: string;
  fallback: string;
}

export function youtubeThumbnailSources(url: string): YoutubeThumbnailSources | null {
  const match = url.match(YOUTUBE_ID_PATTERN);
  if (!match) return null;
  const id = match[1];
  return {
    primary: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
    fallback: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
  };
}

export function isPlaceholderThumbnail(img: HTMLImageElement): boolean {
  return img.naturalWidth === PLACEHOLDER_THUMBNAIL_WIDTH;
}
