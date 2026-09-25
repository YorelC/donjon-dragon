import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { CampaignCharacterListItem } from "@donjon-dragon/shared";
import { CharacterRowView } from "./character-row.view";

describe("CharacterRowView", () => {
  it("ne plante pas sur une projection acceptée chargée avant personalDetails", () => {
    renderRow(legacyAcceptedCharacter());

    expect(screen.getByText("Vaelira")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Détails" })).not.toBeInTheDocument();
  });
});

function renderRow(character: CampaignCharacterListItem): void {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CharacterRowView
          character={character} campaignId="550e8400-e29b-41d4-a716-446655440000"
          onDelete={vi.fn()} onUnassign={vi.fn()}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function legacyAcceptedCharacter(): CampaignCharacterListItem {
  return {
    projection: "controlled", id: "660e8400-e29b-41d4-a716-446655440001",
    name: "Vaelira", portrait: null, status: "waiting_adventure",
    review: { status: "accepted", submittedVersion: 1, lastRejectionReason: null },
    speciesName: "Elfe", lineageName: null, className: "Rôdeur", level: 1,
    assignmentStatus: "assigned", assignedTo: { displayName: "Legolas" }, revision: 3,
    build: {
      speciesKey: "elf", speciesName: "Elfe", lineageName: null,
      classKey: "ranger", className: "Rôdeur", backgroundKey: "sage", backgroundName: "Sage",
    },
  } as CampaignCharacterListItem;
}
