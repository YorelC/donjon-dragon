export const CHARACTER_DIRECTORY = Symbol('CHARACTER_DIRECTORY');

/**
 * Ce que le contexte personnages connaît d'un utilisateur : de quoi construire
 * ses agrégats (`id`) et de quoi l'afficher (`displayName`). Type propre au
 * module, comme `DirectoryUser` de campaigns — pas de contrat partagé emprunté.
 */
export interface CharacterDirectoryUser {
  id: string;
  displayName: string;
}

export interface CharacterDirectoryPort {
  findById(id: string): Promise<CharacterDirectoryUser | null>;
  findByDisplayName(displayName: string): Promise<CharacterDirectoryUser | null>;

  /**
   * La liste des personnages d'une campagne affiche le joueur de chaque fiche
   * assignee : une lecture par fiche serait un N+1 des la deuxieme. L'ordre
   * n'est pas garanti et un identifiant inconnu est absent du resultat.
   */
  findManyByIds(ids: string[]): Promise<CharacterDirectoryUser[]>;
}
