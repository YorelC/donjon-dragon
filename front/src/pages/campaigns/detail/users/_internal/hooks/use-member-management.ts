import {
  useDemoteMember,
  usePromoteMember,
  useRemoveMember,
} from "../queries/use-member-actions";
import { useCancelInvitation } from "../queries/use-cancel-invitation";

export interface MemberManagement {
  /** Le membre dont l'action est en vol, pour ne figer QUE sa ligne. */
  pendingDisplayName: string | null;
  onPromote: (displayName: string) => void;
  onDemote: (displayName: string) => void;
  onRemove: (displayName: string) => void;
  /** Une invitation ouverte s'annule, elle ne se retire pas : voir `onRemove`. */
  onCancelInvitation: (displayName: string) => void;
}

interface PendingMutation {
  isPending: boolean;
  variables: string | undefined;
}

export function useMemberManagement(campaignId: string): MemberManagement {
  const promote = usePromoteMember(campaignId);
  const demote = useDemoteMember(campaignId);
  const remove = useRemoveMember(campaignId);
  const cancelInvitation = useCancelInvitation(campaignId);

  return {
    pendingDisplayName: pendingDisplayName([promote, demote, remove, cancelInvitation]),
    onPromote: promote.mutate,
    onDemote: demote.mutate,
    onRemove: remove.mutate,
    onCancelInvitation: cancelInvitation.mutate,
  };
}

function pendingDisplayName(mutations: PendingMutation[]): string | null {
  const running = mutations.find((mutation) => mutation.isPending);

  return running?.variables ?? null;
}
