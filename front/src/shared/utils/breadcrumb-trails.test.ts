import { describe, it, expect } from "vitest";
import {
  CAMPAIGNS_TRAIL,
  FRIENDS_TRAIL,
  SETTINGS_TRAIL,
  toCampaignTrail,
  toCampaignUsersTrail,
  toCharacterCreationTrail,
  toCharacterEditTrail,
  toCharacterSheetTrail,
  type Crumb,
} from "./breadcrumb-trails";

const campaign = { id: "c1", name: "La Couronne de Givre" };
const character = { id: "p1", name: "Vaelira" };

const labels = (trail: Crumb[]) => trail.map((crumb) => crumb.label);

describe("breadcrumb-trails", () => {
  it("« Profil » ramène aux campagnes, l'écran d'arrivée", () => {
    expect(CAMPAIGNS_TRAIL).toEqual([
      { label: "Profil", to: "/campaigns" },
      { label: "Campagnes", to: "/campaigns" },
    ]);
  });

  it("les écrans du Profil partent du Profil", () => {
    expect(FRIENDS_TRAIL).toEqual([
      { label: "Profil", to: "/campaigns" },
      { label: "Amis", to: "/profile/friends" },
    ]);
    expect(labels(SETTINGS_TRAIL)).toEqual(["Profil", "Paramètres du compte"]);
  });

  it("une campagne mène à ses personnages, l'écran qu'elle ouvre", () => {
    expect(toCampaignTrail(campaign).at(-1)).toEqual({
      label: "La Couronne de Givre",
      to: "/campaigns/c1/characters",
    });
  });

  it("les utilisateurs suivent la campagne", () => {
    expect(labels(toCampaignUsersTrail(campaign))).toEqual([
      "Profil",
      "Campagnes",
      "La Couronne de Givre",
      "Utilisateurs",
    ]);
  });

  it("la fiche passe par la liste des personnages", () => {
    const trail = toCharacterSheetTrail(campaign, character);

    expect(labels(trail)).toEqual([
      "Profil",
      "Campagnes",
      "La Couronne de Givre",
      "Personnages",
      "Vaelira",
    ]);
    expect(trail[3]?.to).toBe("/campaigns/c1/characters");
    expect(trail[4]?.to).toBe("/campaigns/c1/characters/p1/sheet");
  });

  it("le créateur nomme la création, ou le personnage qu'il corrige", () => {
    expect(toCharacterCreationTrail(campaign).at(-1)).toEqual({
      label: "Nouveau personnage",
      to: "/campaigns/c1/characters/new",
    });
    expect(toCharacterEditTrail(campaign, character).at(-1)).toEqual({
      label: "Vaelira",
      to: "/campaigns/c1/characters/p1/builder",
    });
  });
});
