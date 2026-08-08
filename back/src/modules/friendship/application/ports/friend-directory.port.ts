import type { PublicUser } from '@donjon-dragon/shared/user-schema';

export const FRIEND_DIRECTORY = Symbol('FRIEND_DIRECTORY');

/**
 * Anti-corruption layer : la vue du contexte amitié sur les utilisateurs.
 *
 * Le module amitié ne connaît jamais l'entité `User` du module user, ni son
 * repository — seulement cet annuaire, exprimé dans son propre vocabulaire et
 * limité à ce dont il a besoin : résoudre un pseudo en destinataire, hydrater
 * un identifiant en profil affichable, et chercher des gens à ajouter.
 *
 * Le seul implémenteur qui traverse la frontière vit dans infrastructure/acl/.
 */
export interface FriendDirectoryPort {
  findById(id: string): Promise<PublicUser | null>;
  findByDisplayName(displayName: string): Promise<PublicUser | null>;
  search(query: string, limit: number): Promise<PublicUser[]>;
}
