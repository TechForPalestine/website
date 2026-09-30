import { reportError } from "../lib/report-error";

export const EO_MEMBERS_LIST_URL =
  "https://emailoctopus.com/api/1.6/lists/8adc2ed4-f798-11ef-b60f-115427c25a1c/contacts";

/** `[redacted]@domain` — the only form of an email address allowed in logs. */
export function redactEmail(email: string): string {
  return `[redacted]@${email.split("@")[1]}`;
}

export interface SubscribeMemberInput {
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly tag: string;
  readonly apiKey: string;
  /** Sentry context label reported when EmailOctopus answers with a non-2xx status. */
  readonly context: string;
}

/**
 * Subscribes a contact to the members list. A non-2xx answer is reported and
 * swallowed; a network failure rejects so the caller decides how to report it.
 */
export async function subscribeMember({
  email,
  firstName,
  lastName,
  tag,
  apiKey,
  context,
}: SubscribeMemberInput): Promise<void> {
  const res = await fetch(EO_MEMBERS_LIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      email_address: email,
      fields: { FirstName: firstName, LastName: lastName },
      tags: [tag],
      status: "SUBSCRIBED",
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    reportError(new Error(`EmailOctopus failed: ${res.status}`), {
      context,
      email: redactEmail(email),
      status: res.status,
      body: data,
    });
  }
}
