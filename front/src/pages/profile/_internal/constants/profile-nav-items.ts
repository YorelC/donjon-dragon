import type { SidebarNavItem } from "@/shared/components/layout/sidebar-layout.view";
import { ROUTES } from "@/shared/constants/routes";

export type ProfileNavItem = SidebarNavItem;

/** Ce qui attend l'utilisateur, écran par écran de la barre. */
export interface ProfileNavCounts {
  campaignInvitations: number;
  friendRequests: number;
}

const ENTRY_LABELS = {
  campaigns: "Campagnes",
  friends: "Amis",
  settings: "Compte",
} as const;

const PENDING_LABELS = {
  campaignInvitations: "demandes de campagne",
  friendRequests: "demandes d'amis",
} as const;

/** Campagnes d'abord : c'est l'écran d'arrivée, celui où ramène « Profil » du fil d'Ariane. */
export function toProfileNavItems(counts: ProfileNavCounts): ProfileNavItem[] {
  return [
    {
      label: ENTRY_LABELS.campaigns,
      route: ROUTES.campaigns,
      pending: { count: counts.campaignInvitations, label: PENDING_LABELS.campaignInvitations },
    },
    {
      label: ENTRY_LABELS.friends,
      route: ROUTES.profileFriends,
      pending: { count: counts.friendRequests, label: PENDING_LABELS.friendRequests },
    },
    { label: ENTRY_LABELS.settings, route: null },
  ];
}
