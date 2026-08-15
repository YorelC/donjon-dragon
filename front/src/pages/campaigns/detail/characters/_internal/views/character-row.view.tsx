import { Link } from "react-router-dom";
import type { Character } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Button } from "@/shared/components/atoms/button";
import { toCharacterBuilder, toCharacterSheet } from "@/shared/constants/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/atoms/card";
import { CharacterAssignContainer } from "../containers/character-assign.container";

export interface CharacterRowViewer {
  isGameMaster: boolean;
  displayName: string;
}

interface CharacterRowProps {
  character: Character;
  viewer: CharacterRowViewer;
  campaignId: string;
  onDelete: (characterId: string) => void;
  onUnassign: (characterId: string) => void;
}

export function CharacterRowView(props: CharacterRowProps) {
  const { character } = props;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">
          {character.name}
          <BuildSummary character={character} />
        </CardTitle>
        <AssignmentBadge character={character} />
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <CreationProgress character={character} />
        <RowActions {...props} />
      </CardContent>
    </Card>
  );
}

function AssignmentBadge({ character }: { character: Character }) {
  if (!character.assignedTo) return <Badge variant="outline">Non attribué</Badge>;

  return <Badge>{character.assignedTo.displayName}</Badge>;
}

function BuildSummary({ character }: { character: Character }) {
  const { build } = character;

  return (
    <span className="ml-2 font-normal text-muted-foreground">
      {build.speciesName} · {build.className} · {build.backgroundName}
    </span>
  );
}

function CreationProgress({ character }: { character: Character }) {
  return (
    <p className="w-full text-sm text-muted-foreground">
      Tirage : {character.abilityRoll?.totals.join(" · ") ?? "—"}
    </p>
  );
}

function canManage(character: Character, viewer: CharacterRowViewer): boolean {
  return (
    viewer.isGameMaster ||
    character.createdByMe ||
    character.assignedTo?.displayName === viewer.displayName
  );
}

function RowActions(props: CharacterRowProps) {
  const { character, viewer, campaignId, onDelete, onUnassign } = props;
  if (!canManage(character, viewer)) return null;

  return (
    <div className="flex gap-2">
      <Button asChild size="sm" variant="outline">
        <Link to={toCharacterSheet(campaignId, character.id)}>Voir la fiche</Link>
      </Button>
      <Button asChild size="sm" variant="outline">
        <Link to={toCharacterBuilder(campaignId, character.id)}>Éditer</Link>
      </Button>
      <Button variant="destructive" size="sm" onClick={() => onDelete(character.id)}>
        Supprimer
      </Button>
      {viewer.isGameMaster ? (
        <GameMasterAssignmentActions
          character={character}
          campaignId={campaignId}
          onUnassign={onUnassign}
        />
      ) : null}
    </div>
  );
}

interface GameMasterAssignmentActionsProps {
  character: Character;
  campaignId: string;
  onUnassign: (characterId: string) => void;
}

function GameMasterAssignmentActions({
  character,
  campaignId,
  onUnassign,
}: GameMasterAssignmentActionsProps) {
  if (!character.assignedTo) {
    return <CharacterAssignContainer campaignId={campaignId} characterId={character.id} />;
  }

  return (
    <Button variant="outline" size="sm" onClick={() => onUnassign(character.id)}>
      Libérer
    </Button>
  );
}
