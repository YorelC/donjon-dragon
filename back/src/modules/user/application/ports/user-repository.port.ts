import type { UserId } from '@kernel/domain/user-id';

import type { DisplayName } from '../../domain/display-name';
import type { Email } from '../../domain/email';
import type { User } from '../../domain/user';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

/**
 * Le port parle l'agrégat, pas le document. Il n'est fourni qu'à l'intérieur du
 * module user (règle `user-repository-is-private` de dependency-cruiser) :
 * ailleurs, on passe par les use-cases, qui garantissent les invariants.
 */
export interface UserRepositoryPort {
  save(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;

  // Lookup exact (unicité à l'inscription, résolution d'une demande d'ami
  // envoyée par displayName).
  findByDisplayName(displayName: DisplayName): Promise<User | null>;

  // Recherche floue insensible à la casse (fonction "rechercher des users").
  searchByDisplayName(query: string, limit: number): Promise<User[]>;
}
