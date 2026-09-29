import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import type { CampaignCharacterListItem } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { Diamond } from "@/shared/components/molecules/diamond";
import { toCharacterBuilder, toCharacterSheet } from "@/shared/constants/routes";
import { toInitials } from "@/shared/utils/display-meta";
import { CharacterReviewContainer } from "../containers/character-review.container";
import { AssignmentActions } from "./character-assignment-actions.view";
import { DeleteCharacterButton } from "./delete-character-button.view";
import { CharacterReviewStatusView } from "./character-review-status.view";
import { IconAction } from "./icon-action.view";
import { CharacterPersonalDetailsContainer } from "../containers/character-personal-details.container";
import type { CharacterAssignmentTarget } from "../queries/use-character-mutations";

interface CharacterRowProps {
  character: CampaignCharacterListItem;
  campaignId: string;
  onDelete: (characterId: string) => void;
  onUnassign: (target: CharacterAssignmentTarget) => void;
}

const UNASSIGNED_LABEL = "Non attribué";
const ASSIGNED_PREFIX = "Mené par";
const EDIT_LABEL = "Éditer";

/**
 * Une carte tient sur une seule hauteur, quel que soit le nombre d'actions : les
 * actions rares passent en icônes, « Voir la fiche » reste ancré au bord droit pour
 * s'aligner d'une carte à l'autre.
 */
export function CharacterRowView(props: CharacterRowProps) {
  return (
    <li className="list-row">
      <CharacterIdentity character={props.character} />
      <div className="flex shrink-0 items-center gap-2">
        <SecondaryActions {...props} />
        <CharacterReviewContainer campaignId={props.campaignId} character={props.character} />
        <SheetLink campaignId={props.campaignId} characterId={props.character.id} />
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
    <div className="flex min-w-0 flex-1 items-center gap-[18px]">
      <Diamond
        size="badge"
        tone={character.assignmentStatus === "assigned" ? "active" : "idle"}
      >
        {toInitials(character.name)}
      </Diamond>
      <div className="flex min-w-0 flex-col gap-[5px]">
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate font-display text-base tracking-meta text-gold-title">
            {character.name}
          </span>
          <CharacterReviewStatusView character={character} />
        </div>
        <span className="meta-line truncate">{toMetaLine(character)}</span>
      </div>
    </div>
  );
}

function SecondaryActions({
  character,
  campaignId,
  onDelete,
  onUnassign,
}: CharacterRowProps) {
  return (
    <>
      {isCorrectable(character) ? (
        <BuilderLink campaignId={campaignId} characterId={character.id} />
      ) : null}
      {canEditPersonalDetails(character) ? (
        <CharacterPersonalDetailsContainer campaignId={campaignId} character={character} />
      ) : null}
      {character.projection === "gameMaster" ? (
        <GameMasterActions
          character={character}
          campaignId={campaignId}
          onDelete={onDelete}
          onUnassign={onUnassign}
        />
      ) : null}
    </>
  );
}

interface GameMasterActionsProps extends Omit<CharacterRowProps, "character"> {
  character: Extract<CampaignCharacterListItem, { projection: "gameMaster" }>;
}

function GameMasterActions(props: GameMasterActionsProps) {
  return (
    <>
      <AssignmentActions
        character={props.character}
        campaignId={props.campaignId}
        onUnassign={props.onUnassign}
      />
      <DeleteCharacterButton
        characterName={props.character.name}
        onDelete={() => props.onDelete(props.character.id)}
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
    <IconAction label={EDIT_LABEL}>
      <Button asChild size="icon-sm" variant="outline">
        <Link to={toCharacterBuilder(campaignId, characterId)} aria-label={EDIT_LABEL}>
          <Pencil />
        </Link>
      </Button>
    </IconAction>
  );
}

function toMetaLine(character: CampaignCharacterListItem): string {
  return `${toBuildLine(character)} · ${toAssignmentLabel(character)}`;
}

function toAssignmentLabel(character: CampaignCharacterListItem): string {
  return character.assignedTo
    ? `${ASSIGNED_PREFIX} ${character.assignedTo.displayName}`
    : UNASSIGNED_LABEL;
}

function toBuildLine(character: CampaignCharacterListItem): string {
  const species = character.lineageName
    ? `${character.speciesName} (${character.lineageName})`
    : character.speciesName;

  return `${species} · ${character.className} niveau ${character.level}`;
}

function isCorrectable(character: CampaignCharacterListItem): boolean {
  return character.review.status === "draft" || character.review.status === "refused";
}

function canEditPersonalDetails(character: CampaignCharacterListItem): boolean {
  return character.review.status === "accepted" && character.personalDetails !== undefined;
}
