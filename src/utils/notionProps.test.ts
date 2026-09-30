import { describe, expect, it } from "vitest";
import { emailProp, richTextProp, titleProp, urlProp } from "./notionProps";

describe("notionProps", () => {
  it("builds the exact shapes Notion expects", () => {
    expect(titleProp("t")).toEqual({ title: [{ text: { content: "t" } }] });
    expect(richTextProp("r")).toEqual({ rich_text: [{ text: { content: "r" } }] });
    expect(urlProp("https://x.example")).toEqual({ url: "https://x.example" });
    expect(emailProp("a@b.co")).toEqual({ email: "a@b.co" });
  });
});
