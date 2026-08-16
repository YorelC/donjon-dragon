import { randomUUID } from 'crypto';
import { describe, it, expect } from 'vitest';
import { UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';

import { STANDARD_ARRAY_ROLL } from '../testing/character-build.fixture';
import { A_VALID_ASSIGNMENT } from '../testing/character.fixture';
import { toCharacterBuildDetailDto } from './character-build-detail.mapper';
import { Character, type CharacterBuildInput } from '../domain/character';
import { CharacterName } from '../domain/character-name';
import { OwningCampaignId } from '../domain/owning-campaign-id';

const gandalf = UserId.create(randomUUID());
const campaignId = OwningCampaignId.create(randomUUID());
const NOW = TEST_INSTANT;

function characterWith(build: CharacterBuildInput): Character {
  return Character.create({
    campaignId,
    name: CharacterName.create('Frodo Sacquet'),
    createdBy: gandalf,
    build,
    roll: STANDARD_ARRAY_ROLL,
    now: NOW,
  });
}

/**
 * Une source par branche du mapper : l'espèce avec son don d'origine, la
 * classe avec Style de combat + Ordre + un sort mineur et un sort de niveau 1
 * mélangés, Initié à la magie, et Doué. `validateChoices` ne vérifie que les
 * comptes de compétences et le lignage — le reste est accepté tel quel, donc
 * rien n'empêche ce cumul dans un fixture de test.
 */
const FULL_BUILD: CharacterBuildInput = {
  speciesKey: 'human',
  lineageKey: null,
  classKey: 'rogue',
  backgroundKey: 'charlatan',
  abilityMethod: 'roll',
  base: { ...A_VALID_ASSIGNMENT },
  backgroundBonuses: { dexterity: 2, charisma: 1 },
  choices: [
    { source: { type: 'species', key: 'human' }, skills: ['athletics'], originFeat: 'tough' },
    {
      source: { type: 'class', key: 'rogue' },
      skills: ['acrobatics', 'insight', 'perception', 'stealth'],
      expertise: ['stealth', 'perception'],
      spells: ['guidance', 'bless'],
      fightingStyle: 'dueling',
      classOrder: 'order-of-the-open-hand',
    },
    {
      source: { type: 'feat', key: 'magic-initiate' },
      spellcastingAbility: 'intelligence',
      spellList: 'wizard',
      spells: ['guidance', 'bless'],
    },
    {
      source: { type: 'feat', key: 'skilled' },
      skills: ['survival'],
      tools: ['thieves-tools'],
    },
  ],
  equipment: {
    armorKey: 'leather',
    shield: false,
    items: [{ itemKey: 'leather', quantity: 1 }],
    gold: 8,
    classOptionId: 'A',
    backgroundOptionId: 'A',
  },
};

describe('toCharacterBuildDetailDto', () => {
  it('éclate chaque source de choix dans son champ dédié', () => {
    const dto = toCharacterBuildDetailDto(characterWith(FULL_BUILD));

    expect(dto.name).toBe('Frodo Sacquet');
    expect(dto.speciesKey).toBe('human');
    expect(dto.lineageKey).toBeNull();
    expect(dto.speciesSkills).toEqual(['athletics']);
    expect(dto.speciesFeat).toBe('tough');

    expect(dto.classKey).toBe('rogue');
    expect(dto.classSkills).toEqual(['acrobatics', 'insight', 'perception', 'stealth']);
    expect(dto.expertise).toEqual(['stealth', 'perception']);
    expect(dto.fightingStyle).toBe('dueling');
    expect(dto.classOrder).toBe('order-of-the-open-hand');

    expect(dto.backgroundKey).toBe('charlatan');
    expect(dto.backgroundBonuses).toEqual({ dexterity: 2, charisma: 1 });

    expect(dto.featSkills).toEqual(['survival']);
    expect(dto.featTools).toEqual(['thieves-tools']);
    expect(dto.spellcastingAbility).toBe('intelligence');
    expect(dto.spellList).toBe('wizard');

    expect(dto.abilityMethod).toBe('roll');
    expect(dto.base).toEqual(A_VALID_ASSIGNMENT);
    expect(dto.abilityRoll?.totals).toEqual([15, 14, 13, 12, 10, 8]);

    expect(dto.armorKey).toBe('leather');
    expect(dto.shield).toBe(false);
  });

  it('sépare les sorts mineurs des sorts de niveau 1, pour la classe comme pour le don', () => {
    const dto = toCharacterBuildDetailDto(characterWith(FULL_BUILD));

    expect(dto.classCantrips).toEqual(['guidance']);
    expect(dto.classSpells).toEqual(['bless']);
    expect(dto.featCantrips).toEqual(['guidance']);
    expect(dto.featSpells).toEqual(['bless']);
  });

  it('renvoie des valeurs par défaut quand une source de choix est absente', () => {
    const withoutFeats: CharacterBuildInput = {
      ...FULL_BUILD,
      choices: FULL_BUILD.choices.filter((choice) => choice.source.type !== 'feat'),
    };

    const dto = toCharacterBuildDetailDto(characterWith(withoutFeats));

    expect(dto.featSkills).toEqual([]);
    expect(dto.featTools).toEqual([]);
    expect(dto.spellcastingAbility).toBeNull();
    expect(dto.spellList).toBeNull();
    expect(dto.featCantrips).toEqual([]);
    expect(dto.featSpells).toEqual([]);
  });
});
