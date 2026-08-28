import { ROUTES } from "@/shared/constants/routes";

export interface ProfileNavItem {
  label: string;
  /** `null` : jalon inerte, l'écran est annoncé mais pas encore ouvert. */
  route: string | null;
}

export const PROFILE_NAV_ITEMS: ProfileNavItem[] = [
  { label: "Amis", route: ROUTES.profileFriends },
  { label: "Paramètres du compte", route: null },
];
