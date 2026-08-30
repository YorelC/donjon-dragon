import { Link } from "react-router-dom";
import type { CampaignCharacterListItem } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { Diamond } from "@/shared/components/molecules/diamond";
import { PageHeader } from "@/shared/components/molecules/page-header";
import { ROUTES, toCharacterNew } from "@/shared/constants/routes";
import type { CharacterViewer } from "../hooks/use-character-viewer";
import { CharacterRowView } from "./character-row.view";
import { OwnerRoleToggleView } from "./owner-role-toggle.view";

export interface OwnerToggle {
  isOwner: boolean;
  onPromote: () => void;
  onDemote: () => void;
  isPending: boolean;
}

interface CampaignCharactersViewProps {
  characters: CampaignCharacterListItem[];
  viewer: CharacterViewer;
  campaign: { id: string; name: string };
  ownerToggle: OwnerToggle;
  onDelete: (characterId: string) => void;
  onUnassign: (characterId: string) => void;
}

const BACK_TO_CAMPAIGNS = {
  to: ROUTES.campaigns,
  label: "Toutes mes campagnes",
};

export function CampaignCharactersView(props: CampaignCharactersViewProps) {
  const { characters, ownerToggle } = props;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader back={BACK_TO_CAMPAIGNS} title={props.campaign.name}>
        <CharacterActions
          campaignId={props.campaign.id}
          ownerToggle={ownerToggle}
          viewer={props.viewer}
        />
      </PageHeader>
      <CharacterList characters={characters} rest={props} />
    </div>
  );
}

interface CharacterActionsProps {
  campaignId: string;
  ownerToggle: OwnerToggle;
  viewer: CharacterViewer;
}

function CharacterActions({
  campaignId,
  ownerToggle,
  viewer,
}: CharacterActionsProps) {
  return (
    <>
      {ownerToggle.isOwner ? (
        <OwnerRoleToggleView
          isGameMaster={viewer.isGameMaster}
          onPromote={ownerToggle.onPromote}
          onDemote={ownerToggle.onDemote}
          isPending={ownerToggle.isPending}
        />
      ) : null}
      <Button asChild>
        <Link to={toCharacterNew(campaignId)}>
          <Diamond tone="filled" />
          Créer
        </Link>
      </Button>
    </>
  );
}

interface CharacterListProps {
  characters: CampaignCharacterListItem[];
  rest: Omit<CampaignCharactersViewProps, "characters" | "ownerToggle">;
}

function CharacterList({ characters, rest }: CharacterListProps) {
  if (characters.length === 0) {
    return <p className="empty-state-text">Aucun personnage pour le moment.</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {characters.map((character) => (
        <CharacterRowView
          key={character.id}
          character={character}
          campaignId={rest.campaign.id}
          onDelete={rest.onDelete}
          onUnassign={rest.onUnassign}
        />
      ))}
    </ul>
  );
}
