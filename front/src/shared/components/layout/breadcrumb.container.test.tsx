import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { useCampaignDetail } from "@/shared/queries/use-campaign-detail";
import { useCampaignCharacters } from "@/shared/queries/use-campaign-characters";
import { useLeaveGuardStore } from "@/shared/stores/leave-guard.store";
import { AppBreadcrumb } from "./breadcrumb.container";

vi.mock("@/shared/queries/use-campaign-detail", () => ({ useCampaignDetail: vi.fn() }));
vi.mock("@/shared/queries/use-campaign-characters", () => ({
  useCampaignCharacters: vi.fn(),
}));

function givenNames(campaignName?: string, characterName?: string) {
  vi.mocked(useCampaignDetail).mockReturnValue({
    data: campaignName ? { name: campaignName } : undefined,
  } as ReturnType<typeof useCampaignDetail>);
  vi.mocked(useCampaignCharacters).mockReturnValue({
    data: characterName ? [{ id: "p1", name: characterName }] : undefined,
  } as ReturnType<typeof useCampaignCharacters>);
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppBreadcrumb />
    </MemoryRouter>,
  );
}

const crumbTexts = () =>
  screen.getAllByRole("listitem").map((item) => item.textContent);

describe("AppBreadcrumb", () => {
  beforeEach(() => givenNames("La Couronne de Givre", "Vaelira"));
  afterEach(() => useLeaveGuardStore.getState().disarm());

  it("suit l'écran des amis", () => {
    renderAt("/profile/friends");

    expect(crumbTexts()).toEqual(["Profil", "Amis"]);
  });

  it("nomme la campagne ouverte", () => {
    renderAt("/campaigns/c1/users");

    expect(crumbTexts()).toEqual([
      "Profil",
      "Campagnes",
      "La Couronne de Givre",
      "Utilisateurs",
    ]);
  });

  it("nomme le personnage de la fiche", () => {
    renderAt("/campaigns/c1/characters/p1/sheet");

    expect(crumbTexts()).toEqual([
      "Profil",
      "Campagnes",
      "La Couronne de Givre",
      "Personnages",
      "Vaelira",
    ]);
  });

  it("garde la place d'un nom qui n'est pas encore arrivé", () => {
    givenNames();
    renderAt("/campaigns/c1/characters/p1/sheet");

    expect(crumbTexts()).toEqual(["Profil", "Campagnes", "…", "Personnages", "…"]);
  });

  it("ne pose aucun fil hors des écrans qui en ont un", () => {
    const { container } = renderAt("/");

    expect(container).toBeEmptyDOMElement();
  });

  it("retient la destination au lieu d'y aller quand la garde est armée", async () => {
    useLeaveGuardStore.getState().arm();
    renderAt("/campaigns/c1/characters/new");

    await userEvent.click(screen.getByRole("link", { name: "Personnages" }));

    expect(useLeaveGuardStore.getState().pendingTo).toBe("/campaigns/c1/characters");
    expect(screen.getByText("Nouveau personnage")).toHaveAttribute("aria-current", "page");
  });
});
