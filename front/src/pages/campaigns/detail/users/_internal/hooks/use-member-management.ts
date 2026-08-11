import {
  useDemoteMember,
  usePromoteMember,
  useRemoveMember,
} from "../queries/use-member-actions";

export interface MemberManagement {
  /** Le membre dont l'action est en vol, pour ne figer QUE sa ligne. */
  pendingDisplayName: string | null;
  onPromote: (displayName: string) => void;
  onDemote: (displayName: string) => void;
  onRemove: (displayName: string) => void;
}

interface PendingMutation {
  isPending: boolean;
  variables: string | undefined;
}

export function useMemberManagement(campaignId: string): MemberManagement {
  const promote = usePromoteMember(campaignId);
  const demote = useDemoteMember(campaignId);
  const remove = useRemoveMember(campaignId);

  return {
    pendingDisplayName: pendingDisplayName(promote, demote, remove),
    onPromote: promote.mutate,
    onDemote: demote.mutate,
    onRemove: remove.mutate,
  };
}

function pendingDisplayName(
  promote: PendingMutation,
  demote: PendingMutation,
  remove: PendingMutation,
): string | null {
  const running = [promote, demote, remove].find(
    (mutation) => mutation.isPending,
  );

  return running?.variables ?? null;
}
