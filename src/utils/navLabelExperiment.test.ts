import { describe, expect, it, vi } from "vitest";
import {
  CLICK_EVENT,
  EXPOSURE_EVENT,
  navClickDestination,
  trackNavLabel,
  type ExperimentDocument,
  navExperimentProps,
  variantFromFeature,
} from "./navLabelExperiment";

describe("variantFromFeature", () => {
  it("returns the variant a GrowthBook rule assigned", () => {
    expect(variantFromFeature({ value: "A", source: "force" })).toBe("A");
    expect(variantFromFeature({ value: "B", source: "force" })).toBe("B");
  });

  it("returns null when no rule assigned a variant", () => {
    expect(variantFromFeature({ value: "A", source: "defaultValue" })).toBeNull();
    expect(variantFromFeature({ value: null, source: "unknownFeature" })).toBeNull();
  });

  it("returns null for a value that is not a known variant", () => {
    expect(variantFromFeature({ value: "C", source: "force" })).toBeNull();
  });
});

// Vitest runs in node, so the document and link are minimal fakes.
type Listener = (event: MouseEvent) => void;

const props = { experiment: "nav-get-involved-label", variant: "B" };

function fakeDocument({
  prerendering = false,
  dataset = props as Record<string, string>,
}: { prerendering?: boolean; dataset?: Record<string, string> | null } = {}) {
  const listeners = new Map<string, Listener[]>();
  const link = dataset ? { dataset, getAttribute: () => null } : null;
  const doc: ExperimentDocument = {
    prerendering,
    querySelector: () => link as unknown as Element | null,
    addEventListener: (type, listener) => {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
    },
  };
  // `href` is the clicked link's href; by default the clicked link is the navbar's label link.
  const fire = (type: string, onLink: boolean, button = 0, href?: string) => {
    const clicked = href === undefined ? link : { dataset, getAttribute: () => href };
    const target = { closest: () => (onLink ? clicked : null) };
    const event = { type, button, target } as unknown as MouseEvent;
    listeners.get(type)?.forEach((listener) => listener(event));
  };
  return { doc, fire };
}

describe("trackNavLabel", () => {
  it("records one exposure straight away when the page is visible", () => {
    const track = vi.fn();
    trackNavLabel({ track, doc: fakeDocument().doc });

    expect(track).toHaveBeenCalledOnce();
    expect(track).toHaveBeenCalledWith(EXPOSURE_EVENT, props);
  });

  it("waits for a prerendered page to be shown before recording the exposure", () => {
    const track = vi.fn();
    const { doc, fire } = fakeDocument({ prerendering: true });

    trackNavLabel({ track, doc });
    expect(track).not.toHaveBeenCalled();

    fire("prerenderingchange", false);
    expect(track).toHaveBeenCalledWith(EXPOSURE_EVENT, props);
  });

  it("does nothing when the nav has no experiment link", () => {
    const track = vi.fn();
    const { doc, fire } = fakeDocument({ dataset: null });

    trackNavLabel({ track, doc });
    fire("click", true);

    expect(track).not.toHaveBeenCalled();
  });

  it("records clicks on the experiment link and ignores other clicks", () => {
    const track = vi.fn();
    const { doc, fire } = fakeDocument();

    trackNavLabel({ track, doc });
    fire("click", false);
    fire("click", true);

    expect(track).toHaveBeenCalledTimes(2);
    expect(track).toHaveBeenLastCalledWith(CLICK_EVENT, props);
  });

  it("adds the clicked link's destination to the click event", () => {
    const track = vi.fn();
    const { doc, fire } = fakeDocument();

    trackNavLabel({ track, doc });
    fire("click", true, 0, "/membership");

    expect(track).toHaveBeenLastCalledWith(CLICK_EVENT, { ...props, destination: "/membership" });
  });

  it("counts middle-clicks but not right-clicks", () => {
    const track = vi.fn();
    const { doc, fire } = fakeDocument();

    trackNavLabel({ track, doc });
    fire("auxclick", true, 2);
    expect(track).toHaveBeenCalledOnce();

    fire("auxclick", true, 1);
    expect(track).toHaveBeenLastCalledWith(CLICK_EVENT, props);
  });
});

describe("navExperimentProps", () => {
  it("returns the experiment and variant from the navbar link", () => {
    expect(navExperimentProps(fakeDocument().doc)).toEqual(props);
  });

  it("returns nothing when the visitor is not in the test", () => {
    expect(navExperimentProps(fakeDocument({ dataset: null }).doc)).toEqual({});
  });
});

describe("navClickDestination", () => {
  it("keeps site paths as they are, without a trailing slash", () => {
    expect(navClickDestination("/membership")).toBe("/membership");
    expect(navClickDestination("/incubator/")).toBe("/incubator");
  });

  it("reduces full techforpalestine.org URLs to their path", () => {
    expect(navClickDestination("https://techforpalestine.org/project-application-form")).toBe(
      "/project-application-form"
    );
  });

  it("keeps other sites' URLs whole", () => {
    expect(navClickDestination("https://discord.gg/abc")).toBe("https://discord.gg/abc");
  });

  it("returns nothing for a missing href", () => {
    expect(navClickDestination(null)).toBeUndefined();
  });
});
