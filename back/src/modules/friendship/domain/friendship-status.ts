/**
 * Statut déclaré ici et non importé de shared/ : le domaine ne dépend d'aucun
 * schéma de transport. La cohérence avec FriendshipStatusEnum est garantie par
 * le mapper de réponse, dont le type de retour vient de shared/ — une
 * divergence casse le typecheck.
 */
export const FRIENDSHIP_STATUSES = ['pending', 'accepted', 'refused'] as const;

export type FriendshipStatus = (typeof FRIENDSHIP_STATUSES)[number];
