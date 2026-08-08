import type { User } from '@donjon-dragon/shared/user-schema';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepositoryPort {
  save(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;

  // Lookup exact (unicité à l'inscription, résolution d'une demande d'ami
  // envoyée par displayName).
  findByDisplayName(displayName: string): Promise<User | null>;

  // Recherche floue insensible à la casse (fonction "rechercher des users").
  searchByDisplayName(query: string, limit: number): Promise<User[]>;
}
