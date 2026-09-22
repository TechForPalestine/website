/**
 * Server-side verification of Qgiv transactions.
 *
 * `/api/membership-complete` and `/api/donation-complete` grant real
 * privileges — a paid Hub invite and a mailing-list write. Both were once
 * gated only by an `Origin` header, which any HTTP client sets at will, so
 * the caller could name any email address and any tier. Everything those
 * endpoints act on now comes from Qgiv's own record of the transaction.
 *
 * The form allowlists live here, in one auditable place, and are deliberately
 * split per endpoint: a real $5 donation id must not be replayable against
 * the membership endpoint to obtain a paid-tier Hub invite.
 */

export const QGIV_API_BASE = "https://secure.qgiv.com/admin/api/reporting/transactions";

/** Qgiv ids are numeric today; the pattern stays permissive but bounded, since
 * this value is interpolated into the request path. */
const TRANSACTION_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** Qgiv also returns "Declined" and "Error" for real transactions. */
export const ACCEPTED_STATUS = "Accepted";

export const MEMBERSHIP_FORMS: Record<string, { tag: string; hubInvite: boolean }> = {
  // Pilot Membership Form
  "1116610": { tag: "member", hubInvite: true },
  // Supporting Members Form — funds the work, but does not join teams or the
  // member chat, so deliberately no Hub invite.
  "1158315": { tag: "Supporting Member", hubInvite: false },
};

export const DONATION_FORMS: Record<string, { tag: string }> = {
  // T4P Website Donation Form
  "1094620": { tag: "donor" },
};

export function isValidTransactionId(value: unknown): value is string {
  return typeof value === "string" && TRANSACTION_ID_PATTERN.test(value);
}
