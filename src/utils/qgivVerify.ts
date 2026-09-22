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

import { getEnv } from "./getEnv";

export const QGIV_API_BASE = "https://secure.qgiv.com/admin/api/reporting/transactions";

/** Qgiv ids are numeric today; the pattern stays permissive but bounded, since
 * this value is interpolated into the request path. */
const TRANSACTION_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** Qgiv also returns "Declined" and "Error" for real transactions. */
export const ACCEPTED_STATUS = "Accepted";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const VERIFY_TIMEOUT_MS = 5000;

export interface VerifiedTransaction {
  id: string;
  formId: string;
  email: string;
  firstName: string;
  lastName: string;
  amount: string;
  optedIn: boolean;
}

export type VerifyFailure =
  | "invalid-id"
  | "not-configured"
  | "lookup-failed"
  | "not-accepted"
  | "form-not-allowed"
  | "no-email";

export type VerifyResult =
  | { ok: true; transaction: VerifiedTransaction }
  | { ok: false; reason: VerifyFailure };

/**
 * Qgiv wraps the transaction differently across its reporting routes, so walk
 * the payload for the record rather than assuming a shape. Requiring the id to
 * match is what stops a wrapper response smuggling a different transaction
 * through.
 */
function findTransaction(value: unknown, id: string): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findTransaction(item, id);
      if (found) return found;
    }
    return null;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("formId" in record && "transStatus" in record && String(record.id) === id) {
      return record;
    }
    for (const nested of Object.values(record)) {
      const found = findTransaction(nested, id);
      if (found) return found;
    }
  }

  return null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

export async function verifyQgivTransaction(
  transactionId: unknown,
  allowedFormIds: readonly string[],
  locals: App.Locals
): Promise<VerifyResult> {
  if (!isValidTransactionId(transactionId)) return { ok: false, reason: "invalid-id" };

  const token = getEnv("QGIV_API_TOKEN", locals);
  if (!token) return { ok: false, reason: "not-configured" };

  let payload: unknown;
  try {
    const response = await fetch(`${QGIV_API_BASE}/${transactionId}.json`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }).toString(),
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    });
    if (!response.ok) return { ok: false, reason: "lookup-failed" };
    payload = await response.json();
  } catch {
    return { ok: false, reason: "lookup-failed" };
  }

  const record = findTransaction(payload, transactionId);
  if (!record) return { ok: false, reason: "lookup-failed" };

  if (asString(record.transStatus) !== ACCEPTED_STATUS) {
    return { ok: false, reason: "not-accepted" };
  }

  const formId = asString(record.formId);
  if (!allowedFormIds.includes(formId)) return { ok: false, reason: "form-not-allowed" };

  // Anonymous, offline, or imported transactions can carry no contact email
  // at all. Acting on an empty string would POST it unconditionally to the
  // Hub invite API and EmailOctopus, so treat a missing/malformed email as a
  // verification failure rather than a success with an empty field.
  const email = asString(record.contactEmail);
  if (!EMAIL_PATTERN.test(email)) return { ok: false, reason: "no-email" };

  return {
    ok: true,
    transaction: {
      id: transactionId,
      formId,
      email,
      firstName: asString(record.firstName),
      lastName: asString(record.lastName),
      amount: asString(record.value),
      optedIn: record.optedIn === true || record.optedIn === "y",
    },
  };
}
