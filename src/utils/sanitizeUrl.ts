/** Only allow http: and https: URLs to prevent javascript: / data: XSS vectors. */
export function sanitizeUrl(url: string | undefined): string {
  if (!url) return "";
  try {
    const parsed = new URL(url, "https://placeholder.invalid");
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return url;
  } catch {
    // malformed URL
  }
  return "";
}
