// Les armures de D&D 2024 et le bouclier.
// Source : docs/characteres/equipment/armors.json
//
// ATTENTION : cette table n'est PLUS lue à l'exécution. Les statistiques
// d'armure vivent maintenant dans la collection `items`, et le moteur de fiche
// les reçoit de la couche application — c'est ce qui permet à un MJ d'inventer
// une armure qui compte vraiment. Ce qui reste ici sert à deux choses :
//   - la forme normalisée d'où `items.seed.json` a été produit une fois ;
//   - les fixtures de test du moteur (`testing/worn-equipment.fixture.ts`).
// Ce qui EST encore une règle, et le reste : `UNARMORED_BASE_ARMOR_CLASS` et
// `CAPPED_DEXTERITY_LIMIT`. Ce ne sont pas des propriétés d'objet.

import type { ArmorTraining } from './proficiencies';

/**
 * Ce qu'une armure laisse passer du modificateur de Dextérité : tout pour une
 * armure légère, deux points au maximum pour une intermédiaire, rien pour une
 * lourde.
 */
export type DexterityAllowance = 'full' | 'capped' | 'none';

export const CAPPED_DEXTERITY_LIMIT = 2;

export interface Armor {
  key: string;
  name: string;
  training: ArmorTraining;
  baseArmorClass: number;
  dexterityAllowance: DexterityAllowance;
  /** Score de Force sous lequel l'armure coûte 3 m de Vitesse. */
  strengthRequirement: number | null;
  stealthDisadvantage: boolean;
}

const ARMOR_LIST: readonly Armor[] = [
  {
    key: 'padded',
    name: 'Armure matelassée',
    training: 'light',
    baseArmorClass: 11,
    dexterityAllowance: 'full',
    strengthRequirement: null,
    stealthDisadvantage: true,
  },
  {
    key: 'leather',
    name: 'Armure de cuir',
    training: 'light',
    baseArmorClass: 11,
    dexterityAllowance: 'full',
    strengthRequirement: null,
    stealthDisadvantage: false,
  },
  {
    key: 'studded-leather',
    name: 'Armure de cuir clouté',
    training: 'light',
    baseArmorClass: 12,
    dexterityAllowance: 'full',
    strengthRequirement: null,
    stealthDisadvantage: false,
  },
  {
    key: 'hide',
    name: 'Armure de peaux',
    training: 'medium',
    baseArmorClass: 12,
    dexterityAllowance: 'capped',
    strengthRequirement: null,
    stealthDisadvantage: false,
  },
  {
    key: 'chain-shirt',
    name: 'Chemise de mailles',
    training: 'medium',
    baseArmorClass: 13,
    dexterityAllowance: 'capped',
    strengthRequirement: null,
    stealthDisadvantage: false,
  },
  {
    key: 'scale-mail',
    name: "Armure d'écailles",
    training: 'medium',
    baseArmorClass: 14,
    dexterityAllowance: 'capped',
    strengthRequirement: null,
    stealthDisadvantage: true,
  },
  {
    key: 'breastplate',
    name: 'Cuirasse',
    training: 'medium',
    baseArmorClass: 14,
    dexterityAllowance: 'capped',
    strengthRequirement: null,
    stealthDisadvantage: false,
  },
  {
    key: 'half-plate',
    name: 'Demi-plate',
    training: 'medium',
    baseArmorClass: 15,
    dexterityAllowance: 'capped',
    strengthRequirement: null,
    stealthDisadvantage: true,
  },
  {
    key: 'ring-mail',
    name: 'Broigne',
    training: 'heavy',
    baseArmorClass: 14,
    dexterityAllowance: 'none',
    strengthRequirement: null,
    stealthDisadvantage: true,
  },
  {
    key: 'chain-mail',
    name: 'Cotte de mailles',
    training: 'heavy',
    baseArmorClass: 16,
    dexterityAllowance: 'none',
    strengthRequirement: 13,
    stealthDisadvantage: true,
  },
  {
    key: 'splint',
    name: 'Clibanion',
    training: 'heavy',
    baseArmorClass: 17,
    dexterityAllowance: 'none',
    strengthRequirement: 15,
    stealthDisadvantage: true,
  },
  {
    key: 'plate',
    name: 'Harnois',
    training: 'heavy',
    baseArmorClass: 18,
    dexterityAllowance: 'none',
    strengthRequirement: 15,
    stealthDisadvantage: true,
  },
];

export const ARMORS: Readonly<Record<string, Armor>> = Object.fromEntries(
  ARMOR_LIST.map((armor) => [armor.key, armor]),
);

export const ARMOR_KEYS: readonly string[] = ARMOR_LIST.map((armor) => armor.key);

/**
 * Le bouclier n'est pas une armure : il s'ajoute à la CA quelle qu'en soit
 * l'origine, y compris sur une Défense sans armure de barbare.
 */
export const SHIELD = {
  key: 'shield',
  name: 'Bouclier',
  training: 'shields',
  armorClassBonus: 2,
} as const;

/** La CA de base d'un personnage sans armure : 10 plus le modificateur de Dextérité. */
export const UNARMORED_BASE_ARMOR_CLASS = 10;
