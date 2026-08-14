import { describe, it, expect, beforeEach } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { DndCatalogSchema, CatalogSpellListSchema } from '@donjon-dragon/shared/dnd-catalog-schema';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';

import { GetClassSpellListUseCase } from '../application/use-cases/get-class-spell-list.use-case';
import { GetDndCatalogUseCase } from '../application/use-cases/get-dnd-catalog.use-case';
import { DndCatalogController } from './dnd-catalog.controller';

describe('DndCatalogController', () => {
  let controller: DndCatalogController;

  beforeEach(async () => {
    // Les use-cases n'ont aucune dépendance : autant brancher les vrais, c'est
    // le contenu du catalogue qu'on veut vérifier, pas le câblage d'un double.
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DndCatalogController],
      providers: [GetDndCatalogUseCase, GetClassSpellListUseCase],
    }).compile();

    controller = module.get(DndCatalogController);
  });

  it('renvoie un catalogue que le contrat partagé accepte', () => {
    expect(() => DndCatalogSchema.parse(controller.getCatalog())).not.toThrow();
  });

  it('expose les 9 espèces, 12 classes et 16 historiques', () => {
    const catalog = controller.getCatalog();

    expect(catalog.species).toHaveLength(9);
    expect(catalog.classes).toHaveLength(12);
    expect(catalog.backgrounds).toHaveLength(16);
    expect(catalog.originFeats).toHaveLength(10);
  });

  it('dit au wizard ce que chaque espèce fait choisir', () => {
    const catalog = controller.getCatalog();
    const elf = catalog.species.find((species) => species.key === 'elf');
    const human = catalog.species.find((species) => species.key === 'human');

    expect(elf?.lineage?.options).toHaveLength(3);
    expect(elf?.skillChoice).toEqual({
      count: 1,
      options: ['insight', 'perception', 'survival'],
    });
    expect(human?.lineage).toBeNull();
    expect(human?.grantsOriginFeatChoice).toBe(true);
  });

  it('annonce le paramétrage qu’attend chaque don', () => {
    const feats = controller.getCatalog().originFeats;
    const magicInitiate = feats.find((feat) => feat.key === 'magic-initiate');
    const skilled = feats.find((feat) => feat.key === 'skilled');
    const tough = feats.find((feat) => feat.key === 'tough');

    expect(magicInitiate?.spellcastingChoice).toEqual({
      abilityOptions: ['intelligence', 'wisdom', 'charisma'],
      spellListOptions: ['cleric', 'druid', 'wizard'],
      cantripsKnown: 2,
      spellsPrepared: 1,
    });
    expect(skilled?.skillOrToolChoiceCount).toBe(3);
    expect(tough?.spellcastingChoice).toBeNull();
    expect(tough?.skillOrToolChoiceCount).toBe(0);
  });

  it('annonce les deux expertises du roublard', () => {
    const rogue = controller.getCatalog().classes.find((entry) => entry.key === 'rogue');

    expect(rogue?.expertiseCount).toBe(2);
    expect(rogue?.skillChoice.count).toBe(4);
  });

  it('sépare les sorts mineurs des sorts de niveau 1', () => {
    const spells = controller.getClassSpells('wizard');

    expect(() => CatalogSpellListSchema.parse(spells)).not.toThrow();
    expect(spells.cantrips.every((spell) => spell.level === 0)).toBe(true);
    expect(spells.level1.every((spell) => spell.level === 1)).toBe(true);
    expect(spells.cantrips.length).toBeGreaterThan(0);
  });

  it('rend deux listes vides pour une classe qui ne lance rien', () => {
    const spells = controller.getClassSpells('barbarian');

    expect(spells.cantrips).toEqual([]);
    expect(spells.level1).toEqual([]);
  });
});

// Le catalogue ne dépend d'aucune campagne, mais il reste derrière le jeton :
// un @Public() ici ouvrirait la route au monde sans raison.
describe('DndCatalogController — protection des routes', () => {
  const ROUTES = ['getCatalog', 'getClassSpells'] as const;

  it('ne déclare pas @Public() au niveau du controller', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, DndCatalogController)).toBeUndefined();
  });

  it.each(ROUTES)('ne déclare pas @Public() sur %s', (route) => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, DndCatalogController.prototype[route])).toBeUndefined();
  });

  it('couvre bien toutes les routes du controller', () => {
    const handlers = Object.getOwnPropertyNames(DndCatalogController.prototype).filter(
      (name) => name !== 'constructor',
    );

    expect(handlers.sort()).toEqual([...ROUTES].sort());
  });
});
