import { ItemKey } from './item-key';
import {
  InvalidItemCostError,
  InvalidItemNameError,
  InvalidItemQuantityError,
  InvalidItemScopeError,
  InvalidItemWeightError,
  MismatchedItemStatsError,
} from './item.errors';

export const ITEM_TYPES = ['weapon', 'armor', 'gear', 'pack', 'tool'] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const ITEM_SOURCES = ['srd', 'campaign'] as const;
export type ItemSource = (typeof ITEM_SOURCES)[number];

/** Une ligne d'inventaire : un objet, en tant d'exemplaires. */
export interface ItemEntrySnapshot {
  itemKey: string;
  quantity: number;
}

export type WeaponCategory = 'simple' | 'martial';
export type WeaponRangeKind = 'melee' | 'ranged';
export type DexterityAllowance = 'full' | 'capped' | 'none';

/**
 * Vocabulaires redits ici plutôt qu'importés : le domaine ne lit de `shared` que
 * `error-schema`, et le module `items` ne connaît pas `characters`. La
 * duplication est surveillée par `item.mapper.test.ts`, qui fait passer un objet
 * réel par le schéma Zod partagé.
 */
export const DAMAGE_TYPES = [
  'acid',
  'bludgeoning',
  'cold',
  'fire',
  'force',
  'lightning',
  'necrotic',
  'piercing',
  'poison',
  'psychic',
  'radiant',
  'slashing',
  'thunder',
] as const;

export type DamageType = (typeof DAMAGE_TYPES)[number];

export const WEAPON_PROPERTIES = [
  'ammunition',
  'finesse',
  'heavy',
  'light',
  'loading',
  'reach',
  'thrown',
  'twoHanded',
  'versatile',
] as const;

export type WeaponProperty = (typeof WEAPON_PROPERTIES)[number];

export const ARMOR_TRAININGS = ['light', 'medium', 'heavy', 'shields'] as const;

export type ArmorTraining = (typeof ARMOR_TRAININGS)[number];

export interface WeaponRange {
  normal: number;
  max: number;
}

export interface WeaponStatsSnapshot {
  category: WeaponCategory;
  kind: WeaponRangeKind;
  damageDice: string;
  damageType: DamageType;
  versatileDice: string | null;
  range: WeaponRange | null;
  properties: WeaponProperty[];
}

/**
 * De quoi calculer une classe d'armure. Le bouclier est décrit comme les
 * autres : son `baseArmorClass` est le bonus qu'il ajoute, et c'est son
 * `training` — `shields` — qui dit qu'il s'ajoute au lieu de remplacer.
 */
export interface ArmorStatsSnapshot {
  training: ArmorTraining;
  baseArmorClass: number;
  dexterityAllowance: DexterityAllowance;
  strengthRequirement: number | null;
  stealthDisadvantage: boolean;
}

export interface ItemSnapshot {
  key: string;
  name: string;
  type: ItemType;
  /** Renseigné si et seulement si `type` vaut `weapon`. */
  weapon: WeaponStatsSnapshot | null;
  /** Renseigné si et seulement si `type` vaut `armor`. */
  armor: ArmorStatsSnapshot | null;
  /** En pièces de cuivre. `null` quand le manuel dit « variable ». */
  costInCopper: number | null;
  weightInKg: number | null;
  description: string | null;
  /** Renseigné pour les paquetages seuls : un sac est un objet qui en contient. */
  contents: ItemEntrySnapshot[] | null;
  source: ItemSource;
  campaignId: string | null;
}

/**
 * Un objet du catalogue : ce qu'on achète, ce qu'on transporte, ce qu'on donne
 * en butin — et ce qu'il fait en jeu.
 *
 * C'est la source de vérité des statistiques d'objet. Le moteur de fiche ne les
 * lit pas d'ici — il ne fait pas d'I/O — mais les reçoit résolues de la couche
 * application. C'est ce qui rend le MJ possible : une armure qu'il invente
 * change la classe d'armure de celui qui la porte, comme une armure du manuel.
 */
export class Item {
  declare private readonly brand: 'Item';

  private constructor(private readonly state: ItemSnapshot) {}

  static create(snapshot: ItemSnapshot): Item {
    const key = ItemKey.create(snapshot.key);
    const name = snapshot.name.trim();
    if (name === '') throw new InvalidItemNameError();
    assertCost(snapshot.costInCopper);
    assertWeight(snapshot.weightInKg);
    assertContents(snapshot.contents);
    assertScope(snapshot.source, snapshot.campaignId);
    assertStatsMatchType(snapshot);

    return new Item({ ...snapshot, key: key.value, name });
  }

  static restore(snapshot: ItemSnapshot): Item {
    return new Item({ ...snapshot });
  }

  get key(): string {
    return this.state.key;
  }

  get name(): string {
    return this.state.name;
  }

  get type(): ItemType {
    return this.state.type;
  }

  /** Les stats d'armure, pour qui doit calculer une classe d'armure. */
  get armor(): ArmorStatsSnapshot | null {
    return this.state.armor ? { ...this.state.armor } : null;
  }

  /** Inventé par un MJ, par opposition à repris du manuel. */
  get isHomebrew(): boolean {
    return this.state.source === 'campaign';
  }

  /** Un objet du manuel se voit partout, celui d'un MJ dans sa campagne seule. */
  isVisibleIn(campaignId: string): boolean {
    return !this.isHomebrew || this.state.campaignId === campaignId;
  }

  snapshot(): ItemSnapshot {
    return {
      ...this.state,
      contents: this.state.contents?.map((entry) => ({ ...entry })) ?? null,
      weapon: this.state.weapon ? { ...this.state.weapon, properties: [...this.state.weapon.properties] } : null,
      armor: this.state.armor ? { ...this.state.armor } : null,
    };
  }
}

/**
 * Une arme porte des dégâts, une armure une classe d'armure, et rien d'autre
 * n'en porte. Sans cet invariant on pourrait enregistrer une corde qui inflige
 * 1d8, ou une cotte de mailles sans CA — et le moteur de fiche, qui reçoit ces
 * stats sans les questionner, calculerait faux.
 */
function assertStatsMatchType(snapshot: ItemSnapshot): void {
  const expectsWeapon = snapshot.type === 'weapon';
  const expectsArmor = snapshot.type === 'armor';
  if (expectsWeapon !== (snapshot.weapon !== null)) throw new MismatchedItemStatsError();
  if (expectsArmor !== (snapshot.armor !== null)) throw new MismatchedItemStatsError();
}

function assertCost(costInCopper: number | null): void {
  if (costInCopper === null) return;
  if (!Number.isInteger(costInCopper) || costInCopper < 0) throw new InvalidItemCostError();
}

function assertWeight(weightInKg: number | null): void {
  if (weightInKg === null) return;
  if (weightInKg < 0) throw new InvalidItemWeightError();
}

function assertContents(contents: ItemEntrySnapshot[] | null): void {
  if (contents === null) return;
  for (const entry of contents) {
    ItemKey.create(entry.itemKey);
    if (!Number.isInteger(entry.quantity) || entry.quantity <= 0) {
      throw new InvalidItemQuantityError();
    }
  }
}

function assertScope(source: ItemSource, campaignId: string | null): void {
  const belongsToCampaign = source === 'campaign';
  if (belongsToCampaign !== (campaignId !== null)) throw new InvalidItemScopeError();
}
