const MAX_SLUG_LENGTH = 60;

// Lowercase kebab-case slug, no dependency. Truncates on a word boundary so
// URLs stay short and don't cut a word in half.
export function slugify(text: string): string {
  const full = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (full.length <= MAX_SLUG_LENGTH) return full;
  return full.slice(0, MAX_SLUG_LENGTH).replace(/-[^-]*$/, "");
}
