import { describe, expect, it } from 'vitest';

import { BACKGROUND_KEYS, CLASS_KEYS, type BackgroundKey } from '../reference/keys';
import { levelOneInput } from '../../testing/level-one-choices.fixture';
import { validateChoices } from './validate-choices';

/**
 * Les historiques portent ce que l'espèce ne croise pas : outil au choix, don
 * d'Origine à paramétrer, Initié à la magie à liste imposée. Le Nain, sans
 * choix d'espèce, laisse l'historique seul face à chaque classe.
 */
describe('192 combinaisons historique-classe du niveau 1', () => {
  BACKGROUND_KEYS.forEach((backgroundKey) => {
    CLASS_KEYS.forEach((classKey) => {
      it(`${backgroundKey} / ${classKey}`, () => {
        const input = levelOneInput({ speciesKey: 'dwarf', classKey, backgroundKey });

        expect(() => validateChoices(input)).not.toThrow();
      });
    });
  });
});

/**
 * L'Humain qui prend Initié à la magie avec un historique qui l'accorde déjà :
 * deux occurrences distinctes, deux listes, aucun sort commun (B01-SOR-006).
 */
const MAGIC_INITIATE_BACKGROUNDS: readonly BackgroundKey[] = ['acolyte', 'guide', 'sage'];

describe('deux Initiés à la magie pour un Humain', () => {
  MAGIC_INITIATE_BACKGROUNDS.forEach((backgroundKey) => {
    CLASS_KEYS.forEach((classKey) => {
      it(`human / ${backgroundKey} / ${classKey}`, () => {
        const input = levelOneInput({
          speciesKey: 'human', classKey, backgroundKey, speciesFeat: 'magic-initiate',
        });

        expect(() => validateChoices(input)).not.toThrow();
      });
    });
  });
});
