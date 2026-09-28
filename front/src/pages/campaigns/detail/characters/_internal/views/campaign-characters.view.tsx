import { Link } from "react-router-dom";
import type { CampaignCharacterListItem } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { Diamond } from "@/shared/components/molecules/diamond";
import { PageHeader } from "@/shared/components/molecules/page-header";
import { toCharacterNew } from "@/shared/constants/routes";
import type { CharacterViewer } from "../hooks/use-character-viewer";
import { CharacterRowView } from "./character-row.view";
import { OwnerRoleToggleView } from "./owner-role-toggle.view";
import type { CharacterAssignmentTarget } from "../queries/use-character-mutations";

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
  onUnassign: (target: CharacterAssignmentTarget) => void;
}

const GAME_MASTER_EMPTY_LIST = "Aucun personnage pour le moment.";
const PLAYER_EMPTY_LIST =
  "Tu n'as pas encore de personnage. Crée-le, ou attends que le MJ t'en attribue un.";

export function CampaignCharactersView(props: CampaignCharactersViewProps) {
  const { characters, ownerToggle } = props;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={props.campaign.name}>
        <CharacterActions
          campaignId={props.campaign.id}
          ownerToggle={ownerToggle}
          viewer={props.viewer}
          canCreate={canCreateCharacter(props.viewer, characters)}
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
  canCreate: boolean;
}

function CharacterActions({
  campaignId,
  ownerToggle,
  viewer,
  canCreate,
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
      {canCreate ? <CreateCharacterLink campaignId={campaignId} /> : null}
    </>
  );
}

function CreateCharacterLink({ campaignId }: { campaignId: string }) {
  return (
    <Button asChild>
      <Link to={toCharacterNew(campaignId)}>
        <Diamond tone="filled" />
        Créer
      </Link>
    </Button>
  );
}

interface CharacterListProps {
  characters: CampaignCharacterListItem[];
  rest: Omit<CampaignCharactersViewProps, "characters" | "ownerToggle">;
}

function CharacterList({ characters, rest }: CharacterListProps) {
  if (characters.length === 0) {
    return <p className="empty-state-text">{toEmptyListText(rest.viewer)}</p>;
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

/** Un joueur ne mène qu'un personnage : il n'en crée un que s'il n'en a aucun. */
function canCreateCharacter(
  viewer: CharacterViewer,
  characters: CampaignCharacterListItem[],
): boolean {
  return viewer.isGameMaster || characters.length === 0;
}

function toEmptyListText(viewer: CharacterViewer): string {
  return viewer.isGameMaster ? GAME_MASTER_EMPTY_LIST : PLAYER_EMPTY_LIST;
}
