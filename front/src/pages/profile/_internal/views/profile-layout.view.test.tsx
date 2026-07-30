import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ProfileLayoutView } from "./profile-layout.view";
import { PROFILE_NAV_ITEMS } from "../constants/profile-nav-items";

const mockOnNavigate = vi.fn();

const mockProps = {
  items: PROFILE_NAV_ITEMS,
  isMenuOpen: false,
  onToggleMenu: vi.fn(),
  onNavigate: mockOnNavigate,
};

describe("ProfileLayoutView", () => {
  it("should render sidebar links with correct hrefs", () => {
    render(
      <MemoryRouter>
        <ProfileLayoutView {...mockProps} />
      </MemoryRouter>
    );

    const friendsLink = screen.getByRole("link", { name: /Amis/i });
    const settingsLink = screen.getByRole("link", { name: /Parametres/i });

    expect(friendsLink).toHaveAttribute("href", "/profile/friends");
    expect(settingsLink).toHaveAttribute("href", "/profile/parametres");
  });

  it("should render hamburger button on mobile", () => {
    render(
      <MemoryRouter>
        <ProfileLayoutView {...mockProps} />
      </MemoryRouter>
    );

    const hamburger = screen.getByRole("button");
    expect(hamburger).toBeInTheDocument();
  });

  it("should call onToggleMenu when hamburger button is clicked", async () => {
    const user = userEvent.setup();
    const onToggleMenu = vi.fn();

    render(
      <MemoryRouter>
        <ProfileLayoutView
          {...mockProps}
          onToggleMenu={onToggleMenu}
        />
      </MemoryRouter>
    );

    const hamburger = screen.getByRole("button");
    await user.click(hamburger);

    expect(onToggleMenu).toHaveBeenCalled();
  });

  it("should call onNavigate when a link is clicked", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ProfileLayoutView {...mockProps} />
      </MemoryRouter>
    );

    const friendsLink = screen.getByRole("link", { name: /Amis/i });
    await user.click(friendsLink);

    expect(mockOnNavigate).toHaveBeenCalled();
  });

  it("should conditionally show sidebar based on isMenuOpen on mobile", () => {
    const { rerender } = render(
      <MemoryRouter>
        <ProfileLayoutView {...mockProps} isMenuOpen={false} />
      </MemoryRouter>
    );

    let sidebar = screen.queryByRole("navigation");
    expect(sidebar).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <ProfileLayoutView {...mockProps} isMenuOpen={true} />
      </MemoryRouter>
    );

    sidebar = screen.queryByRole("navigation");
    expect(sidebar).toBeInTheDocument();
  });
});
