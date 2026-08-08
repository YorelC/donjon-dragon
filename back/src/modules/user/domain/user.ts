import { randomUUID } from 'crypto';
import { UserId } from '@kernel/domain/user-id';

import { DisplayName } from './display-name';
import { Email } from './email';

/**
 * État brut du compte, frontière avec la persistance et la sérialisation.
 * `passwordHash` en fait partie : c'est le mapper de réponse qui le retire, pas
 * l'agrégat — lui doit pouvoir être persisté en entier.
 */
export interface UserSnapshot {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  emailVerified: boolean;
  createdAt: string;
}

/**
 * Aggregate root du compte utilisateur.
 *
 * Le hash du mot de passe entre ici tout fait : le hashage est une
 * préoccupation d'auth, l'agrégat ne fait que le porter. En revanche il est
 * seul à décider de l'état `emailVerified`.
 */
export class User {
  private constructor(
    readonly id: UserId,
    readonly email: Email,
    readonly displayName: DisplayName,
    readonly passwordHash: string,
    private verified: boolean,
    readonly createdAt: string,
  ) {}

  /** Nouveau compte : jamais vérifié à la création. */
  static register(params: {
    email: Email;
    displayName: DisplayName;
    passwordHash: string;
  }): User {
    return new User(
      UserId.create(randomUUID()),
      params.email,
      params.displayName,
      params.passwordHash,
      false,
      new Date().toISOString(),
    );
  }

  /** Réhydratation depuis la persistance : aucun invariant rejoué. */
  static restore(snapshot: UserSnapshot): User {
    return new User(
      UserId.create(snapshot.id),
      Email.create(snapshot.email),
      DisplayName.create(snapshot.displayName),
      snapshot.passwordHash,
      snapshot.emailVerified,
      snapshot.createdAt,
    );
  }

  get emailVerified(): boolean {
    return this.verified;
  }

  /** Seule transition de l'agrégat, et elle est idempotente. */
  markEmailVerified(): void {
    this.verified = true;
  }

  snapshot(): UserSnapshot {
    return {
      id: this.id.value,
      email: this.email.value,
      displayName: this.displayName.value,
      passwordHash: this.passwordHash,
      emailVerified: this.verified,
      createdAt: this.createdAt,
    };
  }
}
