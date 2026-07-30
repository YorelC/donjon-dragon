import { useAuthStore } from "@/shared/stores/auth.store";
import { refreshAccessToken } from "./refresh";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function buildHeaders(
  accessToken: string | null,
  options?: RequestInit,
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options?.headers) {
    const optionHeaders =
      options.headers instanceof Headers
        ? Object.fromEntries(options.headers.entries())
        : (options.headers as Record<string, string>);
    Object.assign(headers, optionHeaders);
  }

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new ApiError(res.status, `API error ${res.status}: ${await res.text()}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

async function attemptRefreshAndRetry<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  try {
    const newAccessToken = await refreshAccessToken();
    const newHeaders = buildHeaders(newAccessToken, options);
    const retryRes = await fetch(path, {
      ...options,
      headers: newHeaders,
    });
    return handleResponse<T>(retryRes);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, "Token refresh failed");
  }
}

async function request<T>(
  path: string,
  options?: RequestInit,
  retry: boolean = false,
): Promise<T> {
  const accessToken = useAuthStore.getState().accessToken;
  const headers = buildHeaders(accessToken, options);

  const res = await fetch(path, {
    ...options,
    headers,
  });

  if (res.ok || res.status !== 401 || retry) {
    return handleResponse<T>(res);
  }

  return attemptRefreshAndRetry<T>(path, options);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
