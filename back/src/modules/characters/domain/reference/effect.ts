// Le modèle d'effet : toute règle du jeu — trait d'espèce, capacité de classe,
// don, sort — se décrit avec ces types. C'est la pièce dont tout le reste dépend.
//
// Trois formats coexistaient dans docs/characteres/ (la spec §2.3, les exemples à
// plat de la spec §6, et le `features{}` des fichiers de classe). Celui-ci est le
// seul retenu : c'est la spec §2.3, avec deux durcissements.
//
// 1. La formule est structurée, pas une chaîne. La spec écrivait
//    `value: "2 * level"` ; interpréter ça demanderait un parseur, et une faute de
//    frappe dans une donnée ne se verrait qu'à l'exécution. Ici une formule est un
//    arbre typé, que le compilateur vérifie et que le resolver évalue en dix lignes.
// 2. La condition d'application est un champ fermé, pas de la prose.
//    `feats.effects.json` portait `condition: "armes à distance"` — illisible pour
//    une machine. Ce qui ne rentre pas dans le vocabulaire d'ici part en
//    `informational` avec sa `note`, et se voit sur la fiche sans mentir au moteur.

import type { Ability } from './abilities';
import type { ConditionState } from './conditions';
import type { ClassKey, OriginFeatKey, SpellKey } from './keys';
import type {
  ArmorTraining,
  DamageType,
  Language,
  WeaponProficiency,
} from './proficiencies';
import type { SkillName } from './skills';

export const EFFECT_APPLICATIONS = [
  'passive',
  'grant',
  'reactive',
  'active',
  'informational',
] as const;

/**
 * Ce que le système fait de l'effet. `grant` et `passive` sont résolus par le
 * moteur ; `reactive` et `active` restent latents et ne sont qu'affichés au
 * niveau 1 ; `informational` n'est jamais appliqué.
 */
export type EffectApplication = (typeof EFFECT_APPLICATIONS)[number];

// ---------------------------------------------------------------------------
// Formules
// ---------------------------------------------------------------------------

export type Formula =
  | { kind: 'constant'; value: number }
  | { kind: 'abilityModifier'; ability: Ability }
  | { kind: 'proficiencyBonus' }
  | { kind: 'perLevel'; value: number }
  | { kind: 'sum'; parts: readonly Formula[] }
  | { kind: 'atLeast'; value: number; of: Formula };

export const constant = (value: number): Formula => ({ kind: 'constant', value });

export const abilityMod = (ability: Ability): Formula => ({
  kind: 'abilityModifier',
  ability,
});

export const proficiencyBonus = (): Formula => ({ kind: 'proficiencyBonus' });

export const perLevel = (value: number): Formula => ({ kind: 'perLevel', value });

export const sum = (...parts: readonly Formula[]): Formula => ({ kind: 'sum', parts });

/**
 * Un plancher. Les Ordres de niveau 1 accordent « votre modificateur de Sagesse
 * (minimum +1) » : sans ce plancher, un druide à Sagesse 10 recevrait +0.
 */
export const atLeast = (value: number, of: Formula): Formula => ({
  kind: 'atLeast',
  value,
  of,
});

// ---------------------------------------------------------------------------
// Effets passifs
// ---------------------------------------------------------------------------

export type EffectTarget =
  | 'maxHp'
  | 'armorClass'
  | 'initiative'
  | 'speed'
  | 'abilityScore'
  | 'savingThrow'
  | 'skillCheck'
  | 'attackBonus'
  | 'unarmedDamage'
  | 'spellSaveDc';

export type PassiveKind =
  | 'bonus'
  | 'set'
  | 'advantage'
  | 'disadvantage'
  | 'resistance'
  | 'immunity'
  | 'vulnerability';

/**
 * Une Défense sans armure ne s'applique que torse nu ; celle du moine exclut en
 * plus le bouclier. Sans ce champ, un barbare en cotte de mailles cumulerait deux
 * formules de CA.
 */
export type ArmorRequirement = 'unarmored' | 'unarmoredWithoutShield' | 'armored';

export interface PassiveEffect {
  kind: PassiveKind;
  target?: EffectTarget;
  formula?: Formula;
  /** Cibles exprimées en dés plutôt qu'en nombre, comme la Frappe à mains nues. */
  dice?: string;
  /** Caractéristique visée par un bonus d'`abilityScore` ou de `savingThrow`. */
  ability?: Ability;
  skill?: SkillName;
  damageType?: DamageType;
  /** État contre lequel joue un avantage ou une immunité. */
  against?: ConditionState;
  requires?: ArmorRequirement;
}

