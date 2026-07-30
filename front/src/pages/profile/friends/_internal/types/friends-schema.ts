import { z } from "zod";
import {
  FriendshipSchema,
  PublicUserSchema,
} from "@donjon-dragon/shared";

export const ReceivedRequestSchema = FriendshipSchema.extend({
  requester: PublicUserSchema,
});

export const SentRequestSchema = FriendshipSchema.extend({
  recipient: PublicUserSchema,
});

export const AcceptedFriendSchema = z.object({
  friendshipId: z.string().uuid(),
  friend: PublicUserSchema,
});

export const SearchFormSchema = z.object({
  query: z.string().min(2).max(50),
});

export type ReceivedRequest = z.infer<typeof ReceivedRequestSchema>;
export type SentRequest = z.infer<typeof SentRequestSchema>;
export type AcceptedFriend = z.infer<typeof AcceptedFriendSchema>;
export type SearchFormValues = z.infer<typeof SearchFormSchema>;
