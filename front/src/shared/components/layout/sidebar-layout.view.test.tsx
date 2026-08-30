import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import {
  SidebarLayoutView,
  type SidebarFooter,
  type SidebarNav,
} from "./sidebar-layout.view";

// ── Helpers ──────────────────────────────────────────────────────────────────

function aNav(overrides: Partial<SidebarNav> = {}): SidebarNav {
  return {
    heading: "Campagne",
    menuLabel: "Menu de la campagne",
    items: [
      { label: "Utilisateurs", route: "/campaigns/1/users" },
      { label: "Personnages", route: null },
    ],
    isOpen: false,
    onToggle: vi.fn(),
    onNavigate: vi.fn(),
    ...overrides,
  };
}

const footer: SidebarFooter = {
  title: "Maître du jeu",
  subtitle: "5 membres · 1 invitation en attente",
};

function renderLayout(nav: SidebarNav = aNav()) {
  return {
    nav,
    ...render(
      <MemoryRouter>
        <SidebarLayoutView nav={nav} footer={footer} />
      </MemoryRouter>,
    ),
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("SidebarLayoutView", () => {
  it("titre la barre par ce dont elle navigue les écrans", () => {
    renderLayout();

    expect(screen.getByText("Campagne")).toBeInTheDocument();
  });

  it("rend une entrée routée en lien", () => {
    renderLayout();

    expect(screen.getByRole("link", { name: "Utilisateurs" })).toHaveAttribute(
      "href",
      "/campaigns/1/users",
    );
  });

  // Un jalon annoncé mais pas encore ouvert : visible, jamais actionnable.
  it("rend une entrée inerte sans lien", () => {
    renderLayout();

    expect(screen.queryByRole("link", { name: "Personnages" })).toBeNull();
    expect(screen.getByText("Personnages")).toBeInTheDocument();
  });

  it("annonce le pied de barre", () => {
    renderLayout();

    expect(screen.getByText("Maître du jeu")).toBeInTheDocument();
    expect(
      screen.getByText("5 membres · 1 invitation en attente"),
    ).toBeInTheDocument();
  });

  it("ouvre le tiroir par le bouton de menu", async () => {
    const { nav } = renderLayout();

    await userEvent.click(
      screen.getByRole("button", { name: "Menu de la campagne" }),
    );

    expect(nav.onToggle).toHaveBeenCalled();
  });

  it("referme le tiroir dès qu'on navigue", async () => {
    const { nav } = renderLayout(aNav({ isOpen: true }));

    await userEvent.click(screen.getByRole("link", { name: "Utilisateurs" }));

    expect(nav.onNavigate).toHaveBeenCalled();
  });
});
