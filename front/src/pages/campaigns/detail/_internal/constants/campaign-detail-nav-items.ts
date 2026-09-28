import {
  toCampaignDetailCharacters,
  toCampaignDetailUsers,
} from "@/shared/constants/routes";

export interface CampaignDetailNavItem {
  label: string;
  route: string;
}

/** Personnages d'abord : c'est l'écran qu'ouvre une campagne. */
export function toCampaignDetailNavItems(
  campaignId: string,
): CampaignDetailNavItem[] {
  return [
    { label: "Personnages", route: toCampaignDetailCharacters(campaignId) },
    { label: "Utilisateurs", route: toCampaignDetailUsers(campaignId) },
  ];
}
