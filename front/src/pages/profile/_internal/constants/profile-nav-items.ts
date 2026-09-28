import type { SidebarNavItem } from "@/shared/components/layout/sidebar-layout.view";
import { CampaignInvitesBadge } from "@/shared/components/layout/campaign-invites-badge";
import { ProfileRequestsBadge } from "@/shared/components/layout/profile-requests-badge";
import { ROUTES } from "@/shared/constants/routes";

export type ProfileNavItem = SidebarNavItem;

/** Campagnes d'abord : c'est l'écran d'arrivée, celui où ramène « Profil » du fil d'Ariane. */
export const PROFILE_NAV_ITEMS: ProfileNavItem[] = [
  { label: "Campagnes", route: ROUTES.campaigns, Badge: CampaignInvitesBadge },
  { label: "Amis", route: ROUTES.profileFriends, Badge: ProfileRequestsBadge },
  { label: "Paramètres du compte", route: null },
];
