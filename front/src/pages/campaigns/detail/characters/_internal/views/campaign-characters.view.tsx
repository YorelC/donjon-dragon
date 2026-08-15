import { Link } from "react-router-dom";
import type { Character } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { toCharacterNew } from "@/shared/constants/routes";
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
  ownerToggle: OwnerToggle;
  onDelete: (characterId: string) => void;
  onUnassign: (characterId: string) => void;
}

export function CampaignCharactersView(props: CampaignCharactersViewProps) {
  const { characters, ownerToggle } = props;

  return (
    <div className="space-y-4">
      <Header campaignId={props.campaignId} ownerToggle={ownerToggle} viewer={props.viewer} />
      <CharacterList characters={characters} rest={props} />
    </div>
  );
}

interface HeaderProps {
  campaignId: string;
  ownerToggle: OwnerToggle;
  viewer: CharacterRowViewer;
}

function Header({ campaignId, ownerToggle, viewer }: HeaderProps) {
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
        <Button asChild size="sm">
          <Link to={toCharacterNew(campaignId)}>Nouveau personnage</Link>
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
          onDelete={rest.onDelete}
          onUnassign={rest.onUnassign}
        />
      ))}
    </div>
  );
}
