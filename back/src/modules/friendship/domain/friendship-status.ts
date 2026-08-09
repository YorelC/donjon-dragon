/**
 * Statut déclaré ici et non importé de shared/ : le domaine ne dépend d'aucun
 * schéma de transport. La cohérence avec FriendshipStatusEnum est garantie par le
 * mapper de réponse, dont le type de retour vient de shared/ — une divergence
 * casse le typecheck.
 */
const STATUSES = ['pending', 'accepted', 'refused'] as const;

export type FriendshipStatus = (typeof STATUSES)[number];

/**
 * Les statuts comme OBJET : on écrit `FRIENDSHIP_STATUS.pending`, jamais le
 * littéral. Une faute de frappe devient une erreur de compilation au lieu d'une
 * comparaison qui échoue en silence.
 */
export const FRIENDSHIP_STATUS = Object.fromEntries(
  STATUSES.map((status) => [status, status]),
) as { readonly [S in FriendshipStatus]: S };

/**
 * Les mêmes valeurs comme TUPLE : enum de persistance, itérations. Dérivé de la
 * même source, donc impossible à désynchroniser.
 */
export const FRIENDSHIP_STATUSES: readonly FriendshipStatus[] = STATUSES;
