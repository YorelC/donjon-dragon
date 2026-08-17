import { describe, it, expect } from 'vitest';

import { Item } from './item';
import { InvalidItemKeyError } from './item-key';
import {
  InvalidItemCostError,
  InvalidItemNameError,
  InvalidItemQuantityError,
  InvalidItemScopeError,
  InvalidItemWeightError,
  MismatchedItemStatsError,
} from './item.errors';
import {
  aGearItem,
  anArmorItem,
  anItem,
  anItemSnapshot,
  aPackItem,
} from '../testing/item.fixture';

describe('Item — création', () => {
  it('accepte un objet du manuel sans coût ni poids : le manuel dit « variable »', () => {
    const item = aGearItem({ key: 'gaming-set', costInCopper: null, weightInKg: null });

    expect(item.snapshot().costInCopper).toBeNull();
  });

  it('rogne le nom', () => {
    expect(anItem({ name: '  Dague  ' }).name).toBe('Dague');
  });

  it('refuse un nom vide', () => {
    expect(() => anItem({ name: '   ' })).toThrow(InvalidItemNameError);
  });

  it.each(['Chain-Mail', 'chain mail', 'matériel-escalade', '-dagger', ''])(
    'refuse la clé %s : une clé passe dans une URL et dans un index',
    (key) => {
      expect(() => anItem({ key })).toThrow(InvalidItemKeyError);
    },
  );

  it('refuse un coût négatif', () => {
    expect(() => anItem({ costInCopper: -1 })).toThrow(InvalidItemCostError);
  });

  it('refuse un coût fractionnaire : le cuivre est la plus petite pièce', () => {
    expect(() => anItem({ costInCopper: 1.5 })).toThrow(InvalidItemCostError);
  });

  it('refuse un poids négatif', () => {
    expect(() => anItem({ weightInKg: -0.5 })).toThrow(InvalidItemWeightError);
  });

  it('accepte un poids fractionnaire : une dague pèse 0,5 kg', () => {
    expect(anItem({ weightInKg: 0.5 }).snapshot().weightInKg).toBe(0.5);
  });
});

describe('Item — contenu des paquetages', () => {
  it('accepte un sac qui contient des objets', () => {
    const pack = aPackItem({ contents: [{ itemKey: 'torch', quantity: 10 }] });

    expect(pack.snapshot().contents).toEqual([{ itemKey: 'torch', quantity: 10 }]);
  });

  it.each([0, -1, 1.5])('refuse la quantité %s', (quantity) => {
    expect(() =>
      aPackItem({ contents: [{ itemKey: 'torch', quantity }] }),
    ).toThrow(InvalidItemQuantityError);
  });

  it('refuse une clé de contenu illisible', () => {
    expect(() =>
      aPackItem({ contents: [{ itemKey: 'Torche', quantity: 1 }] }),
    ).toThrow(InvalidItemKeyError);
  });

  it('ne partage pas son contenu : le snapshot est une copie', () => {
    const pack = aPackItem({ contents: [{ itemKey: 'torch', quantity: 10 }] });

    const first = pack.snapshot().contents?.[0];
    if (first) first.quantity = 99;

    expect(pack.snapshot().contents).toEqual([{ itemKey: 'torch', quantity: 10 }]);
  });
});

/**
 * Sans cet invariant, on pourrait enregistrer une corde qui inflige 1d8 ou une
 * cotte de mailles sans classe d'armure — et le moteur de fiche, qui reçoit ces
 * statistiques sans les questionner, calculerait faux en silence.
 */
describe('Item — les stats suivent le type', () => {
  it('accepte une arme avec ses dégâts', () => {
    expect(anItem().snapshot().weapon?.damageDice).toBe('1d4');
  });

  it('accepte une armure avec sa classe d armure', () => {
    expect(anArmorItem().armor?.baseArmorClass).toBe(16);
  });

  it('refuse une arme sans dégâts', () => {
    expect(() => anItem({ weapon: null })).toThrow(MismatchedItemStatsError);
  });

  it('refuse une armure sans classe d armure', () => {
    expect(() => anArmorItem({ armor: null })).toThrow(MismatchedItemStatsError);
  });

  it('refuse une corde qui inflige des dégâts', () => {
    expect(() => aGearItem({ weapon: anItem().snapshot().weapon })).toThrow(
      MismatchedItemStatsError,
    );
  });

  it('refuse un paquetage qui protège', () => {
    expect(() => aPackItem({ armor: anArmorItem().armor })).toThrow(MismatchedItemStatsError);
  });

  it('ne partage pas ses stats d armure', () => {
    const armor = anArmorItem();

    const stolen = armor.armor;
    if (stolen) stolen.baseArmorClass = 99;

    expect(armor.armor?.baseArmorClass).toBe(16);
  });
});

describe('Item — portée', () => {
  it('refuse un objet du manuel rattaché à une campagne', () => {
    expect(() => anItem({ source: 'srd', campaignId: 'camp-1' })).toThrow(InvalidItemScopeError);
  });

  it('refuse un objet de campagne sans campagne', () => {
    expect(() => anItem({ source: 'campaign', campaignId: null })).toThrow(InvalidItemScopeError);
  });

  it('rend un objet du manuel visible dans nimporte quelle campagne', () => {
    expect(anItem().isVisibleIn('camp-1')).toBe(true);
  });

  it('rend un objet de MJ visible dans sa campagne seule', () => {
    const homebrew = anItem({ source: 'campaign', campaignId: 'camp-1' });

    expect(homebrew.isVisibleIn('camp-1')).toBe(true);
    expect(homebrew.isVisibleIn('camp-2')).toBe(false);
  });
});

describe('Item — restauration', () => {
  it('réhydrate sans rejouer les invariants', () => {
    const snapshot = anItemSnapshot({ key: 'Clé Interdite', costInCopper: -10 });

    expect(Item.restore(snapshot).snapshot()).toEqual(snapshot);
  });
});
