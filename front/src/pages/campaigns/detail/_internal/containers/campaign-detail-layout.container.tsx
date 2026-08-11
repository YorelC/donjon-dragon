import { useParams } from "react-router-dom";
import { useCampaignDetail } from "@/shared/queries/use-campaign-detail";
import { toCampaignDetailNavItems } from "../constants/campaign-detail-nav-items";
import { CampaignDetailLayoutView } from "../views/campaign-detail-layout.view";

export function CampaignDetailLayoutContainer() {
  const { campaignId = "" } = useParams();
  const detailQuery = useCampaignDetail(campaignId);

  return (
    <CampaignDetailLayoutView
      campaign={{
        data: detailQuery.data ?? null,
        loading: detailQuery.isLoading,
        error: detailQuery.isError,
      }}
      items={toCampaignDetailNavItems(campaignId)}
    />
  );
}
