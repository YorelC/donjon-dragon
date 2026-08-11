import { useInvitationAnswer } from "../hooks/use-invitation-answer";
import { useCampaignInvitations } from "../queries/use-campaign-invitations";
import { CampaignInvitationsView } from "../views/campaign-invitations.view";

export function CampaignInvitationsContainer() {
  const invitationsQuery = useCampaignInvitations();
  const answer = useInvitationAnswer();

  return (
    <CampaignInvitationsView
      invitations={{
        data: invitationsQuery.data ?? [],
        loading: invitationsQuery.isLoading,
        error: invitationsQuery.isError,
      }}
      answer={answer}
    />
  );
}
