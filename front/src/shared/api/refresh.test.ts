import { afterEach, describe, expect, it, vi } from "vitest";
import { API_ROUTES } from "@/shared/constants/api-routes";

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

const mockSetAuth = vi.fn();
const mockClearAuth = vi.fn();

vi.mock("@/shared/stores/auth.store", () => ({
  useAuthStore: {
    getState: () => ({
      ...storeState,
      setAuth: mockSetAuth,
      clearAuth: mockClearAuth,
    }),
  },
}));

import { refreshAccessToken } from "./refresh";

describe("refreshAccessToken", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    storeState = {
      accessToken: "old-access-token",
      refreshToken: "old-refresh-token",
      user: null,
    };
  });

  it("posts refresh token, calls setAuth, and returns new access token", async () => {
    const mockTokens = {
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      user: { id: "1", displayName: "Test", email: "test@example.com" },
    };

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockTokens), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await refreshAccessToken();

    expect(result).toBe("new-access-token");
    expect(fetchMock).toHaveBeenCalledWith(
      API_ROUTES.auth.refresh,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ refreshToken: "old-refresh-token" }),
      }),
    );
    expect(mockSetAuth).toHaveBeenCalledWith(mockTokens);
  });

  it("clears auth and throws when refresh returns 401", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("Unauthorized", { status: 401 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshAccessToken()).rejects.toThrow("Refresh failed: 401");
    expect(mockClearAuth).toHaveBeenCalled();
  });

  it("throws without fetch if no refresh token", async () => {
    storeState.refreshToken = null;

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshAccessToken()).rejects.toThrow("No refresh token available");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses single-flight lock for concurrent calls", async () => {
    const mockTokens = {
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      user: { id: "1", displayName: "Test", email: "test@example.com" },
    };

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockTokens), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const [result1, result2] = await Promise.all([
      refreshAccessToken(),
      refreshAccessToken(),
    ]);

    expect(result1).toBe("new-access-token");
    expect(result2).toBe("new-access-token");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
