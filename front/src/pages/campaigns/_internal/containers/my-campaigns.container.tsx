import { useMyCampaigns } from "../queries/use-my-campaigns";
import { MyCampaignsView } from "../views/my-campaigns.view";

export function MyCampaignsContainer() {
  const campaignsQuery = useMyCampaigns();

  return (
    <MyCampaignsView
      campaigns={{
        data: campaignsQuery.data ?? [],
        loading: campaignsQuery.isLoading,
        error: campaignsQuery.isError,
      }}
    />
  );
}
