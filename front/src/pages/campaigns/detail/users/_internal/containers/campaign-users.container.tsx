import { useParams } from "react-router-dom";
import { useCampaignDetail } from "@/shared/queries/use-campaign-detail";
import { CampaignUsersView } from "../views/campaign-users.view";

export function CampaignUsersContainer() {
  const { campaignId = "" } = useParams();
  const { data } = useCampaignDetail(campaignId);

  // Le layout affiche déjà chargement et erreur : ici, rien à rendre.
  if (!data) return null;

  return <CampaignUsersView campaign={data} />;
}
