// Le contrat entre le domaine et le HTTP.
//
// `shared/src/dnd-reference-schema.ts` redit les unions du domaine, parce que le
// domaine ne lit de `shared` que `error-schema`. Cette duplication n'est
// acceptable qu'à une condition : qu'un test la surveille. C'est ici.

import { describe, expect, it } from 'vitest';

import { ComputedCharacterSchema } from '@donjon-dragon/shared/character-sheet-schema';
import {
  AbilitySchema,
  ArmorTrainingSchema,
  BackgroundKeySchema,
  ClassKeySchema,
  OriginFeatKeySchema,
  SkillNameSchema,
  SpeciesKeySchema,
  WeaponProficiencySchema,
} from '@donjon-dragon/shared/dnd-reference-schema';

import { aBuild } from '../testing/character-build.fixture';
import { ABILITIES } from '../domain/reference/abilities';
import {
  BACKGROUND_KEYS,
  CLASS_KEYS,
  ORIGIN_FEAT_KEYS,
  SPECIES_KEYS,
} from '../domain/reference/keys';
import { ARMOR_TRAININGS, WEAPON_PROFICIENCIES } from '../domain/reference/proficiencies';
import { SKILLS } from '../domain/reference/skills';
import { resolveSheetOf } from '../testing/worn-equipment.fixture';
import { toCharacterSheetDto } from './character-sheet.mapper';

describe('vocabulaire partagé', () => {
  it('dit la même chose des deux côtés de la frontière', () => {
    expect(AbilitySchema.options).toEqual([...ABILITIES]);
    expect(SkillNameSchema.options).toEqual([...SKILLS]);
    expect(SpeciesKeySchema.options).toEqual([...SPECIES_KEYS]);
    expect(ClassKeySchema.options).toEqual([...CLASS_KEYS]);
    expect(BackgroundKeySchema.options).toEqual([...BACKGROUND_KEYS]);
    expect(OriginFeatKeySchema.options).toEqual([...ORIGIN_FEAT_KEYS]);
    expect(ArmorTrainingSchema.options).toEqual([...ARMOR_TRAININGS]);
    expect(WeaponProficiencySchema.options).toEqual([...WEAPON_PROFICIENCIES]);
  });
});

describe('toCharacterSheetDto', () => {
  const sheet = resolveSheetOf(
    aBuild({
      speciesKey: 'dwarf',
      classKey: 'cleric',
      backgroundKey: 'acolyte',
      base: {
        strength: 12,
        dexterity: 10,
        constitution: 14,
        intelligence: 13,
        wisdom: 15,
        charisma: 8,
      },
      backgroundBonuses: { wisdom: 2, intelligence: 1 },
      armorKey: 'chain-shirt',
      shield: true,
      choices: [
        { source: { type: 'class', key: 'cleric' }, skills: ['insight', 'religion'] },
        {
          source: { type: 'feat', key: 'magic-initiate' },
          spellcastingAbility: 'wisdom',
          spellList: 'cleric',
          spells: ['thaumaturgy', 'mending', 'detect-magic'],
        },
      ],
    }),
  );

  const EQUIPMENT = {
    items: [{ itemKey: 'chain-shirt', name: 'Chemise de mailles', quantity: 1 }],
    gold: 7,
    armorName: 'Chemise de mailles',
    shield: true,
    stealthDisadvantage: false,
  };

  it('produit une fiche que le schéma partagé accepte', () => {
    expect(() => ComputedCharacterSchema.parse(toCharacterSheetDto(sheet, EQUIPMENT))).not.toThrow();
  });

  it('ne laisse pas le HTTP modifier ce que le domaine a produit', () => {
    const dto = toCharacterSheetDto(sheet, EQUIPMENT);
    dto.armorClass.sources.push('injecté');
    dto.skills.length = 0;

    expect(sheet.armorClass.sources).not.toContain('injecté');
    expect(sheet.skills).toHaveLength(18);
  });

  it('reporte les valeurs dérivées sans les recalculer', () => {
    const dto = toCharacterSheetDto(sheet, EQUIPMENT);

    expect(dto.armorClass.value).toBe(sheet.armorClass.value);
    expect(dto.spellcasting).toHaveLength(2);
    expect(dto.skills).toHaveLength(18);
  });
});
