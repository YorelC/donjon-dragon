export const CAMPAIGN_DIRECTORY = Symbol('CAMPAIGN_DIRECTORY');

/**
 * Ce que le contexte campagne connaît d'un utilisateur : de quoi construire ses
 * agrégats (`id`) et de quoi l'afficher (`displayName`).
 *
 * Type propre au module, et non `PublicUser` emprunté au contrat partagé : c'est
 * la définition même d'une anti-corruption layer. `id` ne quitte jamais le
 * serveur — c'est le mapper d'application qui produit la réponse.
 */
export interface DirectoryUser {
  id: string;
  displayName: string;
}

/**
 * Anti-corruption layer : la vue du contexte campagne sur les utilisateurs.
 *
 * Deux besoins, deux méthodes : résoudre le pseudo d'un invité en identifiant, et
 * réafficher un identifiant stocké dans l'agrégat. Le seul implémenteur qui
 * traverse la frontière vit dans infrastructure/acl/.
 */
export interface CampaignDirectoryPort {
  findById(id: string): Promise<DirectoryUser | null>;
  findByDisplayName(displayName: string): Promise<DirectoryUser | null>;

  /**
   * Le détail d'une campagne affiche tous ses membres : une lecture par membre
   * serait un N+1 dès la deuxième campagne. L'ordre n'est pas garanti et un
   * identifiant inconnu est absent du résultat.
   */
  findManyByIds(ids: string[]): Promise<DirectoryUser[]>;
}
