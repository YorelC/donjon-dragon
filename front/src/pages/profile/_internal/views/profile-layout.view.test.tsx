import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ProfileLayoutView } from "./profile-layout.view";
import { PROFILE_NAV_ITEMS } from "../constants/profile-nav-items";
import type { ProfileIdentity } from "../hooks/use-profile-identity";

const mockOnNavigate = vi.fn();

const identity: ProfileIdentity = {
  displayName: "Vaelira",
  friendCount: 3,
  pendingCount: 2,
};

const nav = {
  items: PROFILE_NAV_ITEMS,
  isMenuOpen: false,
  onToggleMenu: vi.fn(),
  onNavigate: mockOnNavigate,
};

function renderView(overrides: Partial<typeof nav> = {}, id = identity) {
  return render(
    <MemoryRouter>
      <ProfileLayoutView nav={{ ...nav, ...overrides }} identity={id} />
    </MemoryRouter>,
  );
}

describe("ProfileLayoutView", () => {
  it("should render the friends link with the correct href", () => {
    renderView();

    expect(screen.getByRole("link", { name: /Amis/i })).toHaveAttribute(
      "href",
      "/profile/friends",
    );
  });

  it("should render the account settings entry without a link", () => {
    renderView();

    expect(
      screen.queryByRole("link", { name: /Paramètres du compte/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Paramètres du compte")).toBeInTheDocument();
  });

  it("should render hamburger button on mobile", () => {
    renderView();

    expect(
      screen.getByRole("button", { name: /Menu du profil/i }),
    ).toBeInTheDocument();
  });

  it("should call onToggleMenu when hamburger button is clicked", async () => {
    const user = userEvent.setup();
    const onToggleMenu = vi.fn();

    renderView({ onToggleMenu });
    await user.click(screen.getByRole("button", { name: /Menu du profil/i }));

    expect(onToggleMenu).toHaveBeenCalled();
  });

  it("should call onNavigate when a link is clicked", async () => {
    const user = userEvent.setup();

    renderView();
    await user.click(screen.getByRole("link", { name: /Amis/i }));

    expect(mockOnNavigate).toHaveBeenCalled();
  });

  it("should conditionally show sidebar based on isMenuOpen on mobile", () => {
    const { rerender } = renderView({ isMenuOpen: false });
    expect(screen.queryByRole("navigation")).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <ProfileLayoutView nav={{ ...nav, isMenuOpen: true }} identity={identity} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("navigation")).toBeInTheDocument();
  });

  describe("bloc d'identité", () => {
    it("should show the display name", () => {
      renderView();

      expect(screen.getByText("Vaelira")).toBeInTheDocument();
    });

    it("should pluralize friends and pending requests", () => {
      renderView();

      expect(
        screen.getByText("3 amis · 2 demandes en attente"),
      ).toBeInTheDocument();
    });

    it("should keep the singular for a lone friend and a lone request", () => {
      renderView({}, { displayName: "Vaelira", friendCount: 1, pendingCount: 1 });

      expect(
        screen.getByText("1 ami · 1 demande en attente"),
      ).toBeInTheDocument();
    });

    // Rien en attente : la mention disparait au lieu d'annoncer un zero.
    it("should drop the pending segment when nothing is pending", () => {
      renderView({}, { displayName: "Vaelira", friendCount: 0, pendingCount: 0 });

      expect(screen.getByText("0 ami")).toBeInTheDocument();
    });
  });
});
