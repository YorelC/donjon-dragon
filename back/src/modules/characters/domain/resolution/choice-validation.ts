import { InvalidDomainError } from '@kernel/domain/domain.error';

import type { CharacterChoices } from '../character-choices';
import type {
  BackgroundKey,
  ClassKey,
  LineageKey,
  SpeciesKey,
} from '../reference/keys';
import type { CreatureSize, Language } from '../reference/proficiencies';

/**
 * Vocabulaire commun aux deux validateurs de choix.
 *
 * Il existe pour lui-même et non par commodité : `validate-choices` délègue les
 * sorts à `validate-spell-choices`, qui avait besoin en retour de l'erreur et de
 * l'entrée. Les deux se citaient donc mutuellement, et le graphe portait un cycle.
 * Ce qu'ils partagent vit ici, et ne dépend d'aucun des deux.
 */
export class InvalidCharacterChoiceError extends InvalidDomainError {
  constructor(readonly origin: string) {
    super(`Invalid character choice for ${origin}`);
  }
}

export class LineageRequiredError extends InvalidCharacterChoiceError {
  constructor() {
    super('lineage');
  }
}

export class UnknownLineageError extends InvalidCharacterChoiceError {
  constructor() {
    super('lineage');
  }
}

export class InvalidSkillChoiceError extends InvalidCharacterChoiceError {}

export interface ChoicesToValidate {
  speciesKey: SpeciesKey;
  lineageKey: LineageKey | null;
  size?: CreatureSize;
  standardLanguages?: readonly Language[];
  classKey: ClassKey;
  backgroundKey: BackgroundKey;
  choices: CharacterChoices;
}

export function fail(origin: string): never {
  throw new InvalidCharacterChoiceError(origin);
}
