import { useSelfDemoteOwner, useSelfPromoteOwner } from "../queries/use-owner-role";
import type { OwnerToggle } from "../views/campaign-characters.view";

export function useOwnerToggle(campaignId: string, isOwner: boolean): OwnerToggle {
  const promote = useSelfPromoteOwner(campaignId);
  const demote = useSelfDemoteOwner(campaignId);

  return {
    isOwner,
    onPromote: () => promote.mutate(),
    onDemote: () => demote.mutate(),
    isPending: promote.isPending || demote.isPending,
  };
}
