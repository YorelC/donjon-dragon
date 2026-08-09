import { beforeEach, describe, expect, it } from "vitest";
import type { AuthTokens } from "@donjon-dragon/shared";
import { useAuthStore } from "./auth.store";

// Tests de CARACTERISATION : ils verrouillent le comportement actuel du store
// avant que le passage aux cookies httpOnly ne le modifie. Sans eux, ce fichier
// n'avait aucune couverture — et c'est lui qui decide si l'utilisateur est
// considere comme connecte.

const STORAGE_KEY = "auth-storage";

const session: AuthTokens = {
  accessToken: "access-abc",
  refreshToken: "refresh-xyz",
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
    useAuthStore.getState().clearAuth();
    localStorage.clear();
  });

  it("démarre déconnecté", () => {
    const state = useAuthStore.getState();

    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it("setAuth ouvre la session", () => {
    useAuthStore.getState().setAuth(session);

    expect(useAuthStore.getState().user?.displayName).toBe("Gandalf");
  });

  it("clearAuth la referme entièrement", () => {
    useAuthStore.getState().setAuth(session);

    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it("survit à un rechargement de page", () => {
    useAuthStore.getState().setAuth(session);

    // Ce que zustand/persist relira au prochain montage.
    expect(localStorage.getItem(STORAGE_KEY)).toContain("Gandalf");
  });

  // ⚠️ CE TEST DOIT ETRE INVERSE par le passage aux cookies httpOnly.
  // Il documente l'etat actuel : les deux secrets de session sont ecrits en
  // clair dans localStorage, donc lisibles par n'importe quel script injecte.
  // Son inversion sera la preuve du correctif.
  it("persiste aujourd'hui les tokens en clair dans localStorage", () => {
    useAuthStore.getState().setAuth(session);

    const persisted = localStorage.getItem(STORAGE_KEY) ?? "";
    expect(persisted).toContain("access-abc");
    expect(persisted).toContain("refresh-xyz");
  });
});
