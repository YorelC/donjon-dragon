import { InvalidDomainError } from '@kernel/domain/domain.error';

export class InvalidDisplayNameError extends InvalidDomainError {
  constructor() {
    super('Display name must be between 2 and 50 characters');
  }
}

const MIN_LENGTH = 2;
const MAX_LENGTH = 50;

/**
 * Pseudo public d'un compte. Bornes alignées sur UserSchema.displayName dans
 * shared/ : le schéma protège la frontière HTTP, ce type protège l'agrégat quel
 * que soit l'appelant.
 *
 * Les espaces de bord sont retirés, sinon « alice » et « alice » seraient deux
 * pseudos distincts pour un humain qui lit l'écran.
 */
export class DisplayName {
  declare private readonly brand: 'DisplayName';

  private constructor(readonly value: string) {}

  static create(raw: string): DisplayName {
    const trimmed = raw.trim();
    if (trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH) {
      throw new InvalidDisplayNameError();
    }

    return new DisplayName(trimmed);
  }

  equals(other: DisplayName): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
