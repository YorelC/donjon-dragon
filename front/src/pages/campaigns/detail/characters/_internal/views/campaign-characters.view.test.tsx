import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/shared/components/atoms/tooltip";
import type { CampaignCharacterListItem } from "@donjon-dragon/shared";
import { CampaignCharactersView } from "./campaign-characters.view";

const PLAYER = { isGameMaster: false, displayName: "Legolas" };
const GAME_MASTER = { isGameMaster: true, displayName: "Gandalf" };

// DR-007-07 : un joueur ne mène qu'un personnage, et ne voit que celui-là.
describe("CampaignCharactersView", () => {
  it("ne propose pas de créer au joueur qui a déjà son personnage", () => {
    renderList(PLAYER, [aControlledCharacter()]);

    expect(screen.getByText("Vaelira")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Créer" })).not.toBeInTheDocument();
  });

  it("propose de créer au joueur sans personnage, ou d'attendre le MJ", () => {
    renderList(PLAYER, []);

    expect(screen.getByRole("link", { name: "Créer" })).toBeInTheDocument();
    expect(screen.getByText(/attends que le MJ t'en attribue un/)).toBeInTheDocument();
  });

  it("laisse toujours le MJ créer", () => {
    renderList(GAME_MASTER, [aControlledCharacter()]);

    expect(screen.getByRole("link", { name: "Créer" })).toBeInTheDocument();
  });
});

function renderList(
  viewer: typeof PLAYER,
  characters: CampaignCharacterListItem[],
): void {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TooltipProvider>
          <CampaignCharactersView
            characters={characters} viewer={viewer}
            campaign={{ id: "550e8400-e29b-41d4-a716-446655440000", name: "La Moria" }}
            ownerToggle={{ isOwner: false, onPromote: vi.fn(), onDemote: vi.fn(), isPending: false }}
            onDelete={vi.fn()} onUnassign={vi.fn()}
          />
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function aControlledCharacter(): CampaignCharacterListItem {
  return {
    projection: "controlled", id: "660e8400-e29b-41d4-a716-446655440001",
    name: "Vaelira", portrait: null, status: "waiting_adventure",
    review: { status: "draft", submittedVersion: null, lastRejectionReason: null },
    speciesName: "Elfe", lineageName: null, className: "Rôdeur", level: 1,
    assignmentStatus: "assigned", assignedTo: { displayName: "Legolas" }, revision: 1,
    build: {
      speciesKey: "elf", speciesName: "Elfe", lineageName: null,
      classKey: "ranger", className: "Rôdeur", backgroundKey: "sage", backgroundName: "Sage",
    },
    personalDetails: {
      age: 120, weightKg: 50, description: null,
      personalityTraits: null, ideals: null, bonds: null, flaws: null,
    },
  } as CampaignCharacterListItem;
}
