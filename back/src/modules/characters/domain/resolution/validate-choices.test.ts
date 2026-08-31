import { describe, expect, it } from 'vitest';

import { CharacterChoices, type CharacterChoice } from '../character-choices';
import { SPELLS } from '../reference/spells';
import { A_CHARACTER_BUILD } from '../../testing/character.fixture';
import { InvalidCharacterChoiceError } from './choice-validation';
import { validateChoices } from './validate-choices';
import { validateSpellChoices } from './validate-spell-choices';

describe('validation autoritaire des choix B01', () => {
  it('refuse une source de choix qui ne fait pas partie du build', () => {
    const choices = [...A_CHARACTER_BUILD.choices, {
      source: { type: 'class' as const, key: 'fighter' },
    }];

    expect(() => validate(choices)).toThrow(InvalidCharacterChoiceError);
  });

  it('exige la caractéristique magique du lignage quand il en propose une', () => {
    const choices = A_CHARACTER_BUILD.choices.map(copyChoice);
    choices.push({ source: { type: 'species', key: 'elf' }, skills: ['survival'] });
    choices.push({ source: { type: 'lineage', key: 'high-elf' } });

    expect(() => validateChoices({
      ...A_CHARACTER_BUILD, speciesKey: 'elf', lineageKey: 'high-elf', size: 'Medium',
      choices: CharacterChoices.create(choices),
    })).toThrow(InvalidCharacterChoiceError);
  });

  it('limite le choix d outil de l Artiste aux instruments', () => {
    const classChoice = {
      ...copyChoice(A_CHARACTER_BUILD.choices[0]!),
      skills: ['athletics', 'insight', 'perception', 'stealth'] as const,
    };
    const choices: CharacterChoice[] = [
      classChoice,
      { source: { type: 'background', key: 'entertainer' }, tools: ['smiths-tools'] },
      { source: { type: 'feat', key: 'musician' }, tools: ['lute', 'lyre', 'flute'] },
    ];

    expect(() => validateChoices({
      ...A_CHARACTER_BUILD, backgroundKey: 'entertainer',
      choices: CharacterChoices.create(choices),
    })).toThrow(InvalidCharacterChoiceError);
  });

  it('refuse les sorts préparés du Magicien absents de son grimoire', () => {
    const cantrips = wizardSpells(0, 3);
    const levelOne = wizardSpells(1, 7);
    const choice: CharacterChoice = {
      source: { type: 'class', key: 'wizard' },
      spells: [...cantrips, ...levelOne.slice(0, 4)],
      spellbook: levelOne.slice(1, 7),
    };

    expect(() => validateSpellChoices(spellInput('wizard', [choice])))
      .toThrow(InvalidCharacterChoiceError);
  });

  it('distingue les deux Initiés à la magie d un Humain Acolyte', () => {
    const choices = humanAcolyteChoices(true);

    expect(() => validateChoices({
      ...A_CHARACTER_BUILD, speciesKey: 'human', size: 'Small', backgroundKey: 'acolyte',
      choices: CharacterChoices.create(choices),
    })).not.toThrow();
  });

  it('refuse deux Initiés à la magie sans provenance distincte', () => {
    const choices = humanAcolyteChoices(false);

    expect(() => validateChoices({
      ...A_CHARACTER_BUILD, speciesKey: 'human', size: 'Small', backgroundKey: 'acolyte',
      choices: CharacterChoices.create(choices),
    })).toThrow(InvalidCharacterChoiceError);
  });

  it('accepte une forme normale pour le Pacte de la chaîne', () => {
    expect(() => validateChoices(warlockInput('owl'))).not.toThrow();
  });

  it('refuse une forme de familier hors catalogue', () => {
    expect(() => validateChoices(warlockInput('dragon')))
      .toThrow(InvalidCharacterChoiceError);
  });

  // Le Voyageur concrétise une boîte de jeux dans son paquetage, mais sa
  // maîtrise d'outil est fixe : les deux catalogues ne doivent pas fusionner.
  it("n'accorde aucun choix de maîtrise d'outil au Voyageur", () => {
    expect(() => validateWayfarer([])).not.toThrow();
    expect(() => validateWayfarer(['dice-set'])).toThrow(InvalidCharacterChoiceError);
  });
});

