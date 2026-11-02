import { reportError } from "./report-error";
import { assignNavLabelVariant } from "./navAssignment";
import { NAV_LABEL_EXPERIMENT } from "../utils/navLabelExperiment";

// Server-side record of a membership whose payment Qgiv has confirmed. Unlike the browser's
// "Membership-complete" event it cannot be blocked by an ad blocker or lost if the Plausible
// script fails, and it is only sent after verification, so it cannot be forged.
//
// The visitor's User-Agent and IP are forwarded the same way /api/pipe does, so Plausible
// joins the event to that visitor's existing visit. It carries the nav label variant the
// visitor was shown (recomputed from the same request, see src/lib/navAssignment.ts).

export const MEMBERSHIP_VERIFIED_EVENT = "Membership Verified";
const PLAUSIBLE_EVENT_API = "https://plausible.io/api/event";
const PLAUSIBLE_DOMAIN = "techforpalestine.org";
const FALLBACK_PAGE = "/membership";

/** The page the payment was made on, from a same-origin Referer, else /membership. */
export function membershipPageUrl(request: Request): string {
  const origin = new URL(request.url).origin;
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const url = new URL(referer);
      if (url.origin === origin) return `${url.origin}${url.pathname}`;
    } catch {
      // Malformed Referer: fall through to the default page.
    }
  }
  return `${origin}${FALLBACK_PAGE}`;
}

export interface MembershipVerifiedInput {
  request: Request;
  locals: unknown;
  /** Membership tier tag from MEMBERSHIP_FORMS, e.g. "member". Not personal data. */
  tier: string;
  fetchImpl?: typeof fetch;
}

export async function sendMembershipVerified({
  request,
  locals,
  tier,
  fetchImpl = fetch,
}: MembershipVerifiedInput): Promise<void> {
  try {
    const variant = await assignNavLabelVariant(request, locals);
    const props: Record<string, string> = { membership_tier: tier };
    if (variant) {
      props.experiment = NAV_LABEL_EXPERIMENT;
      props.variant = variant;
    }

    const headers = new Headers({ "Content-Type": "application/json" });
    const userAgent = request.headers.get("user-agent");
    if (userAgent) headers.set("User-Agent", userAgent);
    const ip = request.headers.get("cf-connecting-ip");
    if (ip) headers.set("X-Forwarded-For", ip);

    const response = await fetchImpl(PLAUSIBLE_EVENT_API, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: MEMBERSHIP_VERIFIED_EVENT,
        url: membershipPageUrl(request),
        domain: PLAUSIBLE_DOMAIN,
        props,
      }),
    });
    if (!response.ok) {
      reportError(
        new Error(`Plausible rejected ${MEMBERSHIP_VERIFIED_EVENT}: ${response.status}`),
        {
          context: "membership-complete analytics",
          status: response.status,
        }
      );
    }
  } catch (error) {
    // Analytics must never affect the membership itself.
    reportError(error, { context: "membership-complete analytics" });
  }
}
