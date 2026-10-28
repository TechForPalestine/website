import { describe, expect, it, vi } from "vitest";
import {
  CTA_CLICK_EVENT,
  EXPOSURE_EVENT,
  pickHomepageVariant,
  trackHeroCtas,
  type PrerenderAwareDocument,
} from "./homepageExperiment";

describe("pickHomepageVariant", () => {
  it("returns A for the lower half of the range", () => {
    expect(pickHomepageVariant(() => 0)).toBe("A");
    expect(pickHomepageVariant(() => 0.499)).toBe("A");
  });

  it("returns B for the upper half of the range", () => {
    expect(pickHomepageVariant(() => 0.5)).toBe("B");
    expect(pickHomepageVariant(() => 0.999)).toBe("B");
  });
});

// Vitest runs in node, so the container and document are minimal fakes.
type Listener = (event: MouseEvent) => void;

function fakeContainer(dataset: Record<string, string>) {
  const listeners = new Map<string, Set<Listener>>();
  const container = {
    dataset,
    addEventListener: (type: string, listener: Listener) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)?.add(listener);
    },
    removeEventListener: (type: string, listener: Listener) => {
      listeners.get(type)?.delete(listener);
    },
  };
  const fire = (type: string, cta: string | null, button = 0) => {
    const link = cta ? { dataset: { cta } } : null;
    const event = { type, button, target: { closest: () => link } } as unknown as MouseEvent;
    listeners.get(type)?.forEach((listener) => listener(event));
  };
  return { container: container as unknown as HTMLElement, fire };
}

function fakeDocument(prerendering: boolean) {
  let activate: (() => void) | undefined;
  const doc: PrerenderAwareDocument = {
    prerendering,
    addEventListener: (_type, listener) => {
      activate = listener;
    },
  };
  return { doc, activate: () => activate?.() };
}

const props = { experiment: "homepage-description", variant: "B" };

describe("trackHeroCtas", () => {
  it("records one exposure straight away when the page is visible", () => {
    const track = vi.fn();
    const { container } = fakeContainer(props);

    trackHeroCtas(container, { track, doc: fakeDocument(false).doc });

    expect(track).toHaveBeenCalledOnce();
    expect(track).toHaveBeenCalledWith(EXPOSURE_EVENT, props);
  });

  it("waits for a prerendered page to be shown before recording the exposure", () => {
    const track = vi.fn();
    const { container } = fakeContainer(props);
    const { doc, activate } = fakeDocument(true);

    trackHeroCtas(container, { track, doc });
    expect(track).not.toHaveBeenCalled();

    activate();
    expect(track).toHaveBeenCalledWith(EXPOSURE_EVENT, props);
  });

  it("does nothing without experiment and variant data attributes", () => {
    const track = vi.fn();
    const { container, fire } = fakeContainer({});

    trackHeroCtas(container, { track, doc: fakeDocument(false).doc });
    fire("click", "membership");

    expect(track).not.toHaveBeenCalled();
  });

  it("records the clicked card and only the first click", () => {
    const track = vi.fn();
    const { container, fire } = fakeContainer(props);

    trackHeroCtas(container, { track, doc: fakeDocument(false).doc });
    fire("click", "incubator");
    fire("click", "membership");

    expect(track).toHaveBeenCalledTimes(2);
    expect(track).toHaveBeenLastCalledWith(CTA_CLICK_EVENT, { ...props, cta: "incubator" });
  });

  it("ignores clicks outside the cards", () => {
    const track = vi.fn();
    const { container, fire } = fakeContainer(props);

    trackHeroCtas(container, { track, doc: fakeDocument(false).doc });
    fire("click", null);

    expect(track).toHaveBeenCalledOnce();
  });

  it("counts middle-clicks but not right-clicks", () => {
    const track = vi.fn();
    const { container, fire } = fakeContainer(props);

    trackHeroCtas(container, { track, doc: fakeDocument(false).doc });
    fire("auxclick", "membership", 2);
    expect(track).toHaveBeenCalledOnce();

    fire("auxclick", "membership", 1);
    expect(track).toHaveBeenLastCalledWith(CTA_CLICK_EVENT, { ...props, cta: "membership" });
  });
});
