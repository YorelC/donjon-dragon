import { useParams } from "react-router-dom";
import { useAuthStore } from "@/shared/stores/auth.store";
import { useMemberManagement } from "../hooks/use-member-management";
import { useCampaignDetail } from "@/shared/queries/use-campaign-detail";
import { CampaignMembersView } from "../views/campaign-members.view";

export function CampaignMembersContainer() {
  const { campaignId = "" } = useParams();
  const { data } = useCampaignDetail(campaignId);
  const displayName = useAuthStore((s) => s.user?.displayName ?? "");
  const management = useMemberManagement(campaignId);

  // Le container racine affiche déjà chargement et erreur : ici, rien à rendre.
  if (!data) return null;

  return (
    <CampaignMembersView
      campaign={data}
      viewer={{ displayName, canManage: data.myRole === "gameMaster" }}
      management={management}
    />
  );
}
