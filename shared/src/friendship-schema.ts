import { z } from 'zod';

import { displayNameField, UserSummarySchema } from './user-schema.js';

// Statut d'une relation d'amitié. Un seul document par paire d'users
// (symétrique une fois 'accepted') — jamais dupliqué A→B / B→A.
export const FriendshipStatusEnum = z.enum(['pending', 'accepted', 'refused']);

// requesterId = celui qui a envoyé la demande, recipientId = destinataire.
// La direction ne compte que tant que status === 'pending'. Une fois
// 'accepted', la relation est bidirectionnelle (A ami de B ⇔ B ami de A).
export const FriendshipSchema = z.object({
  id: z.string().uuid(),
  requesterId: z.string().uuid(),
  recipientId: z.string().uuid(),
  status: FriendshipStatusEnum,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Ce que le CLIENT reçoit d'une relation d'amitié.
 *
 * `requesterId` et `recipientId` n'en font PAS partie : ce sont des identifiants
 * d'utilisateurs, et le client n'a pas à connaître l'identité système des autres
 * joueurs. `id` reste, c'est le handle de la ressource — celui qu'on accepte,
 * refuse ou supprime.
 *
 * FriendshipSchema reste la forme complète, côté serveur uniquement.
 */
export const FriendRequestSchema = FriendshipSchema.omit({
  requesterId: true,
  recipientId: true,
});

// Le front envoie le displayName du destinataire, pas son id (qu'il ne connaît pas).
export const SendFriendRequestSchema = z.object({
  displayName: displayNameField(),
});

/**
 * Recherche d'utilisateurs par pseudo (sous-chaîne, insensible à la casse).
 *
 * Minimum 3 caractères : en dessous, la route devient une énumération de
 * l'annuaire, qu'on peut balayer lettre par lettre. Maximum 25 : borne le coût du
 * `$regex` côté Mongo.
 *
 * Source unique de ces bornes — le back la passe à @ZodQuery, le formulaire front
 * réutilise `UserSearchQuerySchema.shape.q`.
 */
export const SEARCH_QUERY_RULES = {
  min: 3,
  max: 25,
} as const;

/** Taille de page de la recherche d'utilisateurs — back et front la partagent. */
export const SEARCH_PAGE_SIZE = 20;

const FIRST_PAGE = 1;

export const UserSearchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(SEARCH_QUERY_RULES.min, {
      message: `Entre au moins ${SEARCH_QUERY_RULES.min} caractères pour chercher.`,
    })
    .max(SEARCH_QUERY_RULES.max, {
      message: `La recherche ne peut pas dépasser ${SEARCH_QUERY_RULES.max} caractères.`,
    }),
  // Query param HTTP = toujours une string : coercition + défaut pour que le
  // premier appel (sans ?page) reste valide.
  page: z.coerce.number().int().min(FIRST_PAGE).default(FIRST_PAGE),
});

/**
 * Ce que le client reçoit d'une page de résultats de recherche. `hasMore` porte
 * toute l'information de pagination : pas de `total`, pas de `page` en retour, le
 * front n'en a pas l'usage — il incrémente son propre compteur de page.
 */
export const UserSearchResultSchema = z.object({
  items: z.array(UserSummarySchema),
  hasMore: z.boolean(),
});

// ── Suppression d'ami (UA-003) ──────────────────────────────────────────────
/** INV-002 [UA-003] : friendshipId doit être un UUID valide. */
export const FriendshipIdSchema = z.string().uuid();

export const DeleteFriendParamsSchema = z.object({
  friendshipId: FriendshipIdSchema,
});

// ── Badge compteur de demandes reçues (UA-006, UA-008) ──────────────────────
/** INV-001 [UA-008] : count est un entier >= 0. */
export const PendingReceivedCountSchema = z.object({
  count: z.number().int().min(0),
});

export type FriendshipStatus = z.infer<typeof FriendshipStatusEnum>;
export type Friendship = z.infer<typeof FriendshipSchema>;
export type FriendRequest = z.infer<typeof FriendRequestSchema>;
export type SendFriendRequestDto = z.infer<typeof SendFriendRequestSchema>;
export type UserSearchQuery = z.infer<typeof UserSearchQuerySchema>;
export type UserSearchResult = z.infer<typeof UserSearchResultSchema>;
export type DeleteFriendParams = z.infer<typeof DeleteFriendParamsSchema>;
export type PendingReceivedCount = z.infer<typeof PendingReceivedCountSchema>;

// ── Matrice UA → INV ────────────────────────────────────────────────────────
// UA-001 (ouverture modale)      → INV-006 [ADR-002] : titre "Voulez-vous vraiment supprimer {displayName} ?"
// UA-002 (fermeture annuler)     → INV-005 [ADR-002] : pas d'appel API, état null
// UA-003 (DELETE optimiste)      → INV-002 (DeleteFriendParamsSchema) + INV-003 [ADR-002] : bouton disabled pendant mutation
// UA-004 (toast succès)          → purement front (sonner, pas d'INV Zod)
// UA-005 (toast échec + rollback)→ INV-004 [ADR-002] : restauration snapshot à la position d'origine
// UA-006 (badge >0)              → INV-001 (count >= 0) + INV-007 [ADR-002] : rendu conditionnel
// UA-007 (badge 9+)              → INV-008 [ADR-002] : truncation "9+" + aria-label
// UA-008 (query count)           → INV-001 (PendingReceivedCountSchema)
// UA-009 (refetch onglet reçues) → purement front (refetch TanStack Query, pas d'INV Zod)
// UA-010 (badge caché si 0)      → INV-007 [ADR-002] : pas de rendu si count === 0
