import { InvalidDomainError } from '@kernel/domain/domain.error';

/**
 * Race et classe partagent la même forme de validation — un texte court, non
 * vide — d'où un seul value object paramétré par son étiquette d'erreur, plutôt
 * que deux classes identiques.
 */
export const CHARACTER_TRAIT_LENGTH = {
  min: 2,
  max: 30,
} as const;

export class InvalidCharacterTraitError extends InvalidDomainError {
  constructor(label: string) {
    super(`Invalid ${label}`);
  }
}

export class CharacterTrait {
  declare private readonly brand: 'CharacterTrait';

  private constructor(readonly value: string) {}

  static create(raw: string, label: string): CharacterTrait {
    const trait = raw.trim();
    if (!isWithinBounds(trait)) throw new InvalidCharacterTraitError(label);
    return new CharacterTrait(trait);
  }

  equals(other: CharacterTrait): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

function isWithinBounds(trait: string): boolean {
  return (
    trait.length >= CHARACTER_TRAIT_LENGTH.min &&
    trait.length <= CHARACTER_TRAIT_LENGTH.max
  );
}
