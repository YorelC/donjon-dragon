import { InvalidDomainError } from '@kernel/domain/domain.error';

/**
 * Le bouclier est un objet du catalogue comme un autre ; `shield` ne dit que
 * s'il est porté. Cette clé est le pont entre les deux.
 */
export const SHIELD_ITEM_KEY = 'shield';

/** Une ligne d'inventaire : la clé d'un objet du catalogue, en tant d'exemplaires. */
export interface CarriedItemSnapshot {
  itemKey: string;
  quantity: number;
}

export interface CharacterEquipmentSnapshot {
  /** `null` quand le personnage ne porte rien : le moine et le barbare en vivent. */
  armorKey: string | null;
  shield: boolean;
  items: CarriedItemSnapshot[];
  gold: number;
  /** L'option de paquetage retenue, pour que le wizard se rouvre sur le bon choix. */
  classOptionId: string | null;
  backgroundOptionId: string | null;
  classChoiceItemKey?: string | null;
  backgroundChoiceItemKey?: string | null;
  trinketId?: number | null;
}

export class NegativeGoldError extends InvalidDomainError {
  constructor() {
    super('Gold cannot be negative');
  }
}

export class InvalidItemQuantityError extends InvalidDomainError {
  constructor() {
    super('Item quantity must be a positive integer');
  }
}

export class WornItemNotOwnedError extends InvalidDomainError {
  constructor() {
    super('Worn armor and shield must be owned');
  }
}

/**
 * Ce que porte et ce que possède le personnage.
 *
 * Seuls l'armure et le bouclier sont interprétés par le moteur — ils décident de
 * la classe d'armure. Le reste du paquetage est de l'inventaire : au niveau 1
 * rien d'autre n'entre dans une formule.
 *
 * L'existence des clés d'objet n'est PAS vérifiée ici : le catalogue vit dans une
 * collection Mongo, et le domaine ne fait pas d'I/O. C'est le use-case qui les
 * résout avant d'arriver jusqu'ici.
 */
export class CharacterEquipment {
  declare private readonly brand: 'CharacterEquipment';

  private constructor(private readonly state: CharacterEquipmentSnapshot) {}

  static create(snapshot: CharacterEquipmentSnapshot): CharacterEquipment {
    if (snapshot.gold < 0) throw new NegativeGoldError();
    assertQuantities(snapshot.items ?? []);
    assertWornItemsAreOwned(snapshot);

    return new CharacterEquipment(copyOf(snapshot));
  }

  static restore(snapshot: CharacterEquipmentSnapshot): CharacterEquipment {
    return new CharacterEquipment(copyOf(snapshot));
  }

  get armorKey(): string | null {
    return this.state.armorKey;
  }

  get shield(): boolean {
    return this.state.shield;
  }

  get gold(): number {
    return this.state.gold;
  }

  get isUnarmored(): boolean {
    return this.state.armorKey === null;
  }

  get classOptionId(): string | null {
    return this.state.classOptionId;
  }

  get backgroundOptionId(): string | null {
    return this.state.backgroundOptionId;
  }

  get trinketId(): number | null {
    return this.state.trinketId ?? null;
  }

  get items(): readonly CarriedItemSnapshot[] {
    return this.state.items;
  }

  /** Le personnage ne peut porter que ce qu'il possède. */
  owns(itemKey: string): boolean {
    return this.state.items.some((item) => item.itemKey === itemKey);
  }

  snapshot(): CharacterEquipmentSnapshot {
    return copyOf(this.state);
  }
}

/**
 * Copie, et comble ce qui manque. Les personnages créés avant les paquetages ont
 * un document sans option ni inventaire : une lecture `lean` n'applique pas les
 * défauts Mongoose, donc c'est ici que la forme se rétablit. Sans ça, un
 * `undefined` remonterait jusqu'au wizard et ferait échouer sa validation.
 */
function copyOf(snapshot: CharacterEquipmentSnapshot): CharacterEquipmentSnapshot {
  return {
    ...snapshot,
    items: (snapshot.items ?? []).map((item) => ({ ...item })),
    gold: snapshot.gold ?? 0,
    classOptionId: snapshot.classOptionId ?? null,
    backgroundOptionId: snapshot.backgroundOptionId ?? null,
    classChoiceItemKey: snapshot.classChoiceItemKey ?? null,
    backgroundChoiceItemKey: snapshot.backgroundChoiceItemKey ?? null,
    trinketId: snapshot.trinketId ?? null,
  };
}

function assertQuantities(items: readonly CarriedItemSnapshot[]): void {
  const allPositive = items.every(
    (item) => Number.isInteger(item.quantity) && item.quantity > 0,
  );
  if (!allPositive) throw new InvalidItemQuantityError();
}

function assertWornItemsAreOwned(snapshot: CharacterEquipmentSnapshot): void {
  const owned = new Set((snapshot.items ?? []).map((item) => item.itemKey));
  const ownsArmor = snapshot.armorKey === null || owned.has(snapshot.armorKey);
  const ownsShield = !snapshot.shield || owned.has(SHIELD_ITEM_KEY);
  if (!ownsArmor || !ownsShield) throw new WornItemNotOwnedError();
}
