import type {
  Ability,
  BackgroundAbilityBonuses,
  BackgroundKey,
  CharacterChoice,
  ClassKey,
  DndCatalog,
  FinalizeCharacterDto,
  OriginFeatKey,
  PreviewCharacterSheetDto,
  SkillName,
  SpeciesKey,
} from "@donjon-dragon/shared";

/** Les 18 compétences, lues du catalogue plutôt que redites côté front. */
export function allSkillsOf(catalog: DndCatalog): SkillName[] {
  return Object.keys(catalog.skillLabels) as SkillName[];
}

export const ABILITY_LABELS: Record<Ability, string> = {
  strength: "Force",
  dexterity: "Dextérité",
  constitution: "Constitution",
  intelligence: "Intelligence",
  wisdom: "Sagesse",
  charisma: "Charisme",
};

/**
 * Ce que le joueur a choisi jusqu'ici. Tout est nullable : le wizard doit
 * pouvoir calculer un aperçu à mi-parcours, avec ce qu'il a.
 */
export interface WizardDraft {
  speciesKey: SpeciesKey | null;
  lineageKey: string | null;
  speciesSkills: SkillName[];
  originFeat: OriginFeatKey | null;
  classKey: ClassKey | null;
  classSkills: SkillName[];
  expertise: SkillName[];
  backgroundKey: BackgroundKey | null;
  backgroundBonuses: BackgroundAbilityBonuses;
  /**
   * Le RANG du tirage posé sur chaque caractéristique, pas sa valeur : deux 14
   * dans un même tirage sont deux emplacements distincts, et chacun ne sert
   * qu'une fois.
   */
  assignment: Partial<Record<Ability, number>>;
  spells: string[];
  spellcastingAbility: Ability | null;
  armorKey: string | null;
  shield: boolean;
}

export const EMPTY_DRAFT: WizardDraft = {
  speciesKey: null,
  lineageKey: null,
  speciesSkills: [],
  originFeat: null,
  classKey: null,
  classSkills: [],
  expertise: [],
  backgroundKey: null,
  backgroundBonuses: {},
  assignment: {},
  spells: [],
  spellcastingAbility: null,
  armorKey: null,
  shield: false,
};

const ABILITIES: Ability[] = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];

/** Un score neutre tant que le joueur n'a pas réparti son tirage : l'aperçu doit répondre. */
const UNASSIGNED_SCORE = 10;

function baseScoresOf(
  draft: WizardDraft,
  rollTotals: readonly number[],
): Record<Ability, number> {
  return Object.fromEntries(
    ABILITIES.map((ability) => {
      const slot = draft.assignment[ability];

      return [ability, slot === undefined ? UNASSIGNED_SCORE : rollTotals[slot] ?? UNASSIGNED_SCORE];
    }),
  ) as Record<Ability, number>;
}

/** Les six caractéristiques ont-elles chacune reçu un rang du tirage ? */
export function isFullyAssigned(draft: WizardDraft): boolean {
  return ABILITIES.every((ability) => draft.assignment[ability] !== undefined);
}

/**
 * Les choix, regroupés par provenance. Le back en a besoin pour savoir quoi
 * retirer si la source disparaît, et pour vérifier que chaque source a bien
 * fait choisir ce qu'elle devait.
 */
function choicesOf(draft: WizardDraft): CharacterChoice[] {
  return [
    ...speciesChoices(draft),
    ...classChoices(draft),
    ...featChoices(draft),
  ];
}

function speciesChoices(draft: WizardDraft): CharacterChoice[] {
  if (!draft.speciesKey) return [];

  return [
    {
      source: { type: "species", key: draft.speciesKey },
      skills: draft.speciesSkills,
      ...(draft.originFeat ? { originFeat: draft.originFeat } : {}),
    },
  ];
}

function classChoices(draft: WizardDraft): CharacterChoice[] {
  if (!draft.classKey) return [];

  return [
    {
      source: { type: "class", key: draft.classKey },
      skills: draft.classSkills,
      expertise: draft.expertise,
      spells: draft.spells,
    },
  ];
}

/** Initié à la magie porte sa liste et sa caractéristique, choisies par le joueur. */
function featChoices(draft: WizardDraft): CharacterChoice[] {
  if (!draft.spellcastingAbility) return [];

  return [
    {
      source: { type: "feat", key: "magic-initiate" },
      spellcastingAbility: draft.spellcastingAbility,
    },
  ];
}

export function toPreviewPayload(
  draft: WizardDraft,
  rollTotals: readonly number[],
): PreviewCharacterSheetDto | null {
  if (!draft.speciesKey || !draft.classKey || !draft.backgroundKey) return null;

  return {
    speciesKey: draft.speciesKey,
    lineageKey: draft.lineageKey,
    classKey: draft.classKey,
    backgroundKey: draft.backgroundKey,
    base: baseScoresOf(draft, rollTotals),
    backgroundBonuses: draft.backgroundBonuses,
    choices: choicesOf(draft),
    equipment: { armorKey: draft.armorKey, shield: draft.shield, items: [], gold: 0 },
  };
}

export function toFinalizePayload(
  draft: WizardDraft,
  rollTotals: readonly number[],
  name: string,
): FinalizeCharacterDto | null {
  const preview = toPreviewPayload(draft, rollTotals);
  if (!preview || !isFullyAssigned(draft)) return null;

  return { ...preview, name };
}