// ---------------------------------------------------------------------------
// Octrois
// ---------------------------------------------------------------------------

export interface SkillChoice {
  count: number;
  /** `'any'` quand le choix porte sur les 18 compétences (don Doué, Humain). */
  options: readonly SkillName[] | 'any';
}

export interface ToolChoice {
  count: number;
  options: readonly string[] | 'any';
}

export type SpellcastingKind = 'full' | 'half' | 'third' | 'pact' | 'originFeat';

export interface SpellcastingGrant {
  kind: SpellcastingKind;
  ability: Ability;
  /** Liste dans laquelle puiser : celle de la classe, pas forcément la sienne. */
  spellList: ClassKey;
  cantripsKnown: number;
  spellsPrepared: number;
  level1Slots: number;
}

/**
 * Initié à la magie laisse le joueur choisir sa liste et sa caractéristique
 * d'incantation : la référence ne peut décrire que la forme de l'octroi, le
 * choix est persisté sur le personnage.
 */
export interface SpellcastingChoice {
  kind: SpellcastingKind;
  abilityOptions: readonly Ability[];
  spellListOptions: readonly ClassKey[];
  cantripsKnown: number;
  spellsPrepared: number;
  level1Slots: number;
}

export type GrantedSpellFrequency = 'atWill' | 'oncePerLongRest';

export interface GrantedSpell {
  spellKey: SpellKey;
  frequency: GrantedSpellFrequency;
  /** Caractéristique d'incantation quand le sort ne vient pas d'une classe. */
  ability?: Ability;
}

export interface GrantPayload {
  skillProficiencies?: readonly SkillName[];
  skillChoice?: SkillChoice;
  toolProficiencies?: readonly string[];
  toolChoice?: ToolChoice;
  /** Doué accorde trois maîtrises sans trancher entre compétences et outils. */
  skillOrToolChoiceCount?: number;
  savingThrowProficiencies?: readonly Ability[];
  armorTraining?: readonly ArmorTraining[];
  weaponProficiencies?: readonly WeaponProficiency[];
  languages?: readonly Language[];
  languageChoiceCount?: number;
  originFeat?: OriginFeatKey;
  /** L'Humain choisit son don d'Origines ; l'historique impose le sien. */
  originFeatChoice?: boolean;
  spells?: readonly GrantedSpell[];
  spellcasting?: SpellcastingGrant;
  spellcastingChoice?: SpellcastingChoice;
  /** Bottes d'arme : nombre d'armes dont on maîtrise la botte. */
  weaponMasteryCount?: number;
  /** Sorts mineurs en plus de ceux de la classe — Thaumaturge et Mage en donnent un. */
  extraCantrips?: number;
  /** Expertise du roublard : compétences dont le bonus de maîtrise est doublé. */
  expertiseChoiceCount?: number;
  /** Défense sans armure, Style de combat : capacités nommées, sans effet chiffré. */
  feature?: string;
}

// ---------------------------------------------------------------------------
// Capacités latentes
// ---------------------------------------------------------------------------

export type ResourceRecovery = 'shortRest' | 'longRest' | 'never';

export interface ResourcePayload {
  key: string;
  /** Un maximum peut dépendre du personnage : Chanceux vaut le bonus de maîtrise. */
  max: Formula;
  recovery: ResourceRecovery;
}

export type ActionCost = 'action' | 'bonusAction' | 'reaction' | 'free' | 'noAction';

export interface TriggerPayload {
  event: string;
  action?: ActionCost;
}

// ---------------------------------------------------------------------------
// Effet et provenance
// ---------------------------------------------------------------------------

export interface Effect {
  application: EffectApplication;
  passive?: PassiveEffect;
  grants?: GrantPayload;
  resource?: ResourcePayload;
  trigger?: TriggerPayload;
  note?: string;
}

/** Une règle nommée, telle qu'elle apparaît sur la fiche, et ses effets. */
export interface Feature {
  key: string;
  name: string;
  description: string;
  effects: readonly Effect[];
}

export const EFFECT_SOURCE_TYPES = [
  'species',
  'lineage',
  'class',
  'background',
  'feat',
  'spell',
] as const;

export type EffectSourceType = (typeof EFFECT_SOURCE_TYPES)[number];

/**
 * Un effet sans sa provenance est inexploitable : c'est elle qui permet de dire
 * d'où vient une valeur sur la fiche, et de la retirer quand la source disparaît.
 */
export interface EffectSource {
  type: EffectSourceType;
  key: string;
  label: string;
}

export interface CollectedEffect {
  effect: Effect;
  source: EffectSource;
  feature: string;
}
