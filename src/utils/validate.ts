/** Input validation shared by the public write routes. */

export const MAX_TEXT_LENGTH = 2000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Narrow an untrusted value to a string. Anything that is not a string
 * (numbers, objects, File, null, undefined) becomes "", which the routes
 * already treat as a missing required field.
 */
export function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

/** True for anything `new URL()` accepts, including non-http schemes. */
export function isParsableUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the client-facing error for the first field (in insertion order)
 * longer than `max`, or `undefined` when every field fits.
 */
export function firstTooLong(
  fields: Readonly<Record<string, string>>,
  max = MAX_TEXT_LENGTH
): string | undefined {
  for (const [field, value] of Object.entries(fields)) {
    if (value.length > max) {
      return `Field '${field}' exceeds maximum length of ${max} characters`;
    }
  }
  return undefined;
}
