import type { ComputedCharacter } from "@donjon-dragon/shared";
import { describe, expect, it } from "vitest";
import { aBackground, aCatalog, aClass, aSpecies } from "./catalog.fixture";
import { EMPTY_COMPOSITION, type CharacterComposition } from "./character-composition";
import { toCharacterRecap, UNNAMED_CHARACTER } from "./character-recap";
import { aPreview, noSpells } from "./preview.fixture";

const RANGER = aClass({
  key: "ranger",
  name: "Rôdeur",
  primaryAbilities: ["dexterity", "wisdom"],
  weaponProficiencies: ["simple", "martial"],
  level1Features: [{ key: "favored", name: "Ennemi juré", description: "Marque du chasseur.", grantedSpells: [] }],
});

function aRecap(
  composition: Partial<CharacterComposition>,
  preview: ComputedCharacter | null = aPreview(),
) {
  const catalog = aCatalog({
    species: [aSpecies({ traits: [{ key: "t", name: "Robustesse", description: "+1 PV", grantedSpells: [] }] })],
    classes: [RANGER],
    backgrounds: [aBackground({ key: "guide", name: "Guide" })],
  });

  return toCharacterRecap({
    context: { catalog, composition: { ...EMPTY_COMPOSITION, speciesKey: "dwarf", ...composition } },
    preview,
    spells: noSpells(),
  });
}

describe("récapitulatif du personnage", () => {
  it("nomme le héros, son origine et sa classe, blason compris", () => {
    const recap = aRecap({ name: "Vaelira", classKey: "ranger", backgroundKey: "guide" });

    expect(recap).toMatchObject({
      crest: "RÔ",
      name: "Vaelira",
      origin: "Nain",
      classLine: "Niveau 1 Rôdeur · Guide",
      alignment: "Aucun alignement choisi",
    });
  });

  // Le parcours e2e reconnaît le récapitulatif vide à ce libellé.
  it("annonce un personnage à créer tant qu'il n'a pas de nom", () => {
    expect(aRecap({ name: "  " }).name).toBe(UNNAMED_CHARACTER);
  });

  it("étoile les caractéristiques principales de la classe", () => {
    const recap = aRecap({ classKey: "ranger" });
    const primary = recap.abilities.filter((ability) => ability.primary).map((ability) => ability.ability);

    expect(primary).toEqual(["dexterity", "wisdom"]);
  });

  it("lit PV, maîtrise, CA et initiative dans l'aperçu serveur", () => {
    expect(aRecap({}).stats).toEqual([
      { label: "PV", value: "13" },
      { label: "Maîtrise", value: "+2" },
      { label: "CA", value: "14" },
      { label: "Init.", value: "+3" },
    ]);
  });

  /** Avant l'aperçu, la saisie manuelle du MJ donne déjà des scores lisibles. */
  it("retombe sur les scores saisis, et un tiret pour ce que seul le serveur calcule", () => {
    const manualScores = { ...EMPTY_COMPOSITION.manualScores, strength: 17 };
    const recap = aRecap({ abilityMethod: "manual", manualScores }, null);

    expect(recap.abilities[0]).toMatchObject({ score: 17, modifier: "+3" });
    expect(recap.stats.map((stat) => stat.value)).toEqual(["—", "—", "—", "—"]);
  });

  it("condense traits et aptitudes du catalogue avant l'aperçu serveur", () => {
    const recap = aRecap({ classKey: "ranger" }, null);

    expect(recap.tokenGroups).toEqual([{
      heading: "Actions et aptitudes",
      tokens: [
        { name: "Robustesse", effect: "+1 PV" },
        { name: "Ennemi juré", effect: "Marque du chasseur." },
      ],
    }]);
  });

  it("nomme les maîtrises en français, et dit « Aucune » quand il n'y en a pas", () => {
    const lines = aRecap({ classKey: "ranger" }).proficiencies;

    expect(lines).toContainEqual({ name: "Armes", value: "simples, de guerre" });
    expect(lines).toContainEqual({ name: "Outils", value: "Aucune" });
  });

  it("donne vitesse, taille et vision dans le noir", () => {
    expect(aRecap({}).vitals).toEqual([
      { label: "Vitesse", value: "9 m" },
      { label: "Taille", value: "M" },
      { label: "Vision dans le noir", value: "36 m" },
    ]);
  });
});
