import { Item, type ItemSnapshot } from '../domain/item';

const DEFAULT_ITEM: ItemSnapshot = {
  key: 'dagger',
  name: 'Dague',
  type: 'weapon',
  weapon: {
    category: 'simple',
    kind: 'melee',
    damageDice: '1d4',
    damageType: 'piercing',
    versatileDice: null,
    range: { normal: 6, max: 18 },
    properties: ['finesse', 'light', 'thrown'],
    mastery: 'nick',
  },
  armor: null,
  costInCopper: 200,
  weightInKg: 0.5,
  description: null,
  contents: null,
  source: 'srd',
  campaignId: null,
};

export function anItemSnapshot(overrides: Partial<ItemSnapshot> = {}): ItemSnapshot {
  return { ...DEFAULT_ITEM, ...overrides };
}

export function anItem(overrides: Partial<ItemSnapshot> = {}): Item {
  return Item.create(anItemSnapshot(overrides));
}

const CHAIN_MAIL_ARMOR: ItemSnapshot['armor'] = {
  training: 'heavy',
  baseArmorClass: 16,
  dexterityAllowance: 'none',
  strengthRequirement: 13,
  stealthDisadvantage: true,
};

/** Une armure prête à porter : le type et le bloc de stats doivent s'accorder. */
export function anArmorItem(overrides: Partial<ItemSnapshot> = {}): Item {
  return Item.create(
    anItemSnapshot({
      key: 'chain-mail',
      name: 'Cotte de mailles',
      type: 'armor',
      weapon: null,
      armor: CHAIN_MAIL_ARMOR,
      ...overrides,
    }),
  );
}

/** Un sac : un objet qui en contient d'autres, sans mécanique propre. */
export function aPackItem(overrides: Partial<ItemSnapshot> = {}): Item {
  return Item.create(
    anItemSnapshot({
      key: 'explorers-pack',
      name: "Paquetage d'explorateur",
      type: 'pack',
      weapon: null,
      armor: null,
      contents: [{ itemKey: 'torch', quantity: 10 }],
      ...overrides,
    }),
  );
}

/** Un objet sans mécanique : ni dégâts, ni classe d'armure. */
export function aGearItem(overrides: Partial<ItemSnapshot> = {}): Item {
  return Item.create(
    anItemSnapshot({
      key: 'rope',
      name: 'Corde',
      type: 'gear',
      weapon: null,
      armor: null,
      ...overrides,
    }),
  );
}
