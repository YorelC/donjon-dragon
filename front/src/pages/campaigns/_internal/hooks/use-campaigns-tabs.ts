import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CAMPAIGN_INVITATION_COUNT_KEY } from "@/shared/queries/use-campaign-invitation-count";

export type CampaignsTab = "mine" | "invitations";

const DEFAULT_TAB: CampaignsTab = "mine";
const INVITATIONS_TAB: CampaignsTab = "invitations";

export function useCampaignsTabs() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<CampaignsTab>(DEFAULT_TAB);

  // Le compteur a un staleTime : sans cette invalidation, ouvrir l'onglet
  // afficherait une liste fraîche sous un badge périmé.
  function selectTab(tab: CampaignsTab) {
    setActiveTab(tab);
    if (tab === INVITATIONS_TAB) {
      queryClient.invalidateQueries({ queryKey: CAMPAIGN_INVITATION_COUNT_KEY });
    }
  }

  return { activeTab, setActiveTab: selectTab };
}
