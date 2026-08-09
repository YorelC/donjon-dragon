import type { TokenPayload } from '@donjon-dragon/shared/auth-schema';
import type { UserId } from '@kernel/domain/user-id';

/**
 * Contenu métier de l'access token d'un joueur connecté : identique après login,
 * vérification d'email et rotation du refresh token.
 *
 * Le jeton ne porte que l'identité. Toute autorisation se décide sur l'état en
 * base, au moment de la requête — voir le commentaire de TokenPayloadSchema.
 *
 * Reste une fonction et non une classe : ce n'est pas un agrégat mais la
 * construction d'un payload de transport, dont la forme appartient à shared/.
 */
export function createAccessTokenPayload(userId: UserId): TokenPayload {
  return { userId: userId.value };
}
