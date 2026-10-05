# Homepage Hackathon Promo Modal — Design

**Date:** 2026-10-04
**Status:** Agreed in `/impeccable shape`; implementation plan at `docs/superpowers/plans/2026-10-04-hackathon-popup.md`
**Expires:** the component renders nothing from 2026-11-01 00:00 Barcelona time. Delete it and its assets after that.

## Goal

Send homepage visitors to the Tech for Palestine Hackathon @ MozFest (Saturday 31 October 2026, 9:00–18:00, Canodrom, Barcelona) ticket page, with a modal that looks like the hackathon site's own hero (https://hackathon2026.techforpalestine.org/).

## Decisions (and why)

| Decision         | Choice                                                                                                                                                                                                     | Why                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Placement        | Homepage only                                                                                                                                                                                              | Requested. Same reach as the January `SummitPopup` (#355, removed in #364).                                                                                    |
| Form             | Centred modal on desktop; bottom sheet below 768px                                                                                                                                                         | Requested modal. The sheet keeps the top of the page visible on phones (Google intrusive-interstitial guidance).                                               |
| Trigger          | 4 s after load                                                                                                                                                                                             | Lets the page paint first.                                                                                                                                     |
| Frequency        | Once ever: any dismissal (close button, Esc, backdrop, ticket click) is stored in `localStorage["t4p-hackathon-2026-popup"]`                                                                               | Requested.                                                                                                                                                     |
| Expiry           | Server renders nothing, and the client refuses to open, from `2026-11-01T00:00:00+01:00`                                                                                                                   | No one has to remember to take it down. The client check covers the 600 s edge cache on `/`.                                                                   |
| Newsletter popup | Hackathon wins the page load: once the modal has opened, `NewsletterPopup` unmounts (without recording a dismissal) and stays hidden until the next page load                                              | Never two popups in one visit.                                                                                                                                 |
| Visual identity  | Copied from the hackathon hero: red `#d92d27` label, notched Grove Green `#157a3e` bar, `#141414` square button, slanted photo with the red hand-drawn arrow passing behind people's heads, Outfit 800/400 | Requested. The red is a deliberate, component-scoped exception to DESIGN.md's One Green Rule: it is the partner event's identity, never used on our own pages. |
| Tech             | Astro component with native `<dialog>` + `showModal()` and a bundled `<script>`; pure logic in `src/utils/hackathonPopup.ts` (Vitest)                                                                      | Native focus containment, Esc and focus return; no React/MUI island; no inline `style=""` (CSP).                                                               |
| Ticket URL       | `https://secure.qgiv.com/for/eventstest/event/hackathon2026/`                                                                                                                                              | Confirmed by the user; it is the URL the hackathon site links to. Lives in one constant.                                                                       |
| Photo            | `workshop-circle.webp` (1600w) and `workshop-circle-small.webp` (640w) from the hackathon site, in `public/images/hackathon-2026/`                                                                         | The hackathon hero photo, same org.                                                                                                                            |

## Content

- Label: "Part of **Mozilla Festival**"
- Title (also the dialog's accessible name): "Tech for Palestine Hackathon @ MozFest"
- Lead: "A practical, one-day event for people who want to build ethical alternatives to complicit tech."
- Bar: WHEN "Saturday / October 31st", "9:00 - 18:00"; WHERE "Canodrom / Barcelona, Spain"; IN PARTNERSHIP WITH "Thaura.ai" (with the Thaura camel mark, white)
- Button: "Get your ticket" (+ visually hidden "(opens in a new tab)")
- Close button `aria-label`: "Close hackathon announcement"
- Photo alt: "Hackathon participants laughing and debating ideas around a long workshop table"

## States

- **Not rendered:** after the campaign end (server).
- **Rendered but never opened:** already dismissed, campaign ended (client clock), `<dialog>` unsupported, or no JS.
- **Opening:** 280 ms fade + rise (ease-out-quart). No motion under `prefers-reduced-motion`.
- **Open:** dimmed backdrop, page scroll locked, focus inside, close button first in tab order.
- **Dismissed:** stored; native `<dialog>` returns focus to where it was.
- **Photo fails:** photo column is removed; copy, bar and button still work.
- **Storage blocked:** modal still opens and closes; it just isn't remembered.

## Plausible events

| Event                       | Props                                                   | Fired when                  |
| --------------------------- | ------------------------------------------------------- | --------------------------- |
| `Hackathon Popup Shown`     | none                                                    | Modal opens                 |
| `Hackathon Popup Dismissed` | `reason: "close" \| "escape" \| "backdrop" \| "ticket"` | Modal closes for any reason |
| `Hackathon Ticket Click`    | none                                                    | Ticket button clicked       |
