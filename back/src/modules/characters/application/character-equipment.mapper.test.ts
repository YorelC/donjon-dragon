import { describe, expect, it } from 'vitest';

import { resolveEquipment } from './character-equipment.mapper';
import { CharacterEquipment, type CharacterEquipmentSnapshot } from '../domain/character-equipment';
import { InMemoryItemCatalog } from '../testing/in-memory-item-catalog';

const CAMPAIGN_ID = 'campaign-1';

function equipmentWith(overrides: Partial<CharacterEquipmentSnapshot>): CharacterEquipment {
  return CharacterEquipment.restore({
    armorKey: 'chain-mail',
    shield: true,
    items: [
      { itemKey: 'chain-mail', quantity: 1 },
      { itemKey: 'shield', quantity: 1 },
      { itemKey: 'dagger', quantity: 2 },
    ],
    gold: 10,
    classOptionId: null,
    backgroundOptionId: null,
    ...overrides,
  });
}

async function itemsOf(equipment: CharacterEquipment) {
  const view = await resolveEquipment(new InMemoryItemCatalog(), equipment, CAMPAIGN_ID);
  return view.resolved.items;
}

describe('resolveEquipment', () => {
  it("marque portés l'armure et le bouclier, et eux seuls", async () => {
    const items = await itemsOf(equipmentWith({}));

    expect(items.map(({ itemKey, worn }) => ({ itemKey, worn }))).toEqual([
      { itemKey: 'chain-mail', worn: true },
      { itemKey: 'shield', worn: true },
      { itemKey: 'dagger', worn: false },
    ]);
  });

  it('ne dit pas porté un bouclier resté au sac', async () => {
    const items = await itemsOf(equipmentWith({ shield: false }));

    expect(items.find((item) => item.itemKey === 'shield')?.worn).toBe(false);
  });

  it('range chaque objet dans la catégorie du catalogue', async () => {
    const items = await itemsOf(equipmentWith({}));

    expect(items.map((item) => item.type)).toEqual(['armor', 'armor', 'weapon']);
  });

  it("range en matériel une clé que le catalogue ignore", async () => {
    const items = await itemsOf(equipmentWith({ items: [{ itemKey: 'rope', quantity: 1 }], armorKey: null, shield: false }));

    expect(items).toEqual([{ itemKey: 'rope', name: 'rope', quantity: 1, type: 'gear', worn: false }]);
  });
});
