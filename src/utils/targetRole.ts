/**
 * The open role a visitor picked on /volunteer, carried to the Hub invite.
 *
 * A role card links to `/membership?role=<id>`. The membership page remembers
 * the id for the tab (sessionStorage, so it survives the visitor clicking away
 * and coming back), and the Qgiv completion handler sends it alongside the
 * transaction id. /api/membership-complete passes it to the Hub invite as
 * `targetRoleId`.
 *
 * The id is a client-supplied hint, never access control: the Hub ignores an
 * unknown, closed or non-volunteer role and still creates the invite. The
 * format check here only keeps junk out of the request.
 */

export const TARGET_ROLE_PARAM = "role";
const STORAGE_KEY = "t4p:targetRoleId";

/** Hub ids are cuid/uuid-like; nothing legitimate needs other characters. */
const ROLE_ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;

/** The role id if it is well-formed, otherwise "". */
export function parseTargetRoleId(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return ROLE_ID_PATTERN.test(trimmed) ? trimmed : "";
}

/** Where a role card's "Become a member" button points. */
export function membershipUrlForRole(roleId: string): string {
  const id = parseTargetRoleId(roleId);
  if (!id) return "/membership";
  return `/membership?${new URLSearchParams({ [TARGET_ROLE_PARAM]: id }).toString()}`;
}

function roleFromSearch(search: string): string {
  return parseTargetRoleId(new URLSearchParams(search).get(TARGET_ROLE_PARAM));
}

// Storage can be unavailable or throw (Safari private mode, blocked cookies),
// and losing the role must never break the membership flow.
function readStored(storage: Storage | undefined): string {
  try {
    return parseTargetRoleId(storage?.getItem(STORAGE_KEY));
  } catch {
    return "";
  }
}

/** `window.sessionStorage`, or undefined where reading it throws or there is no window. */
export function tabStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
}

/** Saves the role in `search` (e.g. `location.search`) for this tab, if any. */
export function rememberTargetRole(search: string, storage: Storage | undefined): void {
  const id = roleFromSearch(search);
  if (!id) return;
  try {
    storage?.setItem(STORAGE_KEY, id);
  } catch {
    // see readStored
  }
}

/** The role to send: the one in the current URL, else the remembered one. */
export function currentTargetRole(search: string, storage: Storage | undefined): string {
  return roleFromSearch(search) || readStored(storage);
}

/** Forgets the remembered role once it has been sent with a membership. */
export function clearTargetRole(storage: Storage | undefined): void {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    // see readStored
  }
}
