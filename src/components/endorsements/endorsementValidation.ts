// Client-side rules for the endorsement request form. They mirror
// /api/endorsement-request (src/pages/api/endorsement-request.ts) and are
// never weaker: the same email regex and URL parse, the same 2000-character
// cap, plus two stricter checks the server does not make (blank-only text
// counts as missing, and links must be http(s)).
import { isEmail, isParsableUrl, MAX_TEXT_LENGTH } from "../../utils/validate";

/** The request body, field for field. Do not rename: the API reads these keys. */
export type EndorsementRequest = {
  contactName: string;
  contactEmail: string;
  organizationName: string;
  organizationWebsite: string;
  campaignName: string;
  request: string;
  campaignPurpose: string;
  campaignLink: string;
  notableSupporters: string;
  isT4PProject: boolean;
};

export { MAX_TEXT_LENGTH };

type Rule = (value: string) => true | string;

export const requiredText =
  (message: string): Rule =>
  (value) =>
    value.trim() !== "" || message;

export const withinCap: Rule = (value) =>
  value.length <= MAX_TEXT_LENGTH ||
  `Keep this under ${MAX_TEXT_LENGTH.toLocaleString("en-US")} characters`;

export const validEmail: Rule = (value) =>
  isEmail(value.trim()) || "Enter an email address like name@example.org";

export const validLink: Rule = (value) => {
  const trimmed = value.trim();
  return (
    (/^https?:\/\//i.test(trimmed) && isParsableUrl(trimmed)) ||
    "Enter a full link starting with https://"
  );
};

/**
 * Turns a failed response into a message for the person filling in the form.
 * 400s carry the server's own validation message; anything else (the 403
 * Origin guard, a 500 from Notion) gets a plain explanation instead.
 */
export function submitErrorMessage(status: number, serverMessage: string | undefined): string {
  if (status === 400 && serverMessage) return serverMessage;
  return "Your request didn't reach us. That's a problem on our side, not with your answers.";
}
