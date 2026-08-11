import { useParams } from "react-router-dom";
import { useCampaignExit } from "../hooks/use-campaign-exit";
import { useCampaignDetail } from "@/shared/queries/use-campaign-detail";
import { CampaignExitView } from "../views/campaign-exit.view";

export function CampaignExitContainer() {
  const { campaignId = "" } = useParams();
  const { data } = useCampaignDetail(campaignId);
  const exit = useCampaignExit(campaignId, data ?? null);

  if (!data) return null;

  return <CampaignExitView exit={exit} />;
}
