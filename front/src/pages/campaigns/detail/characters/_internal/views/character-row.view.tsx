import type { Character } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Button } from "@/shared/components/atoms/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/atoms/card";
import { CharacterAssignContainer } from "../containers/character-assign.container";
import type { CharacterFormState } from "../hooks/use-character-form";

export interface CharacterRowViewer {
  isGameMaster: boolean;
  displayName: string;
}

interface CharacterRowProps {
  character: Character;
  viewer: CharacterRowViewer;
  campaignId: string;
  form: CharacterFormState;
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
          <span className="ml-2 font-normal text-muted-foreground">
            {character.race} · {character.characterClass}
          </span>
        </CardTitle>
        <AssignmentBadge character={character} />
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <AbilityScoresSummary character={character} />
        <RowActions {...props} />
      </CardContent>
    </Card>
  );
}

function AssignmentBadge({ character }: { character: Character }) {
  if (!character.assignedTo) return <Badge variant="outline">Non attribué</Badge>;

  return <Badge>{character.assignedTo.displayName}</Badge>;
}

function AbilityScoresSummary({ character }: { character: Character }) {
  const { strength, dexterity, constitution, intelligence, wisdom, charisma } =
    character.abilityScores;

  return (
    <p className="w-full text-sm text-muted-foreground">
      FOR {strength} · DEX {dexterity} · CON {constitution} · INT {intelligence} · SAG{" "}
      {wisdom} · CHA {charisma}
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
  const { character, viewer, campaignId, form, onDelete, onUnassign } = props;
  if (!canManage(character, viewer)) return null;

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => form.onOpen(character)}>
        Modifier
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
