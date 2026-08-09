import { randomUUID } from 'crypto';
import { InvalidDomainError } from '@kernel/domain/domain.error';
import { isUuid } from '@kernel/domain/uuid';

export class InvalidTokenFamilyIdError extends InvalidDomainError {
  constructor() {
    super('Invalid token family id');
  }
}

/**
 * Lignée de refresh tokens issus d'une même connexion. La rotation garde le
 * même familyId ; détecter la réutilisation d'un token révoqué fait tomber la
 * lignée entière.
 *
 * Type distinct de l'id du token, alors que les deux sont des UUID portés par le
 * même objet : `revokeById` et `revokeFamily` prenaient jusqu'ici la même
 * chaîne, et rien n'empêchait de les confondre.
 */
export class TokenFamilyId {
  declare private readonly brand: 'TokenFamilyId';

  private constructor(readonly value: string) {}

  static create(raw: string): TokenFamilyId {
    if (!isUuid(raw)) throw new InvalidTokenFamilyIdError();
    return new TokenFamilyId(raw);
  }

  static fresh(): TokenFamilyId {
    return new TokenFamilyId(randomUUID());
  }

  equals(other: TokenFamilyId): boolean {
    return this.value === other.value;
  }
}
