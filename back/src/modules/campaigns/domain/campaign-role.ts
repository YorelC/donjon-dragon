/**
 * Rôle déclaré ici et non importé de shared/ : le domaine ne dépend d'aucun schéma
 * de transport. La cohérence avec `CampaignRoleEnum` est garantie par le mapper de
 * réponse, dont le type de retour vient de shared/ — une divergence casse le
 * typecheck.
 *
 * Un membre porte UN seul rôle : maîtres du jeu et joueurs forment deux ensembles
 * disjoints.
 */
const ROLES = ['gameMaster', 'player'] as const;

export type CampaignRole = (typeof ROLES)[number];

/** Les rôles comme OBJET : `CAMPAIGN_ROLE.gameMaster`, jamais le littéral. */
export const CAMPAIGN_ROLE = Object.fromEntries(
  ROLES.map((role) => [role, role]),
) as { readonly [R in CampaignRole]: R };

/** Les mêmes valeurs comme TUPLE : enum de persistance, itérations. */
export const CAMPAIGN_ROLES: readonly CampaignRole[] = ROLES;
