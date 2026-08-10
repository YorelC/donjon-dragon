import { useAcceptFriendRequest } from "../queries/use-accept-friend-request";
import { useRefuseFriendRequest } from "../queries/use-refuse-friend-request";

/** Accepter et refuser voyagent ensemble : ce sont les deux actions d'une demande. */
export interface RequestModeration {
  onAccept: (friendshipId: string) => void;
  onRefuse: (friendshipId: string) => void;
  acceptPending: boolean;
  refusePending: boolean;
}

export function useRequestModeration(): RequestModeration {
  const acceptMutation = useAcceptFriendRequest();
  const refuseMutation = useRefuseFriendRequest();

  return {
    onAccept: acceptMutation.mutate,
    onRefuse: refuseMutation.mutate,
    acceptPending: acceptMutation.isPending,
    refusePending: refuseMutation.isPending,
  };
}
