import { actorFromVerifiedToken, type ActorId } from '@kernel/domain/actor-id';

/**
 * L'appelant authentifié, pour les tests.
 *
 * Existe pour que les tests disent explicitement « cet identifiant est celui de
 * l'appelant, prouvé par un token » plutôt que de forcer un cast. Un test qui
 * doit appeler ceci pour construire son DTO montre, par sa seule présence, où se
 * trouve la frontière de confiance.
 */
export const anActor = (rawUserId: string): ActorId =>
  actorFromVerifiedToken(rawUserId);
