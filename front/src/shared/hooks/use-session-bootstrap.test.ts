import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { API_ROUTES } from "@/shared/constants/api-routes";
import { SESSION_STATUS, useAuthStore } from "@/shared/stores/auth.store";
import { api } from "@/shared/api/api";
import { useSessionBootstrap } from "./use-session-bootstrap";

vi.mock("@/shared/api/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const profile = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "gandalf@middleearth.com",
  displayName: "Gandalf",
  emailVerified: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("useSessionBootstrap", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, status: SESSION_STATUS.unknown });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("demande /me et ouvre la session", async () => {
    vi.mocked(api.get).mockResolvedValue(profile);

    renderHook(() => useSessionBootstrap());

    await waitFor(() => {
      expect(useAuthStore.getState().status).toBe(SESSION_STATUS.authenticated);
    });
    expect(api.get).toHaveBeenCalledWith(API_ROUTES.auth.me);
    expect(useAuthStore.getState().user?.displayName).toBe("Gandalf");
  });

  it("tranche à anonyme quand /me refuse", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("401"));

    renderHook(() => useSessionBootstrap());

    await waitFor(() => {
      expect(useAuthStore.getState().status).toBe(SESSION_STATUS.anonymous);
    });
    expect(useAuthStore.getState().user).toBeNull();
  });

  // `anonymous` et non `unknown` : sans cette transition, PrivateRoute resterait
  // eternellement sur son ecran de chargement au lieu de rediriger.
  it("ne reste jamais indéterminé après une réponse", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("401"));

    renderHook(() => useSessionBootstrap());

    await waitFor(() => {
      expect(useAuthStore.getState().status).not.toBe(SESSION_STATUS.unknown);
    });
  });

  it("refuse un profil qui ne respecte pas le contrat", async () => {
    vi.mocked(api.get).mockResolvedValue({ displayName: "Gandalf" });

    renderHook(() => useSessionBootstrap());

    // Une reponse malformee ne doit pas ouvrir une session a moitie remplie.
    await waitFor(() => {
      expect(useAuthStore.getState().status).toBe(SESSION_STATUS.anonymous);
    });
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("ne redemande rien si la session est déjà connue", async () => {
    useAuthStore.getState().setAuth({ user: profile });

    renderHook(() => useSessionBootstrap());

    await waitFor(() => {
      expect(api.get).not.toHaveBeenCalled();
    });
  });

  it("ne redemande rien après un refus déjà tranché", async () => {
    useAuthStore.getState().clearAuth();

    renderHook(() => useSessionBootstrap());

    // Sinon /me repartirait en boucle a chaque rendu d'un visiteur non connecte.
    await waitFor(() => {
      expect(api.get).not.toHaveBeenCalled();
    });
  });

  it("n'écrase pas une connexion aboutie pendant que /me était en vol", async () => {
    let resolveMe: (value: unknown) => void = () => undefined;
    vi.mocked(api.get).mockReturnValue(
      new Promise((resolve) => {
        resolveMe = resolve;
      }),
    );

    renderHook(() => useSessionBootstrap());

    // L'utilisateur se connecte avant que /me ait repondu, puis /me echoue.
    useAuthStore.getState().setAuth({ user: profile });
    resolveMe(Promise.reject(new Error("401")));

    await waitFor(() => {
      expect(useAuthStore.getState().status).toBe(SESSION_STATUS.authenticated);
    });
  });
});
