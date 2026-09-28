import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AppBreadcrumb } from "@/shared/components/layout/breadcrumb.container";
import { useCampaignDetail } from "@/shared/queries/use-campaign-detail";
import { useCampaignCharacters } from "@/shared/queries/use-campaign-characters";
import { useLeaveGuardStore } from "@/shared/stores/leave-guard.store";
import { LeaveBuilderContainer } from "./leave-builder.container";

vi.mock("@/shared/queries/use-campaign-detail", () => ({ useCampaignDetail: vi.fn() }));
vi.mock("@/shared/queries/use-campaign-characters", () => ({
  useCampaignCharacters: vi.fn(),
}));

const BUILDER_ROUTE = "/campaigns/:campaignId/characters/new";

function CurrentPath() {
  return <output aria-label="adresse">{useLocation().pathname}</output>;
}

/** Le bandeau et le créateur côte à côte, comme dans l'application. */
function renderBuilder() {
  render(
    <MemoryRouter initialEntries={["/campaigns/c1/characters/new"]}>
      <AppBreadcrumb />
      <Routes>
        <Route path={BUILDER_ROUTE} element={<LeaveBuilderContainer />} />
        <Route path="*" element={null} />
      </Routes>
      <CurrentPath />
    </MemoryRouter>,
  );
}

// Modale ouverte, le reste de la page sort de l'arbre d'accessibilité : l'adresse aussi.
const path = () => screen.getByRole("status", { name: "adresse", hidden: true }).textContent;
const dialog = () => screen.queryByRole("alertdialog");

describe("LeaveBuilderContainer", () => {
  beforeEach(() => {
    vi.mocked(useCampaignDetail).mockReturnValue({
      data: { name: "La Couronne de Givre" },
    } as ReturnType<typeof useCampaignDetail>);
    vi.mocked(useCampaignCharacters).mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof useCampaignCharacters>);
  });

  it("une étape du fil demande confirmation au lieu de partir", async () => {
    renderBuilder();

    await userEvent.click(screen.getByRole("link", { name: "Campagnes" }));

    expect(dialog()).toBeInTheDocument();
    expect(path()).toBe("/campaigns/c1/characters/new");
  });

  it("continuer la création referme la modale sur place", async () => {
    renderBuilder();
    await userEvent.click(screen.getByRole("link", { name: "Campagnes" }));

    await userEvent.click(screen.getByRole("button", { name: "Continuer la création" }));

    expect(dialog()).toBeNull();
    expect(path()).toBe("/campaigns/c1/characters/new");
    expect(useLeaveGuardStore.getState().pendingTo).toBeNull();
  });

  it("quitter mène à l'étape cliquée, et désarme la garde", async () => {
    renderBuilder();
    await userEvent.click(screen.getByRole("link", { name: "Campagnes" }));

    await userEvent.click(screen.getByRole("link", { name: "Quitter sans sauvegarder" }));

    expect(path()).toBe("/campaigns");
    expect(useLeaveGuardStore.getState().isArmed).toBe(false);
  });

  it("le bouton de retour ramène aux personnages, après confirmation", async () => {
    renderBuilder();

    await userEvent.click(screen.getByRole("button", { name: /Retour aux personnages/ }));
    await userEvent.click(screen.getByRole("link", { name: "Quitter sans sauvegarder" }));

    expect(path()).toBe("/campaigns/c1/characters");
  });
});
