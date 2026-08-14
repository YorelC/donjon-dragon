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

/** Espèce, classe et historique n'existent qu'une fois le wizard terminé. */
function BuildSummary({ character }: { character: Character }) {
  const { build } = character;
  if (!build) return <Badge className="ml-2" variant="secondary">Brouillon</Badge>;

  return (
    <span className="ml-2 font-normal text-muted-foreground">
      {build.speciesName} · {build.className} · {build.backgroundName}
    </span>
  );
}

/** Un brouillon annonce ce qu'il lui reste à faire, pas des scores qu'il n'a pas. */
function CreationProgress({ character }: { character: Character }) {
  if (character.status === "ready") {
    return (
      <p className="w-full text-sm text-muted-foreground">
        Tirage : {character.abilityRoll?.totals.join(" · ")}
      </p>
    );
  }

  return (
    <p className="w-full text-sm text-muted-foreground">
      {character.abilityRoll
        ? "Dés lancés, choix à terminer."
        : "Création à commencer : les dés n'ont pas encore été lancés."}
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
