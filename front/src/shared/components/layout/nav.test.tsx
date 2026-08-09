import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { Nav } from "./nav";
import { useAuthStore } from "@/shared/stores/auth.store";

vi.mock("@/shared/hooks/use-logout", () => ({
  useLogout: () => vi.fn(),
}));

const authenticatedUser = {
  id: "123",
  email: "test@example.com",
  displayName: "Test",
  createdAt: new Date().toISOString(),
  emailVerified: true,
};

describe("Nav", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null });
  });

  it("should render null when not authenticated", () => {
    useAuthStore.setState({ user: null });

    const { container } = render(
      <BrowserRouter>
        <Nav />
      </BrowserRouter>
    );

    expect(container.firstChild).toBeNull();
  });

  it("should render profile link when authenticated", () => {
    useAuthStore.setState({ user: authenticatedUser });

    render(
      <BrowserRouter>
        <Nav />
      </BrowserRouter>
    );

    const profileLink = screen.getByRole("link", { name: /Profil/i });
    expect(profileLink).toBeInTheDocument();
    expect(profileLink).toHaveAttribute("href", "/profile");
  });

  it("should render a mobile menu trigger button", () => {
    useAuthStore.setState({ user: authenticatedUser });

    render(
      <BrowserRouter>
        <Nav />
      </BrowserRouter>
    );

    expect(screen.getByRole("button", { name: /menu/i })).toBeInTheDocument();
  });

  it("should open the sheet with nav links when the trigger is clicked", async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ user: authenticatedUser });

    render(
      <BrowserRouter>
        <Nav />
      </BrowserRouter>
    );

    const trigger = screen.getByRole("button", { name: /menu/i });
    await user.click(trigger);

    const links = screen.getAllByRole("link", { name: /Campagnes/i });
    expect(links.length).toBeGreaterThan(0);

    const logoutButtons = screen.getAllByRole("button", {
      name: /Déconnexion/i,
    });
    expect(logoutButtons.length).toBeGreaterThan(0);
  });
});
