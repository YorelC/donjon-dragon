import { API_ROUTES } from "@/shared/constants/api-routes";
import { useAuthStore } from "@/shared/stores/auth.store";
import type { AuthTokens } from "@donjon-dragon/shared";

let inFlight: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  if (inFlight) {
    return inFlight;
  }

  inFlight = performRefresh();
  inFlight.finally(() => {
    inFlight = null;
  });

  return inFlight;
}

async function performRefresh(): Promise<string> {
  const refreshToken = useAuthStore.getState().refreshToken;

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const res = await fetch(API_ROUTES.auth.refresh, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    useAuthStore.getState().clearAuth();
    throw new Error(`Refresh failed: ${res.status}`);
  }

  const data: unknown = await res.json();
  if (!isAuthTokens(data)) {
    throw new Error("Invalid refresh response");
  }

  useAuthStore.getState().setAuth(data);
  return data.accessToken;
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
