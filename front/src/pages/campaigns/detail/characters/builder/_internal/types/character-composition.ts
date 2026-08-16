import type {
  Ability,
  AbilityMethod,
  AbilityRoll,
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
 * pouvoir calculer un aperçu à mi-parcours, avec ce qu'il a. Le nom est la
 * dernière étape du parcours, le tirage se fait côté client.
 */
export interface CharacterComposition {
  name: string;

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
  /** Le tirage fait côté client pour la méthode « roll » ; `null` sinon. */
  abilityRoll: AbilityRoll | null;
  /**
   * Le RANG de la valeur posée sur chaque caractéristique, pas sa valeur : deux
   * 14 dans un même tirage sont deux emplacements distincts. Sert au tirage et
   * au tableau standard.
   */
  assignment: Partial<Record<Ability, number>>;
  /** L'achat de points fixe des scores directement, il n'y a rien à répartir. */
  pointBuyScores: Record<Ability, number>;

  /**
   * L'option de paquetage retenue, côté classe et côté historique. C'est ELLE le
   * choix du joueur : l'inventaire et l'or n'en sont que la conséquence, et se
   * recalculent depuis le catalogue au moment d'envoyer.
   */
  classEquipmentOptionId: string | null;
  backgroundEquipmentOptionId: string | null;
  /** Ce que le personnage PORTE, à choisir parmi ce que son paquetage lui donne. */
  armorKey: string | null;
  shield: boolean;
}

export const POINT_BUY_FLOOR = 8;

export const EMPTY_COMPOSITION: CharacterComposition = {
  name: "",
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
  abilityRoll: null,
  assignment: {},
  pointBuyScores: Object.fromEntries(
    ABILITIES.map((ability) => [ability, POINT_BUY_FLOOR]),
  ) as Record<Ability, number>,
  classEquipmentOptionId: null,
  backgroundEquipmentOptionId: null,
  armorKey: null,
  shield: false,
};

/** Les 18 compétences, lues du catalogue plutôt que redites côté front. */
export function allSkillsOf(catalog: DndCatalog): SkillName[] {
  return Object.keys(catalog.skillLabels) as SkillName[];
}

/** Les six valeurs à répartir : celles du tirage, ou celles du tableau standard. */
export function availableScores(composition: CharacterComposition): readonly number[] {
  return composition.abilityMethod === "roll"
    ? composition.abilityRoll?.totals ?? []
    : STANDARD_ARRAY;
}

export function pointBuySpent(composition: CharacterComposition): number {
  return ABILITIES.reduce(
    (total, ability) => total + (POINT_BUY_COSTS[composition.pointBuyScores[ability]] ?? 0),
    0,
  );
}

/** Les six caractéristiques ont-elles chacune reçu une valeur ? */
export function isFullyAssigned(composition: CharacterComposition): boolean {
  if (composition.abilityMethod === "pointBuy") return true;

  return ABILITIES.every((ability) => composition.assignment[ability] !== undefined);
}
