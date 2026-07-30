import { ROUTES } from "@/shared/constants/routes";

export interface ProfileNavItem {
  label: string;
  route: string;
}

export const PROFILE_NAV_ITEMS: ProfileNavItem[] = [
  { label: "Amis", route: ROUTES.profileFriends },
  { label: "Parametres", route: ROUTES.profileSettings },
];
