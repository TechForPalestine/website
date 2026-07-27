# Events Page Redesign — What's Changing and Why

## The problem

A few issues came up with the current events page:

- The two "highlighted" events shown for each category (In-Person, Community Calls, Book Club, etc.) are supposed to stand out, but often they're actually **past** events, styled the same bold way as upcoming ones. That makes it look like there's something coming up when there isn't.
- To find out what's actually happening next, you have to scroll through every single category and check each one — there's no single place that just shows "what can I go to soon."
- If a past event was recorded, there's no way to tell without clicking into it — you have to open each event one by one to find out.
- In-person events especially don't give you anything to *do* — no obvious button to register or add to your calendar.

## The fix

We're splitting the page into two clear zones:

**1. Upcoming Events (top of the page)**
One single list, combining every category, sorted by date — soonest first. Each event shows:
- The date, clearly (day of week + date), so it's easy to see how far out it is
- What kind of event it is (In-Person, Community Call, Book Club, etc.)
- One clear button to take action — Register, Join Online, or Add to Calendar

If nothing is upcoming right now, the page will say so, with a link down to past events instead of just looking empty.

**2. Past Events (below, organized by category like today)**
This becomes a clean archive — no more mixing "maybe upcoming, maybe not" cards. Just a straightforward list per category. Any event that has a recording available gets a small "▶ Watch recording" tag next to it, so you know at a glance which ones you can actually watch — no clicking around required.

## What this solves

| Complaint | How it's fixed |
|---|---|
| "The highlighted events look upcoming but they're mostly past" | Upcoming and past are now fully separated — nothing past ever gets upcoming-style treatment. |
| "I have to search through everything to find upcoming events" | One combined list at the top, sorted by date, across all categories. |
| "How do I know what recordings I can watch?" | Recorded events are tagged directly in the list. |
| "In-person events have no useful action" | Every upcoming event gets one clear button — register, join, or add to calendar. |

## Simple layout sketch

**Before (today):**
```
[In-Person Events]
  [Featured card] [Featured card]   <- might be past, looks upcoming
  - list of more events...

[Community Calls]
  [Featured card] [Featured card]
  - list of more events...

[Book Club]
  ...(repeat for every category)
```

**After (proposed):**
```
======================
 UPCOMING EVENTS
======================
 Thu 14 Aug   [In-Person]   Title of event         [Register]
 Sat 23 Aug   [Book Club]   Title of event          [Join]
 Wed 3 Sep    [Community]   Title of event    [Add to Calendar]
 ...(all upcoming events, every category, soonest first)

======================
 PAST EVENTS
======================
[In-Person Events]
 - Past event title            ▶ Watch recording
 - Past event title  (no recording available, no tag shown)

[Community Calls]
 - Past event title            ▶ Watch recording
 ...(same pattern for every category)
```

## Not changing

- No new calendar/data source — this uses information the site already has.
- The pop-up you get when clicking into an event stays the same.
- No changes to the older version of the events page (the one not currently being redesigned).
