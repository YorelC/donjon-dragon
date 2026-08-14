import type {
  Ability,
  AbilityMethod,
  BackgroundAbilityBonuses,
  BackgroundKey,
  ClassKey,
  DndCatalog,
  OriginFeatKey,
  SkillName,
  SpeciesKey,
} from "@donjon-dragon/shared";
import { POINT_BUY_COSTS, STANDARD_ARRAY } from "@donjon-dragon/shared";

export const ABILITIES: Ability[] = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
];

export const ABILITY_LABELS: Record<Ability, string> = {
  strength: "Force",
  dexterity: "Dextérité",
  constitution: "Constitution",
  intelligence: "Intelligence",
  wisdom: "Sagesse",
  charisma: "Charisme",
};

/**
 * Ce que le joueur a choisi jusqu'ici. Tout est nullable : le builder doit
 * pouvoir calculer un aperçu à mi-parcours, avec ce qu'il a.
 */
export interface CharacterDraft {
  speciesKey: SpeciesKey | null;
  lineageKey: string | null;
  speciesSkills: SkillName[];

  classKey: ClassKey | null;
  classSkills: SkillName[];
  expertise: SkillName[];
  /** Sorts mineurs et sorts de niveau 1 se choisissent à deux étapes distinctes. */
  classCantrips: string[];
  classSpells: string[];
  /** Le don de Style de combat du guerrier. */
  fightingStyle: string | null;
  /** L'option d'Ordre divin (clerc) ou d'Ordre primitif (druide). */
  classOrder: string | null;

  backgroundKey: BackgroundKey | null;
  backgroundBonuses: BackgroundAbilityBonuses;

  /** Le don que l'espèce laisse choisir — l'humain, et lui seul au niveau 1. */
  speciesFeat: OriginFeatKey | null;
  featSkills: SkillName[];
  featTools: string[];
  spellcastingAbility: Ability | null;
  spellList: ClassKey | null;
  featCantrips: string[];
  featSpells: string[];

  abilityMethod: AbilityMethod;
  /**
   * Le RANG de la valeur posée sur chaque caractéristique, pas sa valeur : deux
   * 14 dans un même tirage sont deux emplacements distincts. Sert au tirage et
   * au tableau standard.
   */
  assignment: Partial<Record<Ability, number>>;
  /** L'achat de points fixe des scores directement, il n'y a rien à répartir. */
  pointBuyScores: Record<Ability, number>;

  armorKey: string | null;
  shield: boolean;
}

export const POINT_BUY_FLOOR = 8;

export const EMPTY_DRAFT: CharacterDraft = {
  speciesKey: null,
  lineageKey: null,
  speciesSkills: [],
  classKey: null,
  classSkills: [],
  expertise: [],
  classCantrips: [],
  classSpells: [],
  fightingStyle: null,
  classOrder: null,
  backgroundKey: null,
  backgroundBonuses: {},
  speciesFeat: null,
  featSkills: [],
  featTools: [],
  spellcastingAbility: null,
  spellList: null,
  featCantrips: [],
  featSpells: [],
  abilityMethod: "standardArray",
  assignment: {},
  pointBuyScores: Object.fromEntries(
    ABILITIES.map((ability) => [ability, POINT_BUY_FLOOR]),
  ) as Record<Ability, number>,
  armorKey: null,
  shield: false,
};

/** Les 18 compétences, lues du catalogue plutôt que redites côté front. */
export function allSkillsOf(catalog: DndCatalog): SkillName[] {
  return Object.keys(catalog.skillLabels) as SkillName[];
}

/** Les six valeurs à répartir : celles du tirage, ou celles du tableau standard. */
export function availableScores(
  draft: CharacterDraft,
  rollTotals: readonly number[],
): readonly number[] {
  return draft.abilityMethod === "roll" ? rollTotals : STANDARD_ARRAY;
}

export function pointBuySpent(draft: CharacterDraft): number {
  return ABILITIES.reduce(
    (total, ability) => total + (POINT_BUY_COSTS[draft.pointBuyScores[ability]] ?? 0),
    0,
  );
}

/** Les six caractéristiques ont-elles chacune reçu une valeur ? */
export function isFullyAssigned(draft: CharacterDraft): boolean {
  if (draft.abilityMethod === "pointBuy") return true;

  return ABILITIES.every((ability) => draft.assignment[ability] !== undefined);
}
