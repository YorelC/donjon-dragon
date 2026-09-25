import { Link } from "react-router-dom";
import type { CampaignCharacterListItem } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { Diamond } from "@/shared/components/molecules/diamond";
import { toCharacterBuilder, toCharacterSheet } from "@/shared/constants/routes";
import { toInitials } from "@/shared/utils/display-meta";
import { CharacterReviewContainer } from "../containers/character-review.container";
import { AssignmentActions } from "./character-assignment-actions.view";
import { DeleteCharacterButton } from "./delete-character-button.view";
import { CharacterReviewStatusView } from "./character-review-status.view";

interface CharacterRowProps {
  character: CampaignCharacterListItem;
  campaignId: string;
  onDelete: (characterId: string) => void;
  onUnassign: (characterId: string) => void;
}

const UNASSIGNED_LABEL = "Non attribué";

export function CharacterRowView(props: CharacterRowProps) {
  return (
    <li className="list-row">
      <CharacterIdentity character={props.character} />
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="pill">{toAssignmentLabel(props.character)}</span>
        <RowActions {...props} />
      </div>
    </li>
  );
}

function CharacterIdentity({
  character,
}: {
  character: CampaignCharacterListItem;
}) {
  return (
    <div className="flex min-w-0 items-center gap-[18px]">
      <Diamond
        size="badge"
        tone={character.assignmentStatus === "assigned" ? "active" : "idle"}
      >
        {toInitials(character.name)}
      </Diamond>
      <div className="flex min-w-0 flex-col gap-[5px]">
        <span className="truncate font-display text-base tracking-meta text-gold-title">
          {character.name}
        </span>
        <span className="meta-line truncate">{toBuildLine(character)}</span>
        <CharacterReviewStatusView character={character} />
      </div>
    </div>
  );
}

function RowActions({
  character,
  campaignId,
  onDelete,
  onUnassign,
}: CharacterRowProps) {
  if (character.projection === "pool") return null;

  return (
    <div className="flex items-center gap-2.5">
      <SheetLink campaignId={campaignId} characterId={character.id} />
      {isCorrectable(character) ? (
        <BuilderLink campaignId={campaignId} characterId={character.id} />
      ) : null}
      <CharacterReviewContainer campaignId={campaignId} character={character} />
      {character.projection === "gameMaster" ? (
        <GameMasterActions
          character={character}
          campaignId={campaignId}
          onDelete={onDelete}
          onUnassign={onUnassign}
        />
      ) : null}
    </div>
  );
}

function GameMasterActions(props: CharacterRowProps) {
  return (
    <>
      <DeleteCharacterButton
        characterName={props.character.name}
        onDelete={() => props.onDelete(props.character.id)}
      />
      <AssignmentActions
        character={props.character}
        campaignId={props.campaignId}
        onUnassign={props.onUnassign}
      />
    </>
  );
}

interface CharacterLinkProps {
  campaignId: string;
  characterId: string;
}

function SheetLink({ campaignId, characterId }: CharacterLinkProps) {
  return (
    <Button asChild size="sm" variant="outline">
      <Link to={toCharacterSheet(campaignId, characterId)}>Voir la fiche</Link>
    </Button>
  );
}

function BuilderLink({ campaignId, characterId }: CharacterLinkProps) {
  return (
    <Button asChild size="sm" variant="outline">
      <Link to={toCharacterBuilder(campaignId, characterId)}>Éditer</Link>
    </Button>
  );
}

function toAssignmentLabel(character: CampaignCharacterListItem): string {
  if (character.projection === "pool")
    return character.assignmentStatus === "assigned"
      ? "Attribué"
      : UNASSIGNED_LABEL;

  return character.assignedTo?.displayName ?? UNASSIGNED_LABEL;
}

function toBuildLine(character: CampaignCharacterListItem): string {
  const species = character.lineageName
    ? `${character.speciesName} (${character.lineageName})`
    : character.speciesName;

  return `${species} · ${character.className} niveau ${character.level}`;
}

function isCorrectable(
  character: Exclude<CampaignCharacterListItem, { projection: "pool" }>,
): boolean {
  return character.review.status === "draft" || character.review.status === "refused";
}
