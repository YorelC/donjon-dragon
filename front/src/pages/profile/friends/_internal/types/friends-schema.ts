import { z } from "zod";
import {
  FriendRequestSchema,
  UserSearchQuerySchema,
  UserSummarySchema,
} from "@donjon-dragon/shared";

// Un autre joueur se réduit à son pseudo : ni email, ni identifiant système.
export const ReceivedRequestSchema = FriendRequestSchema.extend({
  requester: UserSummarySchema,
});

export const SentRequestSchema = FriendRequestSchema.extend({
  recipient: UserSummarySchema,
});

export const AcceptedFriendSchema = z.object({
  friendshipId: z.string().uuid(),
  friend: UserSummarySchema,
});

// Mêmes bornes que la route côté serveur, et une seule déclaration pour les deux.
export const SearchFormSchema = z.object({
  query: UserSearchQuerySchema.shape.q,
});

export type ReceivedRequest = z.infer<typeof ReceivedRequestSchema>;
export type SentRequest = z.infer<typeof SentRequestSchema>;
export type AcceptedFriend = z.infer<typeof AcceptedFriendSchema>;
export type SearchFormValues = z.infer<typeof SearchFormSchema>;
