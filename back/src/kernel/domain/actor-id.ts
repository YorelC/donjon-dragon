import { UserId } from './user-id';

declare const actorBrand: unique symbol;

/**
 * Identité de l'appelant AUTHENTIFIÉ, volontairement distincte de `UserId`.
 *
 * Un `UserId` peut désigner n'importe qui : la cible d'une demande d'ami, un
 * profil consulté, un id lu dans une URL. Un `ActorId` ne peut désigner que celui
 * qui a présenté un token valide.
 *
 * Le brand n'existe qu'à la compilation (`declare` : aucun champ émis, aucun coût
 * à l'exécution). Sa raison d'être est mécanique : un `string` venant d'un
 * `@Param`, d'un `@Body` ou d'une `@Query` n'est pas assignable ici, donc un
 * identifiant fourni par le client ne peut plus prendre la place de l'appelant.
 * L'IDOR devient une erreur de `tsc` au lieu d'un oubli de relecture.
 *
 * Même raisonnement que le brand de `UserId`, un cran plus haut : celui-là
 * empêche de confondre deux identifiants, celui-ci empêche de confondre deux
 * PROVENANCES.
 */
export type ActorId = string & { readonly [actorBrand]: 'ActorId' };

/** Ce que `@CurrentUser()` rend, et ce que `request.user` porte. */
export interface AuthenticatedActor {
  readonly userId: ActorId;
}

/**
 * Seul point d'entrée légitime : la stratégie JWT, une fois la signature vérifiée.
 *
 * Un test de conformité (`back/src/architecture.test.ts`) échoue si cette fonction
 * est appelée ailleurs, ou si un `as ActorId` apparaît dans le code de production.
 * Sans ce garde-fou, le typage se contournerait en une ligne.
 */
export function actorFromVerifiedToken(rawUserId: string): ActorId {
  // Passe par UserId pour ne pas dupliquer la validation d'UUID : un payload signé
  // mais malformé doit être refusé ici, pas plus loin.
  return UserId.create(rawUserId).value as ActorId;
}
