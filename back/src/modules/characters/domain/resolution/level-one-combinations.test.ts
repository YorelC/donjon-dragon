import { describe, expect, it } from 'vitest';

import { CLASS_KEYS, SPECIES_KEYS } from '../reference/keys';
import { levelOneInput } from '../../testing/level-one-choices.fixture';
import { validateChoices } from './validate-choices';

describe('120 combinaisons espèce-classe du niveau 1', () => {
  SPECIES_KEYS.forEach((speciesKey) => {
    CLASS_KEYS.forEach((classKey) => {
      it(`${speciesKey} / ${classKey}`, () => {
        const input = levelOneInput({ speciesKey, classKey, backgroundKey: 'farmer' });

        expect(() => validateChoices(input)).not.toThrow();
      });
    });
  });
});
