import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

describe("api client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("performs a GET request and returns parsed JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await api.get<{ ok: boolean }>("/api/characters");

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/characters",
      expect.objectContaining({ headers: { "Content-Type": "application/json" } }),
    );
  });

  it("sends a POST request with a JSON body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "1" }), { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await api.post("/api/characters", { name: "Aragorn" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/characters",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ name: "Aragorn" }) }),
    );
  });

  it("throws when the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("not found", { status: 404 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.get("/api/characters/missing")).rejects.toThrow("API error 404");
  });

  it("returns undefined for a 204 response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await api.delete("/api/characters/1");

    expect(result).toBeUndefined();
  });
});
