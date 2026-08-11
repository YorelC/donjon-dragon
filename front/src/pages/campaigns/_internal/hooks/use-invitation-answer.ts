import {
  useAcceptCampaignInvitation,
  useRefuseCampaignInvitation,
} from "../queries/use-answer-campaign-invitation";

export interface InvitationAnswer {
  /** La campagne dont la réponse est en vol, pour ne désactiver QUE sa ligne. */
  pendingCampaignId: string | null;
  onAccept: (campaignId: string) => void;
  onRefuse: (campaignId: string) => void;
}

interface PendingMutation {
  isPending: boolean;
  variables: string | undefined;
}

export function useInvitationAnswer(): InvitationAnswer {
  const accept = useAcceptCampaignInvitation();
  const refuse = useRefuseCampaignInvitation();

  return {
    pendingCampaignId: pendingCampaignId(accept, refuse),
    onAccept: accept.mutate,
    onRefuse: refuse.mutate,
  };
}

function pendingCampaignId(
  accept: PendingMutation,
  refuse: PendingMutation,
): string | null {
  if (accept.isPending) return accept.variables ?? null;
  if (refuse.isPending) return refuse.variables ?? null;

  return null;
}
