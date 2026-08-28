import { describe, it, expect } from "vitest";
import { PROFILE_NAV_ITEMS } from "./profile-nav-items";
import { ROUTES } from "@/shared/constants/routes";

describe("profile-nav-items", () => {
  it("should have 2 items", () => {
    expect(PROFILE_NAV_ITEMS).toHaveLength(2);
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
    PROFILE_NAV_ITEMS.filter((item) => item.route !== null).forEach((item) => {
      expect(item.route).toMatch(/^\/profile\//);
    });
  });
});
