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
// UA-003 (DELETE)       → INV-002 (DeleteFriendParamsSchema)
// UA-006 (badge >0)     → couvert par INV-001 + logique front (UA-006, UA-010)
// UA-007 (badge 9+)     → purement front (truncation d'affichage)
// UA-008 (query count)  → INV-001 (PendingReceivedCountSchema)
