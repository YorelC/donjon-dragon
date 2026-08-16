// Le contrat entre le domaine et le HTTP.
//
// Le module `items` redit les vocabulaires fermés de `shared` — types de dégâts,
// propriétés d'arme, maîtrises d'armure — parce que le domaine ne lit de
// `shared` que `error-schema`. Cette duplication n'est acceptable qu'à une
// condition : qu'un test la surveille. C'est ici.

import { describe, expect, it } from 'vitest';

import { ItemSchema } from '@donjon-dragon/shared/item-schema';
import {
  ARMOR_TRAININGS,
  DAMAGE_TYPES,
  ITEM_SOURCES,
  ITEM_TYPES,
  WEAPON_PROPERTIES,
} from '../domain/item';
import { toItemDto } from './item.mapper';
import { aGearItem, anArmorItem, anItem, aPackItem } from '../testing/item.fixture';

describe('toItemDto', () => {
  it.each([
    ['une arme', anItem()],
    ['une armure', anArmorItem()],
    ['un paquetage', aPackItem()],
    ['un objet courant', aGearItem()],
  ])('produit pour %s un objet que le schéma partagé accepte', (_label, item) => {
    expect(() => ItemSchema.parse(toItemDto(item))).not.toThrow();
  });

  it('reporte les dégâts sans les recalculer', () => {
    const dto = toItemDto(anItem());

    expect(dto.weapon).toEqual({
      category: 'simple',
      kind: 'melee',
      damageDice: '1d4',
      damageType: 'piercing',
      versatileDice: null,
      range: { normal: 6, max: 18 },
      properties: ['finesse', 'light', 'thrown'],
      mastery: 'nick',
    });
  });

  it('reporte la classe d armure sans la recalculer', () => {
    expect(toItemDto(anArmorItem()).armor?.baseArmorClass).toBe(16);
  });

  it('ne laisse pas le HTTP modifier ce que le domaine a produit', () => {
    const item = anItem();

    toItemDto(item).weapon?.properties.push('heavy');

    expect(item.snapshot().weapon?.properties).toEqual(['finesse', 'light', 'thrown']);
  });
});

/**
 * Les unions elles-mêmes, pas seulement un objet qui les traverse : une valeur
 * ajoutée d'un seul côté ne se verrait sur aucun objet réel avant longtemps.
 */
describe('vocabulaires — domaine et contrat disent la même chose', () => {
  it.each([
    ['types d objet', ITEM_TYPES, ItemSchema.shape.type.options],
    ['provenances', ITEM_SOURCES, ItemSchema.shape.source.options],
  ])('%s', (_label, domain, contract) => {
    expect([...domain].sort()).toEqual([...contract].sort());
  });

  it('types de dégâts', () => {
    const contract = ItemSchema.shape.weapon.unwrap().shape.damageType.options;
    expect([...DAMAGE_TYPES].sort()).toEqual([...contract].sort());
  });

  it('propriétés d arme', () => {
    const contract = ItemSchema.shape.weapon.unwrap().shape.properties.element.options;
    expect([...WEAPON_PROPERTIES].sort()).toEqual([...contract].sort());
  });

  it('maîtrises d armure', () => {
    const contract = ItemSchema.shape.armor.unwrap().shape.training.options;
    expect([...ARMOR_TRAININGS].sort()).toEqual([...contract].sort());
  });
});
