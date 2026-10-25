import { describe, expect, it } from "vitest";
import { decodeEntities, parseDescriptionHtml, type DescriptionNode } from "./descriptionHtml";

/** Flattens a tree back to a compact string so assertions stay readable. */
function serialize(nodes: DescriptionNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") return node.text;
      const href = node.href !== undefined ? `[${node.href}]` : "";
      return `<${node.tag}${href}>${serialize(node.children)}</${node.tag}>`;
    })
    .join("");
}

describe("parseDescriptionHtml", () => {
  it("keeps paragraphs, line breaks and lists", () => {
    const html = "<p>Hello<br/>world</p><ol><li>One</li><li>Two</li></ol><ul><li>Dot</li></ul>";

    expect(serialize(parseDescriptionHtml(html))).toBe(
      "<p>Hello<br></br>world</p><ol><li>One</li><li>Two</li></ol><ul><li>Dot</li></ul>"
    );
  });

  it("decodes entities in text", () => {
    expect(serialize(parseDescriptionHtml("<p>I&#39;d &amp; DED&#x2019;s</p>"))).toBe(
      "<p>I'd & DED’s</p>"
    );
  });

  it("keeps an http(s) link href and drops every other attribute", () => {
    const html =
      '<a href="https://crossposter.mochi.is" rel="noopener" target="_blank" onclick="x()">site</a>';

    expect(serialize(parseDescriptionHtml(html))).toBe("<a[https://crossposter.mochi.is]>site</a>");
  });

  it("blanks javascript: and data: hrefs", () => {
    const html = '<a href="javascript:alert(1)">a</a><a href="data:text/html,x">b</a>';

    expect(serialize(parseDescriptionHtml(html))).toBe("<a[]>a</a><a[]>b</a>");
  });

  it("drops script and style contents entirely", () => {
    const html = "<p>Safe</p><script>alert(1)</script><style>p{}</style><p>Also safe</p>";

    expect(serialize(parseDescriptionHtml(html))).toBe("<p>Safe</p><p>Also safe</p>");
  });

  it("unwraps unknown tags to their text", () => {
    const html = '<p><span class="x">Kept</span> <img src="x" onerror="y()"> text</p>';

    expect(serialize(parseDescriptionHtml(html))).toBe("<p>Kept  text</p>");
  });

  it("maps b and i to strong and em", () => {
    expect(serialize(parseDescriptionHtml("<b>bold</b> <i>it</i>"))).toBe(
      "<strong>bold</strong> <em>it</em>"
    );
  });

  it("tolerates unclosed and stray closing tags", () => {
    expect(serialize(parseDescriptionHtml("<p>open</li><ul><li>item"))).toBe(
      "<p>open<ul><li>item</li></ul></p>"
    );
  });

  it("keeps a stray < as text", () => {
    expect(serialize(parseDescriptionHtml("<p>1 < 2</p>"))).toBe("<p>1 < 2</p>");
  });
});

describe("decodeEntities", () => {
  it("leaves unknown or invalid entities untouched", () => {
    expect(decodeEntities("&bogus; &#0; &#xFFFFFFF;")).toBe("&bogus; &#0; &#xFFFFFFF;");
  });
});
