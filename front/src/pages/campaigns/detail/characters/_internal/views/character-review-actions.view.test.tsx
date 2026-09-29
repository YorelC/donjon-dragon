import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CampaignCharacterListItem } from "@donjon-dragon/shared";
import type { CharacterReviewActions } from "../hooks/use-character-review-actions";
import { CharacterReviewActionsView } from "./character-review-actions.view";

type ReviewStatus = CampaignCharacterListItem["review"]["status"];

// DEC-003 : le MJ fait foi sur la fiche qu'il a créée, il la valide d'un geste.
describe("CharacterReviewActionsView", () => {
  it("propose au MJ créateur de valider son brouillon, sans le soumettre", () => {
    const review = reviewActions();
    render(<CharacterReviewActionsView character={gameMasterCharacter("draft", true)} review={review} />);

    fireEvent.click(screen.getByRole("button", { name: "Valider" }));

    expect(review.onValidate).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "Soumettre" })).not.toBeInTheDocument();
  });

  it("valide par l'acceptation la fiche que le MJ créateur avait soumise, sans refus", () => {
    const review = reviewActions();
    render(<CharacterReviewActionsView character={gameMasterCharacter("submitted", true)} review={review} />);

    fireEvent.click(screen.getByRole("button", { name: "Valider" }));

    expect(review.onAccept).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "Accepter" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refuser" })).not.toBeInTheDocument();
  });

  it("laisse un autre MJ accepter ou refuser une fiche soumise", () => {
    render(<CharacterReviewActionsView character={gameMasterCharacter("submitted", false)} review={reviewActions()} />);

    expect(screen.getByRole("button", { name: "Accepter" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refuser" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Valider" })).not.toBeInTheDocument();
  });

  it("ne propose rien sur une fiche déjà acceptée", () => {
    const { container } = render(
      <CharacterReviewActionsView character={gameMasterCharacter("accepted", true)} review={reviewActions()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

function reviewActions(): CharacterReviewActions {
  return {
    reason: "", isPending: false, onReasonChange: vi.fn(), onSubmit: vi.fn(),
    onAccept: vi.fn(), onRefuse: vi.fn(), onValidate: vi.fn(),
  };
}

function gameMasterCharacter(status: ReviewStatus, createdByMe: boolean): CampaignCharacterListItem {
  return {
    projection: "gameMaster", id: "660e8400-e29b-41d4-a716-446655440001",
    name: "Elfelet", portrait: null, status: "waiting_adventure", createdByMe,
    review: { status, submittedVersion: null, lastRejectionReason: null },
    speciesName: "Elfe", lineageName: "Haut-elfe", className: "Barbare", level: 1,
    assignmentStatus: "available", assignedTo: null, revision: 1,
  } as CampaignCharacterListItem;
}
