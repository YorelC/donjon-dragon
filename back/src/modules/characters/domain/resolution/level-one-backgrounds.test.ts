import { describe, expect, it } from 'vitest';

import { CharacterChoices, type CharacterChoice } from '../character-choices';
import { BACKGROUNDS } from '../reference/backgrounds';
import {
  ARTISAN_TOOLS, GAMING_SETS, MUSICAL_INSTRUMENTS,
} from '../reference/creation-options';
import { BACKGROUND_KEYS, type BackgroundKey, type ClassKey } from '../reference/keys';
import { SKILLS, type SkillName } from '../reference/skills';
import { SPELLS } from '../reference/spells';
import { validateChoices } from './validate-choices';

describe('16 historiques du niveau 1', () => {
  BACKGROUND_KEYS.forEach((backgroundKey) => {
    it(backgroundKey, () => {
      expect(() => validateChoices(validInput(backgroundKey))).not.toThrow();
    });
  });
});

function validInput(backgroundKey: BackgroundKey) {
  const choices = choicesFor(backgroundKey);
  return {
    speciesKey: 'dwarf' as const, lineageKey: null,
    standardLanguages: ['elvish', 'dwarvish'] as const,
    classKey: 'fighter' as const, backgroundKey,
    choices: CharacterChoices.create(choices),
  };
}

function choicesFor(backgroundKey: BackgroundKey): CharacterChoice[] {
  const background = BACKGROUNDS[backgroundKey];
  const classSkills = ['acrobatics', 'animalHandling', 'athletics', 'history', 'insight',
    'intimidation', 'perception', 'survival'] as const;
  const available = classSkills.filter((skill) => !background.skillProficiencies.includes(skill));
  const classChoice: CharacterChoice = {
    source: { type: 'class', key: 'fighter' }, skills: available.slice(0, 2),
    fightingStyle: 'archery', weaponMasteries: ['club', 'dagger', 'greatclub'],
  };
  const backgroundChoice = backgroundToolChoice(backgroundKey);
  const featChoice = originFeatChoice(backgroundKey, classChoice, backgroundChoice);
  return [classChoice, ...backgroundChoice, ...featChoice];
}

function backgroundToolChoice(backgroundKey: BackgroundKey): CharacterChoice[] {
  const catalogs: Partial<Record<BackgroundKey, readonly string[]>> = {
    artisan: ARTISAN_TOOLS, entertainer: MUSICAL_INSTRUMENTS,
    guard: GAMING_SETS, noble: GAMING_SETS, soldier: GAMING_SETS,
  };
  const tool = catalogs[backgroundKey]?.[0];
  return tool ? [{ source: { type: 'background', key: backgroundKey }, tools: [tool] }] : [];
}

function originFeatChoice(
  backgroundKey: BackgroundKey,
  classChoice: CharacterChoice,
  backgroundChoice: CharacterChoice[],
): CharacterChoice[] {
  const feat = BACKGROUNDS[backgroundKey].originFeat;
  const occupiedSkills = [
    ...BACKGROUNDS[backgroundKey].skillProficiencies,
    ...(classChoice.skills ?? []),
  ];
  const occupiedTools = backgroundChoice.flatMap((choice) => choice.tools ?? []);
  if (feat === 'skilled') return [featWithSkills(feat, occupiedSkills)];
  if (feat === 'crafter') return [featWithTools(feat, ARTISAN_TOOLS, occupiedTools)];
  if (feat === 'musician') return [featWithTools(feat, MUSICAL_INSTRUMENTS, occupiedTools)];
  if (feat === 'magic-initiate') return [magicInitiate(backgroundKey)];
  return [];
}

function featWithSkills(feat: string, occupied: readonly SkillName[]): CharacterChoice {
  return {
    source: { type: 'feat', key: feat },
    skills: SKILLS.filter((skill) => !occupied.includes(skill)).slice(0, 3),
  };
}

function featWithTools(
  feat: string,
  catalog: readonly string[],
  occupied: readonly string[],
): CharacterChoice {
  return {
    source: { type: 'feat', key: feat },
    tools: catalog.filter((tool) => !occupied.includes(tool)).slice(0, 3),
  };
}

function magicInitiate(backgroundKey: BackgroundKey): CharacterChoice {
  const list = BACKGROUNDS[backgroundKey].originFeatSpellList as ClassKey;
  const spells = Object.values(SPELLS).filter((spell) => spell.classLists.includes(list));
  return {
    source: { type: 'feat', key: 'magic-initiate' },
    spellList: list, spellcastingAbility: 'wisdom',
    spells: [
      ...spells.filter((spell) => spell.level === 0).slice(0, 2),
      ...spells.filter((spell) => spell.level === 1).slice(0, 1),
    ].map((spell) => spell.key),
  };
}
