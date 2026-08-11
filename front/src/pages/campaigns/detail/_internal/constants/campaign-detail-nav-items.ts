import {
  toCampaignDetailCharacters,
  toCampaignDetailUsers,
} from "@/shared/constants/routes";

export interface CampaignDetailNavItem {
  label: string;
  route: string;
}

export function toCampaignDetailNavItems(
  campaignId: string,
): CampaignDetailNavItem[] {
  return [
    { label: "Utilisateurs", route: toCampaignDetailUsers(campaignId) },
    { label: "Personnages", route: toCampaignDetailCharacters(campaignId) },
  ];
}
