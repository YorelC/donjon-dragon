import { z } from 'zod';

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

// Le front envoie le displayName du destinataire, pas son id (qu'il ne connaît pas).
export const SendFriendRequestSchema = z.object({
  displayName: z.string().min(2).max(50),
});

// Recherche d'users par displayName (préfixe/substring, insensible à la casse).
export const SearchUsersSchema = z.object({
  query: z.string().min(1).max(50),
});

// ── Suppression d'ami (UA-003) ──────────────────────────────────────────────
/** INV-002 [UA-003] : friendshipId doit être un UUID valide. */
export const DeleteFriendParamsSchema = z.object({
  friendshipId: z.string().uuid(),
});

// ── Badge compteur de demandes reçues (UA-006, UA-008) ──────────────────────
/** INV-001 [UA-008] : count est un entier >= 0. */
export const PendingReceivedCountSchema = z.object({
  count: z.number().int().min(0),
});

export type FriendshipStatus = z.infer<typeof FriendshipStatusEnum>;
export type Friendship = z.infer<typeof FriendshipSchema>;
export type SendFriendRequestDto = z.infer<typeof SendFriendRequestSchema>;
export type SearchUsersDto = z.infer<typeof SearchUsersSchema>;
export type DeleteFriendParams = z.infer<typeof DeleteFriendParamsSchema>;
export type PendingReceivedCount = z.infer<typeof PendingReceivedCountSchema>;

// ── Matrice UA → INV ────────────────────────────────────────────────────────
// UA-001 (ouverture modale)      → INV-006 [ADR-002] : displayName dans le titre
// UA-002 (fermeture annuler)     → INV-005 [ADR-002] : pas d'appel API, état null
// UA-003 (DELETE optimiste)      → INV-002 (DeleteFriendParamsSchema) + INV-003 [ADR-002] : bouton disabled pendant mutation
// UA-004 (toast succès)          → purement front (sonner, pas d'INV Zod)
// UA-005 (toast échec + rollback)→ INV-004 [ADR-002] : restauration snapshot à la position d'origine
// UA-006 (badge >0)              → INV-001 (count >= 0) + INV-007 [ADR-002] : rendu conditionnel
// UA-007 (badge 9+)              → INV-008 [ADR-002] : truncation "9+" + aria-label
// UA-008 (query count)           → INV-001 (PendingReceivedCountSchema)
// UA-009 (refetch onglet reçues) → purement front (refetch TanStack Query, pas d'INV Zod)
// UA-010 (badge caché si 0)      → INV-007 [ADR-002] : pas de rendu si count === 0
