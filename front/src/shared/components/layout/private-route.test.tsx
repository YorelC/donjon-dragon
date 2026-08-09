import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { AuthTokens } from "@donjon-dragon/shared";
import { useAuthStore } from "@/shared/stores/auth.store";
import { ROUTES } from "@/shared/constants/routes";
import { PrivateRoute } from "./private-route";

// Tests de CARACTERISATION : PrivateRoute decide qui accede aux pages protegees
// et n'avait aucune couverture. Un bug ici deconnecte tout le monde ou laisse
// passer des visiteurs — c'est le pire endroit du front pour un angle mort.
//
// Le passage aux cookies httpOnly y ajoutera un troisieme etat (chargement,
// pendant que /me resout). Ces deux tests garantissent que les deux etats
// existants ne bougent pas.

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

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<PrivateRoute />}>
          <Route path="/protegee" element={<p>contenu protégé</p>} />
        </Route>
        <Route path={ROUTES.login} element={<p>page de connexion</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PrivateRoute", () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    localStorage.clear();
  });

  it("laisse passer un utilisateur connecté", () => {
    useAuthStore.getState().setAuth(session);

    renderAt("/protegee");

    expect(screen.getByText("contenu protégé")).toBeInTheDocument();
  });

  it("redirige un visiteur vers la connexion", () => {
    renderAt("/protegee");

    expect(screen.getByText("page de connexion")).toBeInTheDocument();
    expect(screen.queryByText("contenu protégé")).not.toBeInTheDocument();
  });

  it("referme l'accès dès que la session est vidée", () => {
    useAuthStore.getState().setAuth(session);
    const { unmount } = renderAt("/protegee");
    unmount();

    useAuthStore.getState().clearAuth();
    renderAt("/protegee");

    expect(screen.getByText("page de connexion")).toBeInTheDocument();
  });
});
