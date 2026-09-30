import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchProjectsData } from "./projectsClient";

const locals = { runtime: { env: { PROJECTHUB_API_KEY: "test-key" } } } as unknown as App.Locals;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchProjectsData upstream retry", () => {
  it("returns a 4xx immediately without retrying", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 404));
    await expect(fetchProjectsData(locals)).rejects.toThrow("ProjectHub API returned 404");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a 5xx twice, then fails", async () => {
    fetchMock.mockImplementation(async () => jsonResponse({}, 503));
    const result = fetchProjectsData(locals).catch((e: Error) => e);
    await vi.runAllTimersAsync();
    expect(((await result) as Error).message).toContain("ProjectHub API returned 503");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("recovers when a retry succeeds", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({}, 500))
      .mockResolvedValueOnce(jsonResponse([{ id: 1, name: "P" }]));
    const result = fetchProjectsData(locals);
    await vi.runAllTimersAsync();
    const data = await result;
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(data.projects).toHaveLength(1);
    expect(data.source).toBe("miss");
  });

  it("sends the API key header", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    await fetchProjectsData(locals);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)["X-API-Key"]).toBe("test-key");
  });
});

describe("fetchProjectsData response handling", () => {
  it("accepts array, data and projects envelopes and reads tags", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [{ id: 1 }], tags: [{ id: 1 }] }));
    expect((await fetchProjectsData(locals)).tags).toEqual([{ id: 1 }]);
    fetchMock.mockResolvedValueOnce(jsonResponse({ projects: [{ id: 2 }] }));
    const data = await fetchProjectsData(locals);
    expect(data.projects).toEqual([{ id: 2 }]);
    expect(data.tags).toEqual([]);
  });

  it("sanitizeProjectUrls blanks non-http URL fields and keeps safe ones", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        {
          id: 1,
          websiteUrl: "https://ok.test",
          githubUrl: "javascript:alert(1)",
          logoUrl: "/relative.png",
          name: "javascript:not-a-url-field",
        },
      ])
    );
    const [project] = (await fetchProjectsData(locals)).projects as unknown as Record<
      string,
      unknown
    >[];
    expect(project.websiteUrl).toBe("https://ok.test");
    expect(project.githubUrl).toBeUndefined();
    expect(project.logoUrl).toBe("/relative.png");
    expect(project.name).toBe("javascript:not-a-url-field");
  });
});
