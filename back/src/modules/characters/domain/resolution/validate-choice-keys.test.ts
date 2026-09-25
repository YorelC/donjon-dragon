import { describe, expect, it } from 'vitest';

import { CharacterChoices, type CharacterChoice } from '../character-choices';
import { InvalidCharacterChoiceError, UnknownLineageError } from './choice-validation';
import { validateChoiceKeys } from './validate-choice-keys';
import { validateChoices } from './validate-choices';

function aWizardInProgress(choices: readonly CharacterChoice[], lineageKey: string | null = null) {
  return {
    speciesKey: 'elf' as const,
    lineageKey,
    standardLanguages: ['dwarvish', 'giant'] as const,
    classKey: 'fighter' as const,
    backgroundKey: 'farmer' as const,
    choices: CharacterChoices.create(choices),
  };
}

describe('contrôle de l’aperçu à mi-parcours', () => {
  it('accepte des choix incomplets que la création refuserait', () => {
    const input = aWizardInProgress([{ source: { type: 'class', key: 'fighter' }, skills: [] }]);

    expect(() => validateChoiceKeys(input)).not.toThrow();
    expect(() => validateChoices(input)).toThrow(InvalidCharacterChoiceError);
  });

  it('refuse une clé inconnue du référentiel', () => {
    const input = aWizardInProgress([
      { source: { type: 'class', key: 'fighter' }, weaponMasteries: ['sabre-laser'] },
    ]);

    expect(() => validateChoiceKeys(input)).toThrow(InvalidCharacterChoiceError);
  });

  it('refuse une source de choix étrangère au personnage', () => {
    const input = aWizardInProgress([{ source: { type: 'class', key: 'wizard' }, spells: [] }]);

    expect(() => validateChoiceKeys(input)).toThrow(InvalidCharacterChoiceError);
  });

  it('accepte un lignage pas encore choisi, refuse un lignage inconnu', () => {
    expect(() => validateChoiceKeys(aWizardInProgress([]))).not.toThrow();
    expect(() => validateChoiceKeys(aWizardInProgress([], 'moon-elf')))
      .toThrow(UnknownLineageError);
  });
});
