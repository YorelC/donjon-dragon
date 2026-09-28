import { useCampaignInvitationCount } from "@/shared/queries/use-campaign-invitation-count";
import { useReceivedCount } from "@/shared/queries/use-received-count";
import type { ProfileNavCounts } from "../constants/profile-nav-items";

/** Les compteurs des entrées de la barre : invitations de campagne, demandes d'amis. */
export function useProfileNavCounts(): ProfileNavCounts {
  const invitations = useCampaignInvitationCount();
  const requests = useReceivedCount();

  return {
    campaignInvitations: invitations.data?.count ?? 0,
    friendRequests: requests.data?.count ?? 0,
  };
}
