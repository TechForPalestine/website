import { describe, expect, it, vi } from "vitest";
import {
  EXPOSURE_EVENT,
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
  const link = dataset ? { dataset } : null;
  const doc: ExperimentDocument = {
    prerendering,
    querySelector: () => link as unknown as Element | null,
    addEventListener: (type, listener) => {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
    },
  };
  const fire = (type: string, onLink: boolean) => {
    const target = { closest: () => (onLink ? link : null) };
    const event = { type, target } as unknown as MouseEvent;
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
    trackNavLabel({ track, doc: fakeDocument({ dataset: null }).doc });

    expect(track).not.toHaveBeenCalled();
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
