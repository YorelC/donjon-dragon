import { beforeEach, describe, expect, it } from "vitest";
import type { AuthSession } from "@donjon-dragon/shared";
import { SESSION_STATUS, useAuthStore } from "./auth.store";

// Ce fichier decide si l'utilisateur est considere comme connecte. Il etait sans
// couverture avant le passage aux cookies httpOnly ; les tests de caracterisation
// ecrits alors ont servi de filet pendant la bascule, et sont ici dans leur forme
// d'apres.

const STORAGE_KEY = "auth-storage";

const session: AuthSession = {
  user: {
    id: "11111111-1111-4111-8111-111111111111",
    email: "gandalf@middleearth.com",
    displayName: "Gandalf",
    emailVerified: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
};

describe("auth.store", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, status: SESSION_STATUS.unknown });
    localStorage.clear();
  });

  it("démarre dans un état indéterminé, ni connecté ni déconnecté", () => {
    const state = useAuthStore.getState();

    // C'est le coeur du modele : les cookies etant httpOnly, le front ne PEUT pas
    // savoir s'il a une session avant que /me ait repondu. Traiter cet etat comme
    // "deconnecte" redirigerait a chaque rechargement de page.
    expect(state.user).toBeNull();
    expect(state.status).toBe(SESSION_STATUS.unknown);
  });

  it("setAuth ouvre la session", () => {
    useAuthStore.getState().setAuth(session);

    const state = useAuthStore.getState();
    expect(state.user?.displayName).toBe("Gandalf");
    expect(state.status).toBe(SESSION_STATUS.authenticated);
  });

  it("clearAuth la referme, et tranche : anonyme, pas indéterminé", () => {
    useAuthStore.getState().setAuth(session);

    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    // `anonymous` et non `unknown` : la question a ete posee et la reponse est non.
    // Sans cette distinction, le bootstrap /me repartirait en boucle.
    expect(state.status).toBe(SESSION_STATUS.anonymous);
  });

  // Inversion du test de caracterisation qui documentait la faille : les deux
  // secrets etaient ecrits en clair dans localStorage, donc lisibles par n'importe
  // quel script injecte. Ce test est la preuve du correctif.
  it("ne persiste RIEN — ni token, ni profil", () => {
    useAuthStore.getState().setAuth(session);

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it("ne survit PAS à un rechargement de page, et c'est voulu", () => {
    useAuthStore.getState().setAuth(session);

    // Le store est un cache d'affichage en memoire. La session, elle, survit — dans
    // les cookies, et c'est /me qui la rend au front au prochain montage.
    expect(JSON.stringify(localStorage)).not.toContain("Gandalf");
  });

  it("n'expose plus aucun champ de token", () => {
    useAuthStore.getState().setAuth(session);

    // Une regression qui reintroduirait un token dans le store le remettrait du
    // meme coup a portee d'un script injecte.
    expect(useAuthStore.getState()).not.toHaveProperty("accessToken");
    expect(useAuthStore.getState()).not.toHaveProperty("refreshToken");
  });
});
