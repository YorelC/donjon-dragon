import type { UserId } from '@kernel/domain/user-id';

import type { DisplayName } from '../../domain/display-name';
import type { Email } from '../../domain/email';
import type { User } from '../../domain/user';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserSearchPage {
  items: User[];
  hasMore: boolean;
}

/**
 * Le port parle l'agrégat, pas le document. Il n'est fourni qu'à l'intérieur du
 * module user (règle `user-repository-is-private` de dependency-cruiser) :
 * ailleurs, on passe par les use-cases, qui garantissent les invariants.
 */
export interface UserRepositoryPort {
  save(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;

  // Lecture groupée : afficher les membres d'une campagne demande N pseudos, et
  // une requête par membre serait un N+1. L'ordre du retour n'est pas garanti, et
  // un identifiant inconnu est simplement absent — l'appelant décide quoi en faire.
  findManyByIds(ids: UserId[]): Promise<User[]>;

  findByEmail(email: Email): Promise<User | null>;

  // Lookup exact (unicité à l'inscription, résolution d'une demande d'ami
  // envoyée par displayName).
  findByDisplayName(displayName: DisplayName): Promise<User | null>;

  // Recherche floue insensible à la casse (fonction "rechercher des users"),
  // paginée : page 1-indexée, hasMore indique s'il reste une page suivante.
  searchByDisplayName(query: string, page: number, limit: number): Promise<UserSearchPage>;
}
