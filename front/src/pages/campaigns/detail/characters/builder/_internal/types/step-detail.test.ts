import type { CatalogSpell, Item } from "@donjon-dragon/shared";
import { describe, expect, it } from "vitest";
import { aBackground, aCatalog, aClass, aSpecies, aSpeciesWithMagicalLineage } from "./catalog.fixture";
import { EMPTY_COMPOSITION, type CharacterComposition } from "./character-composition";
import { equipmentFocusKey } from "./equipment-detail";
import { aPreview, noSpells } from "./preview.fixture";
import { stepDetailOf } from "./step-detail";
import type { DetailSource } from "./step-detail-parts";
import type { BuilderStep } from "./builder-steps";

const DWARF = aSpecies({
  description: "Façonnés dans la pierre et le fer.",
  traits: [{ key: "toughness", name: "Robustesse naine", description: "+1 PV par niveau.", grantedSpells: [] }],
});
const ELF = aSpecies({ key: "elf", name: "Elfe", darkvision: 0 });
const RANGER = aClass({
  key: "ranger",
  name: "Rôdeur",
  hitDie: 10,
  primaryAbilities: ["dexterity", "wisdom"],
  savingThrows: ["strength", "dexterity"],
  weaponProficiencies: ["simple", "martial"],
  level1Choices: [{
    key: "fightingStyle", name: "Style de combat", description: "Un don de Style de combat.",
    options: [{ key: "archery", name: "Archerie", description: "+2 aux attaques à distance.", grantedSpells: [] }],
  }],
  spellcasting: {
    ability: "wisdom", cantripsKnown: 0, spellsPrepared: 2, spellbookSize: 0,
    level1Slots: 2, focus: "Focaliseur druidique",
  },
});
const MARK: CatalogSpell = {
  key: "hunters-mark", name: "Marque du chasseur", level: 1, school: "Divination",
  castingTime: "Action bonus", range: "27 m", duration: "1 heure", concentration: true,
  ritual: false, description: "Vous marquez une créature visible.",
};

function aSource(composition: Partial<CharacterComposition>, focusKey: string | null = null): DetailSource {
  const catalog = aCatalog({
    species: [DWARF, ELF, aSpeciesWithMagicalLineage("tiefling")],
    classes: [RANGER],
    backgrounds: [aBackground()],
  });

  return {
    context: { catalog, composition: { ...EMPTY_COMPOSITION, speciesKey: "dwarf", ...composition } },
    focusKey,
    spells: noSpells({ classSpells: { classKey: "ranger", cantrips: [], level1: [MARK] }, classSpellsPrepared: 2 }),
    preview: aPreview(),
    items: [{ key: "rope", name: "Corde en chanvre" } as Item],
  };
}

function detailOf(step: BuilderStep, source: DetailSource) {
  return stepDetailOf(step, source);
}

describe("fiche détaillée", () => {
  it("montre l'espèce retenue : gabarit, vitesse, vision et traits", () => {
    const detail = detailOf("species", aSource({}));

    expect(detail.title).toBe("Nain");
    expect(detail.badges).toContainEqual({ label: "Vision dans le noir", value: "18 m" });
    expect(detail.blocks[0]?.items).toEqual([{ name: "Robustesse naine", text: "+1 PV par niveau." }]);
  });

  it("ouvre la fiche d'espèce sur sa description", () => {
    expect(detailOf("species", aSource({})).lede).toBe("Façonnés dans la pierre et le fer.");
  });

  // Le texte du choix lui-même restait invisible dès qu'une option était retenue.
  it("garde la description du Style de combat sous l'option retenue", () => {
    const detail = detailOf("fightingStyle", aSource({ classKey: "ranger", fightingStyle: "archery" }));

    expect(detail.lede).toBe("+2 aux attaques à distance.");
    expect(detail.blocks).toContainEqual(expect.objectContaining({
      heading: "Style de combat", body: "Un don de Style de combat.",
    }));
  });

  it("dit à quoi sert le lignage et sa caractéristique d'incantation", () => {
    const detail = detailOf("lineage", aSource({ speciesKey: "tiefling" }));

    expect(detail.lede).toMatch(/pouvoirs surnaturels/);
    expect(detail.blocks[0]?.body).toMatch(/^Elle détermine le degré de difficulté/);
  });

  it("explique l'alignement et décrit celui qui est survolé", () => {
    const detail = detailOf("identity", aSource({}, "neutralGood"));
    const alignment = detail.blocks.find((block) => block.heading === "Alignement");

    expect(alignment?.body).toMatch(/boussole morale/);
    expect(alignment?.items).toEqual([{ name: "Neutre bon", text: "Le bien sans code." }]);
  });

  it("montre l'option survolée plutôt que celle retenue", () => {
    const detail = detailOf("species", aSource({}, "elf"));

    expect(detail.title).toBe("Elfe");
    expect(detail.badges).toContainEqual({ label: "Vision dans le noir", value: "Aucune" });
  });

  it("résume la classe : dé de vie, caractéristiques, sauvegardes et maîtrises", () => {
    const detail = detailOf("class", aSource({ classKey: "ranger" }));

    expect(detail.badges).toEqual([
      { label: "Dé de vie", value: "d10" },
      { label: "Caractéristiques", value: "Dextérité, Sagesse" },
      { label: "Sauvegardes", value: "Force, Dextérité" },
    ]);
    expect(detail.blocks.find((block) => block.heading === "Maîtrises")?.items[0])
      .toEqual({ name: "Armes", text: "armes simples, armes de guerre" });
  });

  it("invite à choisir tant que rien n'est retenu ni survolé", () => {
    expect(detailOf("class", aSource({})).title).toBe("Choisissez une classe");
  });

  it("donne la fiche complète d'un sort survolé, et dit s'il est retenu", () => {
    const detail = detailOf("spells", aSource({ classKey: "ranger", classSpells: ["hunters-mark"] }, "hunters-mark"));

    expect(detail.kicker).toBe("Sort de niveau 1 · Divination");
    expect(detail.badges).toContainEqual({ label: "Durée", value: "Concentration, 1 heure" });
    expect(detail.blocks[0]?.items[0]?.name).toBe("Retenu");
  });

  it("compte la sélection de sorts sans survol", () => {
    const detail = detailOf("spells", aSource({ classKey: "ranger", classSpells: ["hunters-mark"] }));

    expect(detail.badges[0]).toEqual({ label: "À choisir", value: "1 / 2" });
    expect(detail.blocks[0]?.items).toEqual([{ name: "Marque du chasseur", text: "" }]);
  });

  it("distingue les paquetages de classe et d'historique qui portent la même lettre", () => {
    const detail = detailOf("equipment", aSource({ classKey: "ranger", backgroundKey: "acolyte" }, equipmentFocusKey("background", "A")));

    expect(detail.kicker).toBe("Paquetage d'historique");
    expect(detail.title).toBe("Option A");
  });

  it("dit l'état d'une langue survolée", () => {
    const detail = detailOf("languages", aSource({ standardLanguages: ["elvish"] }, "elvish"));

    expect(detail.badges).toEqual([{ label: "État", value: "Retenu" }]);
  });
});
