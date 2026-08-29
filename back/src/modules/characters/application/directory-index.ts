import type {
  CharacterDirectoryPort,
  CharacterDirectoryUser,
} from './ports/character-directory.port';

/**
 * Hydrate N identifiants en une lecture, indexes pour un acces direct.
 *
 * Jumelle assumee de `friendship/application/directory-index.ts` : les deux
 * ports sont des anti-corruption layers distincts, et un module ne traverse pas
 * les ports d'un autre. Ce qui est partage, c'est le patron, pas le code.
 */
export async function indexCharacterDirectoryUsers(
  directory: CharacterDirectoryPort,
  ids: readonly string[],
): Promise<Map<string, CharacterDirectoryUser>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();

  const users = await directory.findManyByIds(unique);
  return new Map(users.map((user) => [user.id, user]));
}
