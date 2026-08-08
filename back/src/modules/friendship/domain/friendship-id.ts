import { InvalidDomainError } from '@kernel/domain/domain.error';
import { isUuid } from '@kernel/domain/uuid';

/**
 * Arme INV-002 (DeleteFriendParamsSchema dans shared/), qui exigeait un UUID
 * pour friendshipId sans que rien ne le vérifie côté serveur : le paramètre
 * d'URL partait tel quel dans une requête Mongo.
 */
export class InvalidFriendshipIdError extends InvalidDomainError {
  constructor() {
    super('Invalid friendship id');
  }
}

export class FriendshipId {
  declare private readonly brand: 'FriendshipId';

  private constructor(readonly value: string) {}

  static create(raw: string): FriendshipId {
    if (!isUuid(raw)) throw new InvalidFriendshipIdError();
    return new FriendshipId(raw);
  }

  equals(other: FriendshipId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
