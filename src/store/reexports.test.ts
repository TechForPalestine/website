import { describe, expect, it } from "vitest";
import * as eventsClient from "./eventsClient";
import * as eventTypes from "../types/events";
import * as projectData from "../components/projects/projectData";
import * as sanitizeUrlModule from "../utils/sanitizeUrl";

describe("compat re-exports", () => {
  it("eventsClient re-exports the moved event helpers unchanged", () => {
    expect(eventsClient.DEFAULT_EVENT_IMAGE).toBe(eventTypes.DEFAULT_EVENT_IMAGE);
    expect(eventsClient.hasMeaningfulDescription).toBe(eventTypes.hasMeaningfulDescription);
    expect(eventsClient.primaryEventLink).toBe(eventTypes.primaryEventLink);
  });

  it("projectData re-exports sanitizeUrl unchanged", () => {
    expect(projectData.sanitizeUrl).toBe(sanitizeUrlModule.sanitizeUrl);
  });
});
