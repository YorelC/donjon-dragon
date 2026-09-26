import type {
  CatalogBackground,
  CatalogClass,
  CatalogLanguage,
  CatalogSpecies,
  CreatureSize,
  DndCatalog,
  Language,
} from "@donjon-dragon/shared";

/**
 * Un catalogue de test, construit au type réel — sans cast.
 *
 * Les suites du wizard en fabriquaient chacune un fragment en
 * `as unknown as DndCatalog` : le jour où le contrat gagne un champ, aucune
 * d'elles ne le voit, et c'est précisément ce qui a laissé le front oublier
 * taille et langues. Ici, `tsc` casse.
 */
export function aCatalog(overrides: Partial<DndCatalog> = {}): DndCatalog {
  return {
    species: [aSpecies()],
    classes: [aClass()],
    backgrounds: [aBackground()],
    originFeats: [],
    skillLabels: {},
    toolLabels: {},
    weaponLabels: {},
    languages: { standard: STANDARD_LANGUAGES.map(named), rare: RARE_LANGUAGES.map(named) },
    alignments: [{ key: "neutralGood", name: "Neutre bon" }],
    trinkets: [],
    invocations: [],
    familiarForms: [],
    pactWeaponOptions: [],
    ...overrides,
  };
}

/** Les neuf standards et deux rares : de quoi prouver qu'on ne mélange pas. */
const STANDARD_LANGUAGES: readonly Language[] = [
  "commonSignLanguage",
  "draconic",
  "dwarvish",
  "elvish",
  "giant",
  "gnomish",
  "goblin",
  "halfling",
  "orc",
];

const RARE_LANGUAGES: readonly Language[] = ["abyssal", "celestial"];

function named(key: Language): CatalogLanguage {
  return { key, name: key };
}

/** Une espèce à taille imposée, sauf si le test demande le contraire. */
export function aSpecies(overrides: Partial<CatalogSpecies> = {}): CatalogSpecies {
  return {
    key: "dwarf",
    name: "Nain",
    size: "Medium",
    sizeOptions: ["Medium"],
    physicalBounds: {
      heightCm: { min: 122, max: 152 },
      weightKg: { min: 53, max: 103 },
      mediumFromHeightCm: null,
    },
    speed: 9,
    darkvision: 18,
    traits: [],
    skillChoice: null,
    grantsOriginFeatChoice: false,
    lineage: null,
    ...overrides,
  };
}

/** Une espèce à lignage, dont la lignée fait choisir sa caractéristique d'incantation. */
export function aSpeciesWithMagicalLineage(
  key: CatalogSpecies["key"] = "elf",
): CatalogSpecies {
  return aSpecies({
    key,
    name: key,
    lineage: {
      label: "Lignée",
      spellcastingAbilityOptions: ["intelligence", "charisma"],
      options: [{ key: "drow", name: "Drow", description: "", traits: [] }],
    },
  });
}

/** Une espèce dont la catégorie P/M est déduite de la taille physique. */
export function aSpeciesWithSizeChoice(
  key: CatalogSpecies["key"],
  options: readonly CreatureSize[] = ["Small", "Medium"],
): CatalogSpecies {
  return aSpecies({
    key,
    name: key,
    size: "Medium",
    sizeOptions: [...options],
    physicalBounds: {
      heightCm: { min: 61, max: 213 },
      weightKg: { min: 17, max: 123 },
      mediumFromHeightCm: 122,
    },
  });
}

/** Par défaut, une classe ne fait choisir ni maîtrise, ni outil, ni langue. */
const NO_BOUNDED_CHOICE = {
  weaponMastery: null,
  toolChoice: null,
  grantsLanguageChoice: false,
} as const;

export function aClass(overrides: Partial<CatalogClass> = {}): CatalogClass {
  return {
    key: "cleric",
    name: "Clerc",
    primaryAbilities: ["wisdom"],
    hitDie: 8,
    savingThrows: ["wisdom", "charisma"],
    skillChoice: { count: 0, options: [] },
    toolProficiencies: [],
    armorTraining: [],
    weaponProficiencies: [],
    startingEquipment: emptyEquipment(),
    spellcasting: null,
    level1Features: [],
    expertiseCount: 0,
    level1Choices: [],
    ...NO_BOUNDED_CHOICE,
    ...overrides,
  };
}

function emptyEquipment() {
  return { options: [{ id: "A", label: "A", entries: [], gold: 0, itemChoice: null }] };
}

export function aBackground(overrides: Partial<CatalogBackground> = {}): CatalogBackground {
  return {
    key: "acolyte",
    name: "Acolyte",
    description: "",
    abilityBonuses: ["wisdom"],
    originFeat: "magic-initiate",
    originFeatSpellList: null,
    skillProficiencies: [],
    toolProficiency: "",
    toolOptions: [],
    fixedTool: null,
    equipment: {
      options: [{ id: "A", label: "A", entries: [], gold: 0, itemChoice: null }],
    },
    ...overrides,
  };
}
