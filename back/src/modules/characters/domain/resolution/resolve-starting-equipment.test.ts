import { describe, expect, it } from 'vitest';

import type { CharacterEquipmentSnapshot } from '../character-equipment';
import { InvalidStartingEquipmentError, resolveStartingEquipment } from './resolve-starting-equipment';

describe('équipement de départ autoritaire B01', () => {
  it('ignore les objets et l or forgés puis recalcule les paquetages', () => {
    const result = resolveStartingEquipment('rogue', 'charlatan', selection({
      items: [{ itemKey: 'plate', quantity: 99 }], gold: 999,
    }));

    expect(result.gold).not.toBe(999);
    expect(result.items).not.toContainEqual({ itemKey: 'plate', quantity: 99 });
  });

  it('refuse une option qui ne vient pas de la classe choisie', () => {
    expect(() => resolveStartingEquipment('rogue', 'charlatan', selection({
      classOptionId: 'C',
    }))).toThrow(InvalidStartingEquipmentError);
  });

  it('ajoute une babiole sans modifier l or calculé', () => {
    const without = resolveStartingEquipment('rogue', 'charlatan', selection());
    const withTrinket = resolveStartingEquipment('rogue', 'charlatan', selection({
      trinketId: 42,
    }));

    expect(withTrinket.gold).toBe(without.gold);
    expect(withTrinket.items).toContainEqual({ itemKey: 'trinket-42', quantity: 1 });
  });

  it('matérialise la boîte de jeux du paquetage Voyageur', () => {
    const result = resolveStartingEquipment('rogue', 'wayfarer', selection({
      backgroundChoiceItemKey: 'dice-set',
    }));

    expect(result.items).toContainEqual({ itemKey: 'dice-set', quantity: 1 });
    expect(result.items.some((item) => item.itemKey === 'gaming-set')).toBe(false);
  });
});

function selection(
  overrides: Partial<CharacterEquipmentSnapshot> = {},
): CharacterEquipmentSnapshot {
  return {
    armorKey: null, shield: false, items: [], gold: 0,
    classOptionId: 'A', backgroundOptionId: 'A',
    classChoiceItemKey: null, backgroundChoiceItemKey: null, trinketId: null,
    ...overrides,
  };
}
