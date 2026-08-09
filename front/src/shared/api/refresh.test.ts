import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthSession } from "@donjon-dragon/shared";
import { API_ROUTES } from "@/shared/constants/api-routes";

const mockSetAuth = vi.fn();
const mockClearAuth = vi.fn();

// Le store n'a plus de token a mocker : il ne contient qu'un profil et un statut.
vi.mock("@/shared/stores/auth.store", () => ({
  useAuthStore: {
    getState: () => ({ setAuth: mockSetAuth, clearAuth: mockClearAuth }),
  },
}));

import { refreshSession } from "./refresh";

const session: AuthSession = {
  user: {
    id: "11111111-1111-4111-8111-111111111111",
    email: "gandalf@middleearth.com",
    displayName: "Gandalf",
    emailVerified: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
};

const sessionResponse = () =>
  new Response(JSON.stringify(session), { status: 200 });

describe("refreshSession", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("poste sans corps, avec les cookies, et ouvre la session reçue", async () => {
    const fetchMock = vi.fn().mockResolvedValue(sessionResponse());
    vi.stubGlobal("fetch", fetchMock);

    await refreshSession();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(API_ROUTES.auth.refresh);
    expect(init.method).toBe("POST");
    // Le refresh token est un cookie httpOnly : il n'y a plus rien a transmettre,
    // et le front serait de toute facon incapable de le lire.
    expect(init.body).toBeUndefined();
    expect(init.credentials).toBe("include");
    expect(mockSetAuth).toHaveBeenCalledWith(session);
  });

  it("vide la session sur 401", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ statusCode: 401, message: "Unauthorized" }), {
        status: 401,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshSession()).rejects.toThrow("Unauthorized");
    expect(mockClearAuth).toHaveBeenCalled();
  });

  // Le bug corrige : un `!res.ok` deconnectait sur n'importe quel echec. Atteindre
  // la limite de debit du throttler coutait donc la session, alors que le refresh
  // token etait parfaitement valide.
  it("ne déconnecte PAS sur 429", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ statusCode: 429, message: "Too Many Requests" }),
        { status: 429 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshSession()).rejects.toThrow("Too Many Requests");
    expect(mockClearAuth).not.toHaveBeenCalled();
  });

  it("ne déconnecte PAS sur 500", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("Internal Server Error", { status: 500 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshSession()).rejects.toThrow();
    expect(mockClearAuth).not.toHaveBeenCalled();
  });

  // 409 = fenetre de grace du back : un autre onglet a fait tourner le token juste
  // avant nous, et sa reponse a deja pose le nouveau cookie.
  it("rejoue une fois sur 409 et aboutit", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ statusCode: 409, message: "Refresh race" }), {
          status: 409,
        }),
      )
      .mockResolvedValueOnce(sessionResponse());
    vi.stubGlobal("fetch", fetchMock);

    await refreshSession();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(mockSetAuth).toHaveBeenCalledWith(session);
    expect(mockClearAuth).not.toHaveBeenCalled();
  });

  it("s'arrête après un seul rejeu, sans déconnecter", async () => {
    const conflict = () =>
      new Response(JSON.stringify({ statusCode: 409, message: "Refresh race" }), {
        status: 409,
      });
    const fetchMock = vi.fn().mockResolvedValue(conflict());
    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshSession()).rejects.toThrow("Refresh race");
    // Deux appels, pas une boucle.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(mockClearAuth).not.toHaveBeenCalled();
  });

  it("refuse une réponse qui n'est pas une session valide", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ user: { displayName: "Gandalf" } }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshSession()).rejects.toThrow("Réponse de session invalide");
    expect(mockSetAuth).not.toHaveBeenCalled();
  });

  it("verrou single-flight : deux appels concurrents, un seul renouvellement", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => sessionResponse());
    vi.stubGlobal("fetch", fetchMock);

    await Promise.all([refreshSession(), refreshSession()]);

    // Le refresh token tourne a chaque usage : deux appels concurrents feraient
    // presenter au second un token deja consomme.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
