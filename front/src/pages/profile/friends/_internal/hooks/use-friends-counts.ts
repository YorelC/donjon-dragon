import { useFriends } from "@/shared/queries/use-friends";
import { useSentRequests } from "../queries/use-sent-requests";

/** Les décomptes discrets posés sur les onglets Amis et Envoyées. */
export interface FriendsCounts {
  friends: number;
  sent: number;
}

export function useFriendsCounts(): FriendsCounts {
  const friendsQuery = useFriends(true);
  const sentQuery = useSentRequests(true);

  return {
    friends: friendsQuery.data?.length ?? 0,
    sent: sentQuery.data?.length ?? 0,
  };
}
