import { useParams } from "react-router-dom";
import { useCampaignDetail } from "@/shared/queries/use-campaign-detail";
import { useCampaignCharacters } from "../queries/use-campaign-characters";
import { useCharacterActions } from "../hooks/use-character-actions";
import { useCharacterForm } from "../hooks/use-character-form";
import { useCharacterViewer } from "../hooks/use-character-viewer";
import { useOwnerToggle } from "../hooks/use-owner-toggle";
import { CampaignCharactersView } from "../views/campaign-characters.view";

export function CampaignCharactersContainer() {
  const { campaignId = "" } = useParams();
  const { data: campaign } = useCampaignDetail(campaignId);
  const { data: characters } = useCampaignCharacters(campaignId);
  const viewer = useCharacterViewer(campaign);
  const form = useCharacterForm(campaignId);
  const actions = useCharacterActions(campaignId);
  const ownerToggle = useOwnerToggle(campaignId, campaign?.isOwner ?? false);
  if (!campaign || !characters) return null;

  return (
    <CampaignCharactersView
      characters={characters}
      viewer={viewer}
      campaignId={campaignId}
      form={form}
      ownerToggle={ownerToggle}
      {...actions}
    />
  );
}
