import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { AuthSession } from "@donjon-dragon/shared";
import { SESSION_STATUS, useAuthStore } from "@/shared/stores/auth.store";
import { ROUTES } from "@/shared/constants/routes";
import { PrivateRoute } from "./private-route";

// PrivateRoute decide qui accede aux pages protegees : un bug ici deconnecte tout
// le monde ou laisse passer des visiteurs. Depuis le passage aux cookies httpOnly
// il arbitre TROIS etats, et le troisieme est le plus fragile.

const session: AuthSession = {
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
    useAuthStore.setState({ user: null, status: SESSION_STATUS.anonymous });
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

  // Le troisieme etat, et la raison d'etre du bootstrap /me : les cookies etant
  // httpOnly, le front ne peut pas savoir s'il a une session avant d'avoir demande.
  // Rediriger pendant cette attente deconnecterait a chaque rechargement de page.
  describe("session encore indéterminée", () => {
    beforeEach(() => {
      useAuthStore.setState({ user: null, status: SESSION_STATUS.unknown });
    });

    it("ne redirige PAS tant que /me n'a pas répondu", () => {
      renderAt("/protegee");

      expect(screen.queryByText("page de connexion")).not.toBeInTheDocument();
    });

    it("ne montre pas non plus le contenu protégé", () => {
      renderAt("/protegee");

      expect(screen.queryByText("contenu protégé")).not.toBeInTheDocument();
    });

    it("annonce l'attente au lecteur d'écran", () => {
      renderAt("/protegee");

      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });
});
