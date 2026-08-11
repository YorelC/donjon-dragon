import { InvalidDomainError } from '@kernel/domain/domain.error';

/**
 * Bornes redéclarées ici, comme pour `CampaignName` : le domaine ne dépend
 * d'aucun schéma de transport. `CHARACTER_NAME_RULES` (shared/) porte les
 * mêmes valeurs pour le formulaire et le 400 du controller.
 */
export const CHARACTER_NAME_LENGTH = {
  min: 2,
  max: 50,
} as const;

export class InvalidCharacterNameError extends InvalidDomainError {
  constructor() {
    super('Invalid character name');
  }
}

export class CharacterName {
  declare private readonly brand: 'CharacterName';

  private constructor(readonly value: string) {}

  static create(raw: string): CharacterName {
    const name = raw.trim();
    if (!isWithinBounds(name)) throw new InvalidCharacterNameError();
    return new CharacterName(name);
  }

  equals(other: CharacterName): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

function isWithinBounds(name: string): boolean {
  return (
    name.length >= CHARACTER_NAME_LENGTH.min &&
    name.length <= CHARACTER_NAME_LENGTH.max
  );
}
