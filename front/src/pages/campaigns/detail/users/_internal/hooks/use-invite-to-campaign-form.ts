import { useState } from "react";
import type { CampaignDetail } from "@donjon-dragon/shared";
import type { QueryState } from "@/shared/types/ui-state";
import { useCampaignDetail } from "@/shared/queries/use-campaign-detail";
import { useMyFriends, type CampaignFriend } from "../queries/use-my-friends";
import { useInviteToCampaign } from "../queries/use-invite-to-campaign";

export interface InviteToCampaignFormState {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friends: QueryState<CampaignFriend[]>;
  selectedDisplayName: string;
  onSelect: (displayName: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const NO_SELECTION = "";

export function useInviteToCampaignForm(
  campaignId: string,
): InviteToCampaignFormState {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(NO_SELECTION);
  const friends = useInvitableFriends(campaignId, open);
  const { submit, isSubmitting } = useInviteSubmit(campaignId, selected, () => {
    setSelected(NO_SELECTION);
    setOpen(false);
  });

  return {
    open,
    onOpenChange: setOpen,
    friends,
    selectedDisplayName: selected,
    onSelect: setSelected,
    onSubmit: submit,
    isSubmitting,
  };
}

/**
 * Les amis qu'on peut ENCORE inviter : ni déjà membres, ni déjà invités. Les
 * laisser dans le menu proposerait une action que le serveur refuse en 409, et
 * l'utilisateur ne découvrirait le problème qu'après avoir cliqué.
 */
function useInvitableFriends(
  campaignId: string,
  enabled: boolean,
): QueryState<CampaignFriend[]> {
  const friends = useMyFriends(enabled);
  const { data: campaign } = useCampaignDetail(campaignId);
  const taken = alreadyInCampaign(campaign);

  return {
    data: (friends.data ?? []).filter(
      (friend) => !taken.has(friend.friend.displayName),
    ),
    loading: friends.isLoading,
    error: friends.isError,
  };
}

/** Membres actifs et invités sans réponse : dans les deux cas, on ne réinvite pas. */
function alreadyInCampaign(campaign: CampaignDetail | undefined): Set<string> {
  if (!campaign) return new Set();

  const members = [
    ...campaign.gameMasters,
    ...campaign.players,
    ...campaign.pendingInvitees,
  ];

  return new Set(members.map((member) => member.displayName));
}

function useInviteSubmit(
  campaignId: string,
  displayName: string,
  onSent: () => void,
) {
  const invite = useInviteToCampaign();
  const submit = () =>
    invite.mutate({ campaignId, displayName }, { onSuccess: onSent });

  return { submit, isSubmitting: invite.isPending };
}
