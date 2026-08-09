import { InvalidDomainError } from './domain.error';
import { isUuid } from './uuid';

export class InvalidUserIdError extends InvalidDomainError {
  constructor() {
    super('Invalid user id');
  }
}

/**
 * Identité d'un utilisateur, partagée par les contextes qui la manipulent sans
 * connaître l'agrégat User.
 *
 * `brand` n'existe qu'à la compilation (`declare` : aucun champ émis). Deux
 * membres privés issus de déclarations différentes rendent les classes
 * incompatibles : sans lui, tout identifiant serait `{ value: string }` et se
 * substituerait silencieusement — exactement le bug que ce type doit empêcher.
 */
export class UserId {
  declare private readonly brand: 'UserId';

  private constructor(readonly value: string) {}

  static create(raw: string): UserId {
    if (!isUuid(raw)) throw new InvalidUserIdError();
    return new UserId(raw);
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
