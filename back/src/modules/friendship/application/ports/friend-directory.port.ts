export const FRIEND_DIRECTORY = Symbol('FRIEND_DIRECTORY');

/**
 * Ce que le contexte amitié connaît d'un utilisateur : de quoi construire ses
 * agrégats (`id`) et de quoi l'afficher (`displayName`).
 *
 * Type propre au module, et non `PublicUser` emprunté au contrat partagé : c'est
 * la définition même d'une anti-corruption layer. `id` ne quitte jamais le
 * serveur — c'est `toUserSummary` (friendship.mapper) qui produit la réponse.
 */
export interface DirectoryUser {
  id: string;
  displayName: string;
}

export interface DirectoryPage {
  items: DirectoryUser[];
  hasMore: boolean;
}

/**
 * Anti-corruption layer : la vue du contexte amitié sur les utilisateurs.
 *
 * Le module amitié ne connaît jamais l'agrégat `User` du module user, ni son
 * repository — seulement cet annuaire, limité à ce dont il a besoin : résoudre un
 * pseudo en destinataire, hydrater un identifiant, et chercher des gens à ajouter.
 *
 * Le seul implémenteur qui traverse la frontière vit dans infrastructure/acl/.
 */
export interface FriendDirectoryPort {
  findById(id: string): Promise<DirectoryUser | null>;

  // Hydratation d'une liste : une seule lecture pour N amitiés. Sans elle, chaque
  // ligne d'une liste d'amis rejouait une requête (N+1).
  findByIds(ids: string[]): Promise<DirectoryUser[]>;
  findByDisplayName(displayName: string): Promise<DirectoryUser | null>;
  search(query: string, page: number, limit: number): Promise<DirectoryPage>;
}
