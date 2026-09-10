export interface AboutYouData {
  name: string;
  email: string;
}

/**
 * Mirrors the email format `/api/membership-complete.ts` validates server-side,
 * so a value accepted here is never rejected once it reaches the API.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AboutYouValidation {
  nameError: string;
  emailError: string;
}

/** Validates trimmed name/email, matching AboutYouStep's on-submit-only behavior. */
export function validateAboutYou(name: string, email: string): AboutYouValidation {
  const nameError = name.trim().length === 0 ? "Please enter your name." : "";
  const emailError = EMAIL_PATTERN.test(email.trim())
    ? ""
    : "Please enter a valid email address.";
  return { nameError, emailError };
}
