import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, createWhatIfScenarios, getCity, listCities } from "./api";
import { defaultStudyCityId } from "./study-city";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("api client", () => {
  it("retries idempotent GET requests on transient failures", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "temporary" } }), {
          status: 503,
          headers: { "Content-Type": "application/json", "x-request-id": "req-1" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ cities: [{ id: defaultStudyCityId, name: "Study city" }] }), {
          status: 200,
          headers: { "Content-Type": "application/json", "x-request-id": "req-2" },
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    const cities = await listCities();

    expect(cities).toHaveLength(1);
    expect(cities[0]?.id).toBe(defaultStudyCityId);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws ApiError for non-retryable status failures", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ message: "not-found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "x-request-id": "req-404" },
      }),
    );
    vi.stubGlobal(
      "fetch",
      fetchMock,
    );

    try {
      await getCity("missing-city");
      throw new Error("Expected getCity to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({ status: 404, requestId: "req-404" });
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry non-idempotent POST requests", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ message: "service-unavailable" }), {
        status: 503,
        headers: { "Content-Type": "application/json", "x-request-id": "req-503" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(createWhatIfScenarios(defaultStudyCityId, 100000)).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
