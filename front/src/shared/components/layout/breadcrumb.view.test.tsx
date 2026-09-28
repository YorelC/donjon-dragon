import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { BreadcrumbView } from "./breadcrumb.view";

const trail = [
  { label: "Profil", to: "/campaigns" },
  { label: "Campagnes", to: "/campaigns" },
  { label: "La Couronne de Givre", to: "/campaigns/c1/characters" },
];

function renderTrail(onFollow = vi.fn()) {
  render(
    <MemoryRouter>
      <BreadcrumbView trail={trail} onFollow={onFollow} />
    </MemoryRouter>,
  );
  return onFollow;
}

describe("BreadcrumbView", () => {
  it("s'annonce comme fil d'Ariane", () => {
    renderTrail();

    expect(screen.getByRole("navigation", { name: "Fil d'Ariane" })).toBeInTheDocument();
  });

  it("rend chaque étape passée en lien vers son écran", () => {
    renderTrail();

    expect(screen.getByRole("link", { name: "Profil" })).toHaveAttribute("href", "/campaigns");
    expect(screen.getByRole("link", { name: "Campagnes" })).toHaveAttribute(
      "href",
      "/campaigns",
    );
  });

  it("marque la dernière étape comme la page ouverte, sans lien", () => {
    renderTrail();

    expect(screen.queryByRole("link", { name: "La Couronne de Givre" })).toBeNull();
    expect(screen.getByText("La Couronne de Givre")).toHaveAttribute("aria-current", "page");
  });

  it("confie chaque clic d'étape à la garde de sortie", async () => {
    const onFollow = renderTrail(vi.fn((event: Event) => event.preventDefault()));

    await userEvent.click(screen.getByRole("link", { name: "Campagnes" }));

    expect(onFollow).toHaveBeenCalledWith(expect.anything(), "/campaigns");
  });

  it("ne rend rien pour un fil vide", () => {
    const { container } = render(
      <MemoryRouter>
        <BreadcrumbView trail={[]} onFollow={vi.fn()} />
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
