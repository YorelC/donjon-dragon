import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CSRF_HEADER,
  DOMAIN_ERROR_CODE,
  IDEMPOTENCY_KEY_HEADER,
} from "@donjon-dragon/shared";
import { API_ROUTES } from "@/shared/constants/api-routes";
import { ApiError, api } from "./api";
import { refreshSession } from "./refresh";

vi.mock("./refresh");

const CSRF_TOKEN = "nonce.signature";

function giveBrowserACsrfCookie(): void {
  document.cookie = `csrf_token=${CSRF_TOKEN}`;
}

function clearCookies(): void {
  document.cookie = "csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

describe("api client", () => {
  beforeEach(() => {
    vi.mocked(refreshSession).mockClear();
    vi.mocked(refreshSession).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    clearCookies();
  });

  it("fait un GET et rend le JSON parsé", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await api.get<{ ok: boolean }>("/api/characters");

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/characters",
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });

  it("poste un corps JSON", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ id: "1" }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await api.post("/api/characters", { name: "Aragorn" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/characters",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Aragorn" }),
      }),
    );
  });

  it("rend undefined sur un 204", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.delete("/api/characters/1")).resolves.toBeUndefined();
  });

  describe("cookies de session", () => {
    // Sans ceci, aucun cookie ne part et TOUTE requete authentifiee echoue : c'est
    // la ligne dont depend le passage aux tokens httpOnly.
    it("envoie les cookies sur chaque requête", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
      vi.stubGlobal("fetch", fetchMock);

      await api.get("/api/friends");

      expect(fetchMock.mock.calls[0][1].credentials).toBe("include");
    });

    it("n'envoie plus d'en-tête Authorization", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
      vi.stubGlobal("fetch", fetchMock);

      await api.get("/api/friends");

      expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("Authorization");
    });
  });

  describe("jeton CSRF", () => {
    it("recopie le cookie en en-tête sur un POST", async () => {
      giveBrowserACsrfCookie();
      const fetchMock = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
      vi.stubGlobal("fetch", fetchMock);

      await api.post("/api/friends/request/Gandalf", {});

      expect(fetchMock.mock.calls[0][1].headers[CSRF_HEADER]).toBe(CSRF_TOKEN);
    });

    it("le recopie aussi sur un DELETE", async () => {
      giveBrowserACsrfCookie();
      const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
      vi.stubGlobal("fetch", fetchMock);

      await api.delete("/api/friends/abc");

      expect(fetchMock.mock.calls[0][1].headers[CSRF_HEADER]).toBe(CSRF_TOKEN);
    });

    // GET ne change pas d'etat : le serveur n'exige pas de jeton, donc en envoyer un
    // serait du bruit.
    it("ne l'envoie pas sur un GET", async () => {
      giveBrowserACsrfCookie();
      const fetchMock = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
      vi.stubGlobal("fetch", fetchMock);

      await api.get("/api/friends");

      expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty(CSRF_HEADER);
    });
  });

  describe("en-têtes de commande", () => {
    const COMMAND_KEY = "3f1d9b6e-6c1e-4d2a-9f0b-6b7c8d9e0a1b";

    function noContent(): Response {
      return new Response(null, { status: 204 });
    }

    it("fusionne les en-têtes fournis avec le Content-Type et le CSRF sur un POST", async () => {
      giveBrowserACsrfCookie();
      const fetchMock = vi.fn().mockResolvedValue(noContent());
      vi.stubGlobal("fetch", fetchMock);

      await api.post("/api/campaigns/c1/invitations", { displayName: "Bob" }, {
        [IDEMPOTENCY_KEY_HEADER]: COMMAND_KEY,
      });

      expect(fetchMock.mock.calls[0][1].headers).toMatchObject({
        "Content-Type": "application/json",
        [CSRF_HEADER]: CSRF_TOKEN,
        [IDEMPOTENCY_KEY_HEADER]: COMMAND_KEY,
      });
    });

    it("les fusionne aussi sur un DELETE, qui n'a pas de corps", async () => {
      giveBrowserACsrfCookie();
      const fetchMock = vi.fn().mockResolvedValue(noContent());
      vi.stubGlobal("fetch", fetchMock);

      await api.delete("/api/campaigns/c1/invitations/Bob", {
        [IDEMPOTENCY_KEY_HEADER]: COMMAND_KEY,
      });

      expect(fetchMock.mock.calls[0][1].headers).toMatchObject({
        [CSRF_HEADER]: CSRF_TOKEN,
        [IDEMPOTENCY_KEY_HEADER]: COMMAND_KEY,
      });
      expect(fetchMock.mock.calls[0][1]).not.toHaveProperty("body");
    });

    // Le CSRF tourne au renouvellement, la clé d'idempotence NON : c'est elle qui
    // dit au serveur que le rejeu est la même commande et non une seconde.
    it("conserve la même clé d'idempotence au rejeu après un 401", async () => {
      giveBrowserACsrfCookie();
      vi.mocked(refreshSession).mockImplementation(async () => {
        document.cookie = "csrf_token=rotated.signature";
      });

      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ statusCode: 401, message: "Unauthorized" }), {
            status: 401,
          }),
        )
        .mockResolvedValueOnce(noContent());
      vi.stubGlobal("fetch", fetchMock);

      await api.post("/api/campaigns/c1/invitations/accept", {}, {
        [IDEMPOTENCY_KEY_HEADER]: COMMAND_KEY,
      });

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[0][1].headers[IDEMPOTENCY_KEY_HEADER]).toBe(COMMAND_KEY);
      expect(fetchMock.mock.calls[1][1].headers[IDEMPOTENCY_KEY_HEADER]).toBe(COMMAND_KEY);
      expect(fetchMock.mock.calls[1][1].headers[CSRF_HEADER]).toBe("rotated.signature");
    });
  });

  describe("corps d'erreur", () => {
    it("remonte le message du back plutôt que le texte brut", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ statusCode: 404, message: "User not found" }), {
          status: 404,
        }),
      );
      vi.stubGlobal("fetch", fetchMock);

      await expect(api.get("/api/friends/missing")).rejects.toThrow("User not found");
    });

    // Le discriminant metier : c'est lui qui permet au formulaire d'inscription de
    // pointer le bon champ sur un 409, sans reconnaitre une phrase anglaise.
    it("expose le code métier quand le back en fournit un", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            statusCode: 409,
            message: "Display name already taken",
            code: DOMAIN_ERROR_CODE["display-name-already-taken"],
          }),
          { status: 409 },
        ),
      );
      vi.stubGlobal("fetch", fetchMock);

      const error: unknown = await api
        .post("/api/auth/register", {})
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).code).toBe(
        DOMAIN_ERROR_CODE["display-name-already-taken"],
      );
    });

    it("survit à une réponse d'erreur qui n'est pas du JSON", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(new Response("<html>502</html>", { status: 502 }));
      vi.stubGlobal("fetch", fetchMock);

      await expect(api.get("/api/friends")).rejects.toThrow("API error 502");
    });
  });

  describe("401 : renouvellement puis rejeu", () => {
    it("renouvelle la session et rejoue une fois", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ statusCode: 401, message: "Unauthorized" }), {
            status: 401,
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ data: "success" }), { status: 200 }),
        );
      vi.stubGlobal("fetch", fetchMock);

      const result = await api.get<{ data: string }>("/api/friends");

      expect(result).toEqual({ data: "success" });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(vi.mocked(refreshSession)).toHaveBeenCalledOnce();
    });

    // Le rejeu doit RELIRE le cookie CSRF : le renouvellement vient de le faire
    // tourner, donc reutiliser les en-tetes du premier essai partirait en 403.
    it("relit le jeton CSRF pour le rejeu", async () => {
      giveBrowserACsrfCookie();
      vi.mocked(refreshSession).mockImplementation(async () => {
        document.cookie = "csrf_token=rotated.signature";
      });

      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ statusCode: 401, message: "Unauthorized" }), {
            status: 401,
          }),
        )
        .mockResolvedValueOnce(new Response(null, { status: 204 }));
      vi.stubGlobal("fetch", fetchMock);

      await api.delete("/api/friends/abc");

      expect(fetchMock.mock.calls[0][1].headers[CSRF_HEADER]).toBe(CSRF_TOKEN);
      expect(fetchMock.mock.calls[1][1].headers[CSRF_HEADER]).toBe("rotated.signature");
    });

    it("ne rejoue pas deux fois", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ statusCode: 401, message: "Unauthorized" }), {
          status: 401,
        }),
      );
      vi.stubGlobal("fetch", fetchMock);

      await expect(api.get("/api/friends")).rejects.toThrow("Unauthorized");
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("propage l'échec du renouvellement en 401", async () => {
      vi.mocked(refreshSession).mockRejectedValue(new Error("boom"));

      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ statusCode: 401, message: "Unauthorized" }), {
          status: 401,
        }),
      );
      vi.stubGlobal("fetch", fetchMock);

      await expect(api.get("/api/friends")).rejects.toThrow("Session expirée");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("ne renouvelle rien sur un 200", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ data: "ok" }), { status: 200 }));
      vi.stubGlobal("fetch", fetchMock);

      await api.get("/api/friends");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(vi.mocked(refreshSession)).not.toHaveBeenCalled();
    });
  });

  // Le bug corrige : l'intercepteur ne distinguait pas les chemins. Un mot de passe
  // errone declenchait un renouvellement, ce qui CONSOMMAIT et faisait tourner le
  // refresh token de la session precedente, puis rejouait le login. Et le token de
  // verification d'email, a usage unique, etait brule par le rejeu.
  describe("routes d'authentification : un 401 est une réponse, pas un accident", () => {
    it.each([
      ["login", API_ROUTES.auth.login],
      ["verify-email", API_ROUTES.auth.verifyEmail],
      ["register", API_ROUTES.auth.register],
      ["refresh", API_ROUTES.auth.refresh],
    ])("ne renouvelle rien sur un 401 de %s", async (_name, route) => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ statusCode: 401, message: "Invalid credentials" }),
          { status: 401 },
        ),
      );
      vi.stubGlobal("fetch", fetchMock);

      await expect(api.post(route, {})).rejects.toThrow("Invalid credentials");
      expect(vi.mocked(refreshSession)).not.toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    // /me n'est PAS exclue, volontairement : c'est la route ou un 401 doit declencher
    // un renouvellement, puisque c'est ainsi qu'une session est reprise au chargement.
    it("renouvelle en revanche sur un 401 de /me", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ statusCode: 401, message: "Unauthorized" }), {
            status: 401,
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ displayName: "Gandalf" }), { status: 200 }),
        );
      vi.stubGlobal("fetch", fetchMock);

      await api.get(API_ROUTES.auth.me);

      expect(vi.mocked(refreshSession)).toHaveBeenCalledOnce();
    });
  });
});
