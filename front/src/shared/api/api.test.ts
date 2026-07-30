import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "./api";
import { API_ROUTES } from "@/shared/constants/api-routes";
import { refreshAccessToken } from "./refresh";

interface StoreState {
  accessToken: string | null;
  refreshToken: string | null;
  user: null;
}

let storeState: StoreState = {
  accessToken: "old-access-token",
  refreshToken: "old-refresh-token",
  user: null,
};

let mockSetAuth = vi.fn();
let mockClearAuth = vi.fn();

vi.mock("@/shared/stores/auth.store", () => ({
  useAuthStore: {
    getState: () => ({
      ...storeState,
      setAuth: mockSetAuth,
      clearAuth: mockClearAuth,
    }),
  },
}));

vi.mock("./refresh");

describe("api client", () => {
  beforeEach(() => {
    vi.mocked(refreshAccessToken).mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    storeState = {
      accessToken: "old-access-token",
      refreshToken: "old-refresh-token",
      user: null,
    };
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
      expect.objectContaining({ headers: expect.objectContaining({ "Content-Type": "application/json" }) }),
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

  describe("401 refresh retry", () => {
    it("retries with new token after 401 refresh success", async () => {
      vi.mocked(refreshAccessToken).mockResolvedValue("new-access-token");

      const fetchMock = vi.fn();
      fetchMock
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
        )
        .mockResolvedValueOnce(new Response(JSON.stringify({ data: "success" }), { status: 200 }));

      vi.stubGlobal("fetch", fetchMock);

      const result = await api.get<{ data: string }>("/api/test");

      expect(result).toEqual({ data: "success" });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(vi.mocked(refreshAccessToken)).toHaveBeenCalled();
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        "/api/test",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer new-access-token",
          }),
        }),
      );
    });

    it("throws ApiError 401 if refresh fails", async () => {
      vi.mocked(refreshAccessToken).mockRejectedValue(new Error("Refresh failed"));

      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
      );
      vi.stubGlobal("fetch", fetchMock);

      await expect(api.get("/api/test")).rejects.toThrow("Token refresh failed");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("makes single request for successful 200 response", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: "success" }), { status: 200 }),
      );
      vi.stubGlobal("fetch", fetchMock);

      const result = await api.get<{ data: string }>("/api/test");

      expect(result).toEqual({ data: "success" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(vi.mocked(refreshAccessToken)).not.toHaveBeenCalled();
    });
  });
});
