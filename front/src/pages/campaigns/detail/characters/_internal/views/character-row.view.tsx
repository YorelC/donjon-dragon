import { Link } from "react-router-dom";
import type { CampaignCharacterListItem } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { Diamond } from "@/shared/components/molecules/diamond";
import { toCharacterBuilder, toCharacterSheet } from "@/shared/constants/routes";
import { toInitials } from "@/shared/utils/display-meta";
import { CharacterAssignContainer } from "../containers/character-assign.container";
import { DeleteCharacterButton } from "./delete-character-button.view";

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
      <Diamond size="badge" tone={toMedallionTone(character)}>
        {toInitials(character.name)}
      </Diamond>
      <div className="flex min-w-0 flex-col gap-[5px]">
        <span className="truncate font-display text-base tracking-meta text-gold-title">
          {character.name}
        </span>
        <span className="meta-line truncate">{toBuildLine(character)}</span>
      </div>
    </div>
  );
}

/**
 * Un joueur ne voit qu'un résumé des fiches qui ne sont pas les siennes : le
 * serveur ne lui envoie ni le détail ni le nom de celui qui les mène. Rien à
 * proposer sur ces lignes, donc — la projection dit déjà qui peut agir.
 */
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
      <BuilderLink campaignId={campaignId} characterId={character.id} />
      <DeleteCharacterButton
        characterName={character.name}
        onDelete={() => onDelete(character.id)}
      />
      {character.projection === "gameMaster" ? (
        <AssignmentActions
          character={character}
          campaignId={campaignId}
          onUnassign={onUnassign}
        />
      ) : null}
    </div>
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

interface AssignmentActionsProps {
  character: CampaignCharacterListItem;
  campaignId: string;
  onUnassign: (characterId: string) => void;
}

function AssignmentActions({
  character,
  campaignId,
  onUnassign,
}: AssignmentActionsProps) {
  if (character.assignmentStatus === "available") {
    return (
      <CharacterAssignContainer
        campaignId={campaignId}
        characterId={character.id}
      />
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={() => onUnassign(character.id)}>
      Libérer
    </Button>
  );
}

/** Le nom du joueur quand on a le droit de le connaître, sinon le seul statut. */
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

/** L'or vif dit qu'un joueur la mène ; la fiche libre reste en retrait. */
function toMedallionTone(
  character: CampaignCharacterListItem,
): "active" | "idle" {
  return character.assignmentStatus === "assigned" ? "active" : "idle";
}
