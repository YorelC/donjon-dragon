import { useCampaignsTabs } from "../hooks/use-campaigns-tabs";
import { useCampaignsCounts } from "../hooks/use-campaigns-counts";
import { CampaignsView } from "../views/campaigns.view";

export function CampaignsContainer() {
  const { activeTab, setActiveTab } = useCampaignsTabs();
  const counts = useCampaignsCounts();

  return (
    <CampaignsView
      activeTab={activeTab}
      onTabChange={setActiveTab}
      counts={counts}
    />
  );
}