function validateWayfarer(tools: readonly string[]): void {
  const choices: CharacterChoice[] = [
    {
      source: { type: 'class', key: 'barbarian' },
      skills: ['athletics', 'intimidation'],
      weaponMasteries: ['greataxe', 'handaxe'],
    },
    ...(tools.length === 0
      ? []
      : [{ source: { type: 'background' as const, key: 'wayfarer' }, tools: [...tools] }]),
  ];

  validateChoices({
    ...A_CHARACTER_BUILD, classKey: 'barbarian', backgroundKey: 'wayfarer',
    choices: CharacterChoices.create(choices),
  });
}

function validate(choices: readonly CharacterChoice[]): void {
  validateChoices({ ...A_CHARACTER_BUILD, choices: CharacterChoices.create(choices) });
}

function spellInput(classKey: 'wizard', choices: readonly CharacterChoice[]) {
  return {
    speciesKey: 'halfling' as const, lineageKey: null, size: 'Small' as const,
    standardLanguages: ['elvish', 'dwarvish'] as const, classKey,
    backgroundKey: 'farmer' as const, choices: CharacterChoices.create(choices),
  };
}

function wizardSpells(level: 0 | 1, count: number) {
  return Object.values(SPELLS)
    .filter((spell) => spell.level === level && spell.classLists.includes('wizard'))
    .slice(0, count)
    .map((spell) => spell.key);
}

function humanAcolyteChoices(withProvenance: boolean): CharacterChoice[] {
  return [
    {
      source: { type: 'class', key: 'rogue' },
      skills: ['acrobatics', 'athletics', 'perception', 'stealth'],
      expertise: ['perception', 'stealth'], languages: ['gnomish'],
      weaponMasteries: ['dagger', 'shortbow'],
    },
    {
      source: { type: 'species', key: 'human' }, skills: ['persuasion'],
      originFeat: 'magic-initiate',
    },
    magicInitiate('cleric', 'background', 'acolyte', withProvenance),
    magicInitiate('wizard', 'species', 'human', withProvenance),
  ];
}

function magicInitiate(
  list: 'cleric' | 'wizard',
  type: 'background' | 'species',
  key: string,
  withProvenance: boolean,
): CharacterChoice {
  const spells = classSpells(list);
  return {
    source: {
      type: 'feat', key: 'magic-initiate',
      grantedBy: withProvenance ? { type, key } : undefined,
    },
    spellList: list, spellcastingAbility: 'wisdom', spells,
  };
}

function classSpells(list: 'cleric' | 'wizard') {
  const spells = Object.values(SPELLS).filter((spell) => spell.classLists.includes(list));
  const cantrips = spells.filter((spell) => spell.level === 0).slice(0, 2);
  const levelOne = spells.find((spell) => spell.level === 1);
  if (!levelOne) throw new Error('Missing level-one spell fixture');
  return [...cantrips.map((spell) => spell.key), levelOne.key];
}

function warlockInput(familiarForm: string) {
  const spells = Object.values(SPELLS).filter((spell) => spell.classLists.includes('warlock'));
  const chosen = [
    ...spells.filter((spell) => spell.level === 0).slice(0, 2),
    ...spells.filter((spell) => spell.level === 1).slice(0, 2),
  ].map((spell) => spell.key);
  const choices: CharacterChoice[] = [
    {
      source: { type: 'class', key: 'warlock' }, skills: ['arcana', 'intimidation'],
      spells: chosen, invocation: 'pact-of-the-chain', familiarForm,
    },
    {
      source: { type: 'feat', key: 'skilled' },
      skills: ['athletics', 'history', 'medicine'],
    },
  ];
  return {
    ...A_CHARACTER_BUILD, classKey: 'warlock' as const,
    choices: CharacterChoices.create(choices),
  };
}

function copyChoice(choice: CharacterChoice): CharacterChoice {
  return { ...choice, source: { ...choice.source } };
}
