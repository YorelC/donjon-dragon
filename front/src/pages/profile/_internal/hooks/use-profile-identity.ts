import { useAuthStore } from "@/shared/stores/auth.store";
import { useFriends } from "@/shared/queries/use-friends";
import { useReceivedCount } from "@/shared/queries/use-received-count";

/** Le pied de la barre latérale : qui je suis, et l'état de mes compagnons. */
export interface ProfileIdentity {
  displayName: string;
  friendCount: number;
  pendingCount: number;
}

export function useProfileIdentity(): ProfileIdentity {
  const displayName = useAuthStore((state) => state.user?.displayName ?? "");
  const friendsQuery = useFriends(true);
  const receivedCountQuery = useReceivedCount();

  return {
    displayName,
    friendCount: friendsQuery.data?.length ?? 0,
    pendingCount: receivedCountQuery.data?.count ?? 0,
  };
}
