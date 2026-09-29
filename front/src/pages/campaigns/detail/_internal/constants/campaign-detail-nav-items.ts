import {
  toCampaignDetailCharacters,
  toCampaignDetailUsers,
} from "@/shared/constants/routes";
import { SCREEN_LABELS } from "@/shared/constants/screen-labels";

export interface CampaignDetailNavItem {
  label: string;
  route: string;
}

/** Personnages d'abord : c'est l'écran qu'ouvre une campagne. */
export function toCampaignDetailNavItems(
  campaignId: string,
): CampaignDetailNavItem[] {
  return [
    { label: SCREEN_LABELS.campaignCharacters, route: toCampaignDetailCharacters(campaignId) },
    { label: SCREEN_LABELS.campaignUsers, route: toCampaignDetailUsers(campaignId) },
  ];
}
