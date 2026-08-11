import type { Character } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import type { CharacterFormState } from "../hooks/use-character-form";
import { CharacterFormView } from "./character-form.view";
import { CharacterRowView, type CharacterRowViewer } from "./character-row.view";
import { OwnerRoleToggleView } from "./owner-role-toggle.view";

export interface OwnerToggle {
  isOwner: boolean;
  onPromote: () => void;
  onDemote: () => void;
  isPending: boolean;
}

interface CampaignCharactersViewProps {
  characters: Character[];
  viewer: CharacterRowViewer;
  campaignId: string;
  form: CharacterFormState;
  ownerToggle: OwnerToggle;
  onDelete: (characterId: string) => void;
  onUnassign: (characterId: string) => void;
}

export function CampaignCharactersView(props: CampaignCharactersViewProps) {
  const { characters, form, ownerToggle } = props;

  return (
    <div className="space-y-4">
      <Header form={form} ownerToggle={ownerToggle} viewer={props.viewer} />
      <CharacterFormView form={form} />
      <CharacterList characters={characters} rest={props} />
    </div>
  );
}

interface HeaderProps {
  form: CharacterFormState;
  ownerToggle: OwnerToggle;
  viewer: CharacterRowViewer;
}

function Header({ form, ownerToggle, viewer }: HeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="section-title text-base">Personnages</h2>
      <div className="flex gap-2">
        {ownerToggle.isOwner ? (
          <OwnerRoleToggleView
            isGameMaster={viewer.isGameMaster}
            onPromote={ownerToggle.onPromote}
            onDemote={ownerToggle.onDemote}
            isPending={ownerToggle.isPending}
          />
        ) : null}
        <Button size="sm" onClick={() => form.onOpen(null)}>
          Nouveau personnage
        </Button>
      </div>
    </div>
  );
}

interface CharacterListProps {
  characters: Character[];
  rest: Omit<CampaignCharactersViewProps, "characters" | "ownerToggle">;
}

function CharacterList({ characters, rest }: CharacterListProps) {
  if (characters.length === 0) {
    return <p className="empty-state-text">Aucun personnage pour le moment.</p>;
  }

  return (
    <div className="space-y-2">
      {characters.map((character) => (
        <CharacterRowView
          key={character.id}
          character={character}
          viewer={rest.viewer}
          campaignId={rest.campaignId}
          form={rest.form}
          onDelete={rest.onDelete}
          onUnassign={rest.onUnassign}
        />
      ))}
    </div>
  );
}
