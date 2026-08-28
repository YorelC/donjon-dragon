import { z } from "zod";
import { UserSummarySchema } from "@donjon-dragon/shared";

/**
 * L'ami accepté est partagé : la liste sert la page Amis, le bloc d'identité du
 * profil et le compteur de compagnons. Un autre joueur se réduit à son pseudo.
 */
export const AcceptedFriendSchema = z.object({
  friendshipId: z.string().uuid(),
  friend: UserSummarySchema,
});

export type AcceptedFriend = z.infer<typeof AcceptedFriendSchema>;
