import { describe, expect, it } from "vitest";
import { DONATION_FORMS, MEMBERSHIP_FORMS, isValidTransactionId } from "./qgivVerify";

describe("isValidTransactionId", () => {
  it("accepts a plain numeric Qgiv id", () => {
    expect(isValidTransactionId("1094620")).toBe(true);
  });

  it("rejects a non-string", () => {
    expect(isValidTransactionId(1094620)).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidTransactionId("")).toBe(false);
  });

  it("rejects path traversal, which would escape the API URL", () => {
    expect(isValidTransactionId("../../admin/api")).toBe(false);
  });

  it("rejects a value longer than 64 characters", () => {
    expect(isValidTransactionId("1".repeat(65))).toBe(false);
  });
});

describe("form allowlists", () => {
  it("grants a Hub invite only to the Pilot Membership Form", () => {
    expect(MEMBERSHIP_FORMS["1116610"]).toEqual({ tag: "member", hubInvite: true });
  });

  it("tags supporting members without a Hub invite", () => {
    expect(MEMBERSHIP_FORMS["1158315"]).toEqual({
      tag: "Supporting Member",
      hubInvite: false,
    });
  });

  it("does not let a donation form reach the membership endpoint", () => {
    expect(MEMBERSHIP_FORMS["1094620"]).toBeUndefined();
  });

  it("does not let a membership form reach the donation endpoint", () => {
    expect(DONATION_FORMS["1116610"]).toBeUndefined();
  });

  it("excludes the Qgiv Test Form from both allowlists", () => {
    expect(MEMBERSHIP_FORMS["1122160"]).toBeUndefined();
    expect(DONATION_FORMS["1122160"]).toBeUndefined();
  });
});
