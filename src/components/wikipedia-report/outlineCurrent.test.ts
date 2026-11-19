import { describe, expect, it } from "vitest";
import { currentHeadingBySection, currentHeadingLinear } from "./outlineCurrent";

const OFFSET = 100;
const h = (id: string, top: number) => ({ id, top });

describe("currentHeadingLinear", () => {
  const headings = [h("a", -300), h("b", 50), h("c", 400)];

  it("returns the last heading past the line", () => {
    expect(currentHeadingLinear(headings, OFFSET)).toBe("b");
  });

  it("returns null above all headings", () => {
    expect(currentHeadingLinear([h("a", 300)], OFFSET)).toBeNull();
  });
});

describe("currentHeadingBySection", () => {
  const sections = [h("s1", -900), h("s2", -200), h("s3", 600)];
  const headingsBySection = [
    [h("a", -850), h("b", -500)],
    [h("c", -150), h("d", 300)],
    [h("e", 650)],
  ];
  const headingsOf = (i: number) => headingsBySection[i];
  const tops = sections.map((s) => s.top);
  const lastIdOf = (i: number) => headingsBySection[i].at(-1)?.id ?? null;

  it("finds the current heading in the middle section", () => {
    expect(currentHeadingBySection(tops, headingsOf, lastIdOf, OFFSET)).toBe("c");
  });

  it("falls back to the previous section's last heading", () => {
    const later = [[h("a", -850), h("b", -500)], [h("c", 20 + 100)], [h("e", 650)]];
    expect(
      currentHeadingBySection(
        [-900, -50, 600],
        (i) => later[i],
        (i) => later[i].at(-1)?.id ?? null,
        OFFSET
      )
    ).toBe("b");
  });

  it("requests positions only for the current section in the fallback case", () => {
    const later = [[h("a", -850), h("b", -500)], [h("c", 120)]];
    const asked: number[] = [];
    const id = currentHeadingBySection(
      [-900, -50],
      (i) => (asked.push(i), later[i]),
      (i) => later[i].at(-1)?.id ?? null,
      OFFSET
    );
    expect(id).toBe("b");
    expect(asked).toEqual([1]);
  });

  it("skips previous sections that have no headings", () => {
    const sparse = [[h("a", -850)], [], [h("e", 150)]];
    expect(
      currentHeadingBySection(
        [-900, -500, -50],
        (i) => sparse[i],
        (i) => sparse[i].at(-1)?.id ?? null,
        OFFSET
      )
    ).toBe("a");
  });

  it("highlights the entry itself while its opening text is read (full page)", () => {
    // /full: Section 1 has passed the line but its first sub-heading has not,
    // so "Introduction" is current, not the previous entry's last heading.
    const full = [
      [h("executive-summary", -4000), h("about-this-report", -1200)],
      [h("section-1", 60), h("s1-1", 700)],
    ];
    expect(
      currentHeadingBySection(
        [-4000, 60],
        (i) => full[i],
        (i) => full[i].at(-1)?.id ?? null,
        OFFSET
      )
    ).toBe("section-1");
  });

  it("returns null above all sections", () => {
    expect(
      currentHeadingBySection(
        [300, 900],
        () => [h("x", 400)],
        () => null,
        OFFSET
      )
    ).toBeNull();
  });

  it("does not measure sections after the current one", () => {
    const asked: number[] = [];
    currentHeadingBySection(tops, (i) => (asked.push(i), headingsBySection[i]), lastIdOf, OFFSET);
    expect(asked).toEqual([1]);
  });
});
