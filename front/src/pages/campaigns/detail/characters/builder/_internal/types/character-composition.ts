import type {
  Ability,
  AbilityMethod,
  AbilityRoll,
  Alignment,
  BackgroundAbilityBonuses,
  BackgroundKey,
  ClassKey,
  CreatureSize,
  DndCatalog,
  Language,
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
 * pouvoir calculer un aperçu à mi-parcours, avec ce qu'il a. L'état civil est
 * la dernière étape du parcours ; le tirage, lui, vient du serveur.
 */
export interface CharacterComposition {
  name: string;
  /** L'état civil : exigé à la création, figé ensuite. */
  alignment: Alignment | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  description: string | null;

  speciesKey: SpeciesKey | null;
  lineageKey: string | null;
  /**
   * Le choix EXPLICITE de catégorie de taille, `null` quand l'espèce n'en offre
   * qu'une. Ce n'est pas la taille effective : celle-ci se lit par
   * `resolvedSizeOf`, qui ignore un choix devenu impossible.
   */
  selectedSize: CreatureSize | null;
  /** Exactement deux langues standards, le Commun étant accordé d'office. */
  standardLanguages: Language[];
  /**
   * La caractéristique d'incantation du sort mineur de lignée — l'elfe, le gnome
   * et le tieffelin la choisissent. Distincte de `spellcastingAbility`, qui est
   * celle du don Initié à la magie : un personnage peut avoir les deux.
   */
  lineageSpellcastingAbility: Ability | null;
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
  /** Le tirage rendu par le serveur pour la méthode « roll » ; `null` sinon. */
  abilityRoll: AbilityRoll | null;
  /** L'identité de ce tirage, seule chose que la création renvoie au serveur. */
  abilityRollId: string | null;
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
  alignment: null,
  age: null,
  heightCm: null,
  weightKg: null,
  description: null,
  speciesKey: null,
  lineageKey: null,
  selectedSize: null,
  standardLanguages: [],
  lineageSpellcastingAbility: null,
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
  abilityRollId: null,
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
