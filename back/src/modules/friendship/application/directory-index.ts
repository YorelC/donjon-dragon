import type {
  DirectoryUser,
  FriendDirectoryPort,
} from './ports/friend-directory.port';

/**
 * Hydrate N identifiants en une lecture, indexés pour un accès direct.
 *
 * Les listes d'amitiés ont toutes la même forme : une page d'agrégats, puis le
 * pseudo de l'autre joueur. La boucle naïve rejouait une requête par ligne.
 */
export async function indexDirectoryUsers(
  directory: FriendDirectoryPort,
  ids: string[],
): Promise<Map<string, DirectoryUser>> {
  const users = await directory.findByIds([...new Set(ids)]);
  return new Map(users.map((user) => [user.id, user]));
}
