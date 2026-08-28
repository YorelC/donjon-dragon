import { useMyCampaigns } from "../queries/use-my-campaigns";

/** Le décompte que se partagent le surtitre de la page et l'onglet des campagnes. */
export interface CampaignsCounts {
  campaigns: number;
}

export function useCampaignsCounts(): CampaignsCounts {
  const campaignsQuery = useMyCampaigns();

  return { campaigns: campaignsQuery.data?.length ?? 0 };
}
