import { API_ROUTES } from "@/shared/constants/api-routes";
import { useAuthStore } from "@/shared/stores/auth.store";
import type { AuthTokens } from "@donjon-dragon/shared";

let inFlight: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  if (inFlight) {
    return inFlight;
  }

  inFlight = performRefresh().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

async function performRefresh(): Promise<string> {
  const refreshToken = useAuthStore.getState().refreshToken;

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const data = await requestNewTokens(refreshToken);

  if (!isAuthTokens(data)) {
    throw new Error("Invalid refresh response");
  }

  useAuthStore.getState().setAuth(data);
  return data.accessToken;
}

async function requestNewTokens(refreshToken: string): Promise<unknown> {
  const res = await fetch(API_ROUTES.auth.refresh, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    useAuthStore.getState().clearAuth();
    throw new Error(`Refresh failed: ${res.status}`);
  }

  return res.json();
}

function isAuthTokens(value: unknown): value is AuthTokens {
  return (
    typeof value === "object" &&
    value !== null &&
    "accessToken" in value &&
    "refreshToken" in value &&
    "user" in value
  );
}
