import { describe, it, expect } from 'vitest';

import {
  CharacterEquipment,
  InvalidItemQuantityError,
  NegativeGoldError,
  type CharacterEquipmentSnapshot,
} from './character-equipment';

const A_PACKAGE: CharacterEquipmentSnapshot = {
  armorKey: 'chain-mail',
  shield: true,
  items: [
    { itemKey: 'chain-mail', quantity: 1 },
    { itemKey: 'javelin', quantity: 8 },
  ],
  gold: 4,
  classOptionId: 'A',
  backgroundOptionId: 'A',
};

describe('CharacterEquipment — invariants', () => {
  // L'existence de l'armure ne se verifie plus ici : elle vit dans le catalogue,
  // et le domaine ne fait pas d'I/O. C'est `assertEquipmentIsKnown` qui tranche.
  it('accepte une clé d armure que le domaine ne connaît pas', () => {
    expect(CharacterEquipment.create({ ...A_PACKAGE, armorKey: 'mithril' }).armorKey).toBe(
      'mithril',
    );
  });

  it('accepte de ne rien porter : le barbare et le moine en vivent', () => {
    expect(CharacterEquipment.create({ ...A_PACKAGE, armorKey: null }).isUnarmored).toBe(true);
  });

  it('refuse un or négatif', () => {
    expect(() => CharacterEquipment.create({ ...A_PACKAGE, gold: -1 })).toThrow(NegativeGoldError);
  });

  it.each([0, -3, 1.5])('refuse la quantité %s', (quantity) => {
    expect(() =>
      CharacterEquipment.create({ ...A_PACKAGE, items: [{ itemKey: 'javelin', quantity }] }),
    ).toThrow(InvalidItemQuantityError);
  });

  // L'existence de la clé n'est PAS vérifiée ici : le catalogue est en base, et
  // le domaine ne fait pas d'I/O. C'est le use-case qui s'en charge.
  it('accepte une clé d objet que le domaine ne connaît pas', () => {
    const equipment = CharacterEquipment.create({
      ...A_PACKAGE,
      items: [{ itemKey: 'objet-invente-par-le-mj', quantity: 1 }],
    });

    expect(equipment.owns('objet-invente-par-le-mj')).toBe(true);
  });

  it('ne partage pas son inventaire', () => {
    const equipment = CharacterEquipment.create(A_PACKAGE);

    const stolen = equipment.snapshot().items[0];
    if (stolen) stolen.quantity = 99;

    expect(equipment.snapshot().items[0]?.quantity).toBe(1);
  });
});

/**
 * Les personnages créés avant les paquetages ont un document sans `items`, sans
 * `gold` ni identifiants d'option. Une lecture `lean` n'applique pas les défauts
 * Mongoose : c'est l'agrégat qui rétablit la forme, sinon un `undefined`
 * remonterait jusqu'au wizard.
 */
describe('CharacterEquipment — documents antérieurs aux paquetages', () => {
  const LEGACY = { armorKey: 'leather', shield: false } as unknown as CharacterEquipmentSnapshot;

  it('réhydrate un inventaire absent en inventaire vide', () => {
    expect(CharacterEquipment.restore(LEGACY).snapshot().items).toEqual([]);
  });

  it('réhydrate les options absentes en null, jamais en undefined', () => {
    const snapshot = CharacterEquipment.restore(LEGACY).snapshot();

    expect(snapshot.classOptionId).toBeNull();
    expect(snapshot.backgroundOptionId).toBeNull();
    expect(snapshot.gold).toBe(0);
  });

  it('garde l armure portée : elle décidait déjà de la classe d armure', () => {
    expect(CharacterEquipment.restore(LEGACY).armorKey).toBe('leather');
  });
});
