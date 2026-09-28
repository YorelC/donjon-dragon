import { describe, it, expect } from "vitest";
import { toProfileNavItems } from "./profile-nav-items";
import { ROUTES } from "@/shared/constants/routes";

const PROFILE_NAV_ITEMS = toProfileNavItems({ campaignInvitations: 2, friendRequests: 1 });

describe("profile-nav-items", () => {
  it("ouvre sur les campagnes, puis les amis et les paramètres", () => {
    expect(PROFILE_NAV_ITEMS.map((item) => item.label)).toEqual([
      "Campagnes",
      "Amis",
      "Paramètres du compte",
    ]);
  });

  it("should point to campaigns route", () => {
    const campaignsItem = PROFILE_NAV_ITEMS.find((item) => item.label === "Campagnes");
    expect(campaignsItem?.route).toBe(ROUTES.campaigns);
  });

  it("frappe chaque entrée de ce qui l'attend", () => {
    expect(PROFILE_NAV_ITEMS.map((item) => item.pending?.count)).toEqual([2, 1, undefined]);
  });

  it("should point to profileFriends route", () => {
    const friendsItem = PROFILE_NAV_ITEMS.find((item) => item.label === "Amis");
    expect(friendsItem?.route).toBe(ROUTES.profileFriends);
  });

  // L'ecran des parametres est annonce, pas encore ouvert : aucune route.
  it("should leave the account settings entry inert", () => {
    const settingsItem = PROFILE_NAV_ITEMS.find(
      (item) => item.label === "Paramètres du compte",
    );
    expect(settingsItem?.route).toBeNull();
  });

  it("should use ROUTES constants, not string literals", () => {
    const routes: string[] = Object.values(ROUTES);
    PROFILE_NAV_ITEMS.filter((item) => item.route !== null).forEach((item) => {
      expect(routes).toContain(item.route);
    });
  });
});
