import { expect, test } from "vitest";
import { CAMPAIGN_ENDS_AT } from "./challengePopup";
import { readReportPopupState, shouldShowReportPopup, writeReportPopupState } from "./reportPopup";

const H = 3_600_000;
const during = CAMPAIGN_ENDS_AT - 5 * 24 * H;
const after = CAMPAIGN_ENDS_AT + H;

test("never shows once the report popup was dismissed", () => {
  expect(shouldShowReportPopup({ report: { dismissedAt: 1 }, challenge: null, now: after })).toBe(
    false
  );
});

test("stands aside while the challenge popup is still going to show", () => {
  expect(shouldShowReportPopup({ report: null, challenge: null, now: during })).toBe(false);
});

test("waits 12h after the challenge was dismissed", () => {
  expect(
    shouldShowReportPopup({ report: null, challenge: { dismissedAt: during - H }, now: during })
  ).toBe(false);
  expect(
    shouldShowReportPopup({
      report: null,
      challenge: { dismissedAt: during - 13 * H },
      now: during,
    })
  ).toBe(true);
});

test("shows after the campaign for visitors who never saw the challenge", () => {
  expect(shouldShowReportPopup({ report: null, challenge: null, now: after })).toBe(true);
});

test("the 12h gap still applies just after the campaign ends", () => {
  expect(
    shouldShowReportPopup({ report: null, challenge: { dismissedAt: after - H }, now: after })
  ).toBe(false);
});

test("corrupt or blocked storage reads as never dismissed", () => {
  expect(readReportPopupState({ getItem: () => "{not json" })).toBeNull();
  expect(
    readReportPopupState({
      getItem: () => {
        throw new Error("blocked");
      },
    })
  ).toBeNull();
  expect(() =>
    writeReportPopupState(
      {
        setItem: () => {
          throw new Error("full");
        },
      },
      { dismissedAt: 1 }
    )
  ).not.toThrow();
});
