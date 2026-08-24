const STATUSES = ['active'] as const;

export type MembershipStatus = (typeof STATUSES)[number];

/** Les statuts comme OBJET : `MEMBERSHIP_STATUS.active`, jamais le littéral. */
export const MEMBERSHIP_STATUS = Object.fromEntries(
  STATUSES.map((status) => [status, status]),
) as { readonly [S in MembershipStatus]: S };

/** Les mêmes valeurs comme TUPLE : enum de persistance, itérations. */
export const MEMBERSHIP_STATUSES: readonly MembershipStatus[] = STATUSES;
