import { useCampaignsTabs } from "../hooks/use-campaigns-tabs";
import { CampaignsView } from "../views/campaigns.view";

export function CampaignsContainer() {
  const { activeTab, setActiveTab } = useCampaignsTabs();

  return <CampaignsView activeTab={activeTab} onTabChange={setActiveTab} />;
}
